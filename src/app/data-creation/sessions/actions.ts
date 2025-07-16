
'use server';

import { db } from '@/lib/firebase';
import { Program, Level } from '@/lib/types';
import {
  collection,
  doc,
  getDocs,
  query,
  writeBatch,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  getDoc
} from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const sessionSchema = z.object({
  session_name: z.string().regex(/^\d{4}\/\d{4}$/, 'Session name must be in YYYY/YYYY format.'),
  status: z.enum(['open', 'closed', 'locked']),
});

export async function addSession(prevState: any, formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = sessionSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.session_name?.[0] || 'Invalid data' };
  }

  const [start_year, end_year] = validatedFields.data.session_name.split('/').map(Number);

  try {
    await addDoc(collection(db, 'academic_sessions'), {
      ...validatedFields.data,
      start_year,
      end_year,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/data-creation/sessions');
    return { success: true, message: 'Session added successfully.' };
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateSession(sessionId: string, prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = sessionSchema.safeParse(values);
  
    if (!validatedFields.success) {
      return { success: false, message: validatedFields.error.flatten().fieldErrors.session_name?.[0] || 'Invalid data' };
    }
  
    const [start_year, end_year] = validatedFields.data.session_name.split('/').map(Number);
  
    try {
      const sessionRef = doc(db, 'academic_sessions', sessionId);
      await updateDoc(sessionRef, {
        ...validatedFields.data,
        start_year,
        end_year,
      });
      revalidatePath('/data-creation/sessions');
      return { success: true, message: 'Session updated successfully.' };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function deleteSession(sessionId: string) {
    try {
        await deleteDoc(doc(db, 'academic_sessions', sessionId));
        revalidatePath('/data-creation/sessions');
        return { success: true, message: 'Session deleted successfully.' };
    } catch (error) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


const semesterSchema = z.object({
    semester_number: z.coerce.number().min(1).max(2),
    start_date: z.string().min(1, 'Start date is required.'),
    end_date: z.string().optional(),
    status: z.enum(['open', 'closed']),
});

export async function addSemester(sessionId: string, prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = semesterSchema.safeParse(values);
    
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid data provided for semester.' };
    }
    
    try {
        const semesterCollectionRef = collection(db, 'academic_sessions', sessionId, 'semesters');
        await addDoc(semesterCollectionRef, {
            ...validatedFields.data,
            start_date: new Date(validatedFields.data.start_date),
            end_date: validatedFields.data.end_date ? new Date(validatedFields.data.end_date) : null,
        });
        revalidatePath('/data-creation/sessions');
        return { success: true, message: 'Semester added successfully.' };
    } catch (error) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateSemester(semesterId: string, sessionId: string, prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = semesterSchema.safeParse(values);
    
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid data provided for semester.' };
    }
    
    try {
        const semesterRef = doc(db, 'academic_sessions', sessionId, 'semesters', semesterId);
        await updateDoc(semesterRef, {
            ...validatedFields.data,
            start_date: new Date(validatedFields.data.start_date),
            end_date: validatedFields.data.end_date ? new Date(validatedFields.data.end_date) : null,
        });
        revalidatePath('/data-creation/sessions');
        return { success: true, message: 'Semester updated successfully.' };
    } catch (error) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function deleteSemester(semesterId: string, sessionId: string) {
    try {
        await deleteDoc(doc(db, 'academic_sessions', sessionId, 'semesters', semesterId));
        revalidatePath('/data-creation/sessions');
        return { success: true, message: 'Semester deleted successfully.' };
    } catch (error) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function promoteStudents(): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    const allLevelsSnapshot = await getDocs(collection(db, 'levels'));

    if (programsSnapshot.empty) {
      return { success: false, message: 'No programs found to process.' };
    }

    const allPrograms = programsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
    const allLevels = allLevelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level));

    const levelsByProgram = allLevels.reduce((acc, level) => {
      if (!acc[level.programId]) {
        acc[level.programId] = [];
      }
      acc[level.programId].push(level);
      return acc;
    }, {} as Record<string, Level[]>);


    for (const program of allPrograms) {
        const programLevels = levelsByProgram[program.id] || [];
        if (programLevels.length === 0) continue;

        programLevels.sort((a, b) => a.level - b.level);
        
        let studentsToCarryOver = 0;

        for (let i = 0; i < program.max_level; i++) {
            const currentLevelNumber = i + 1;
            const currentLevel = programLevels.find(l => l.level === currentLevelNumber);

            if (!currentLevel) {
                 // If the current level doesn't exist, we might need to create it if there are students to promote into it.
                 if (studentsToCarryOver > 0) {
                    const newLevelRef = doc(collection(db, 'levels'));
                    batch.set(newLevelRef, {
                        programId: program.id,
                        level: currentLevelNumber,
                        students_count: studentsToCarryOver,
                        createdAt: serverTimestamp(),
                        promotion_rate: 1.00
                    });
                    // The students have been placed, so reset the carry-over.
                    studentsToCarryOver = 0;
                }
                continue; // Move to the next level number
            }

            // We found the current level, let's process it.
            const tempStudentCount = currentLevel.students_count;
            const levelRef = doc(db, 'levels', currentLevel.id);
            batch.update(levelRef, { students_count: studentsToCarryOver });
            
            studentsToCarryOver = tempStudentCount;
        }
        
        // After the loop, `studentsToCarryOver` holds the count from the final level, who have now graduated.
    }

    await batch.commit();

    revalidatePath('/data-creation/levels');
    revalidatePath('/data-creation/sessions');
    revalidatePath('/data-creation/programs'); 
    revalidatePath('/'); 

    return { success: true, message: 'Student promotion process completed successfully! Check for any Level 1 groups that need new population.' };
  } catch (error) {
    console.error('Error during student promotion:', error);
    if (error instanceof Error) {
        return { success: false, message: `An error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during promotion.' };
  }
}
