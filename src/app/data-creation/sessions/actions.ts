
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
  getDoc,
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
  
  const batch = writeBatch(db);

  try {
    // 1. Create the session document
    const sessionRef = doc(collection(db, 'academic_sessions'));
    batch.set(sessionRef, {
        ...validatedFields.data,
        start_year,
        end_year,
        createdAt: serverTimestamp(),
    });

    // 2. Automatically create First Semester for this session
    const firstSemesterRef = doc(collection(db, 'academic_sessions', sessionRef.id, 'semesters'));
    batch.set(firstSemesterRef, {
        semester_number: 1,
        status: 'open',
        start_date: null,
        end_date: null,
    });
    
    // 3. Automatically create Second Semester for this session
    const secondSemesterRef = doc(collection(db, 'academic_sessions', sessionRef.id, 'semesters'));
    batch.set(secondSemesterRef, {
        semester_number: 2,
        status: 'closed',
        start_date: null,
        end_date: null,
    });
    
    await batch.commit();

    revalidatePath('/data-creation/sessions');
    return { success: true, message: 'Session and its two semesters created successfully.' };
  } catch (error) {
    console.error("Error creating session and semesters: ", error);
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
        const batch = writeBatch(db);
        const sessionRef = doc(db, 'academic_sessions', sessionId);

        // Delete all semesters within the session
        const semestersSnapshot = await getDocs(collection(sessionRef, 'semesters'));
        semestersSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the session itself
        batch.delete(sessionRef);

        await batch.commit();

        revalidatePath('/data-creation/sessions');
        return { success: true, message: 'Session and its semesters deleted successfully.' };
    } catch (error) {
        console.error("Error deleting session:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


const semesterSchema = z.object({
    semester_number: z.coerce.number().min(1).max(2),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.enum(['open', 'closed', 'locked']),
});

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
            start_date: validatedFields.data.start_date ? new Date(validatedFields.data.start_date) : null,
            end_date: validatedFields.data.end_date ? new Date(validatedFields.data.end_date) : null,
        });
        revalidatePath('/data-creation/sessions');
        return { success: true, message: 'Semester updated successfully.' };
    } catch (error) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateSemesterStatus(semesterId: string, sessionId: string, status: 'open' | 'closed' | 'locked') {
    if (!semesterId || !sessionId || !status) {
        return { success: false, message: 'Missing required fields.' };
    }
    try {
        const semesterRef = doc(db, 'academic_sessions', sessionId, 'semesters', semesterId);
        await updateDoc(semesterRef, { status });
        revalidatePath('/data-creation/sessions');
        return { success: true, message: `Semester status updated to ${status}.` };
    } catch (error) {
        console.error('Error updating semester status:', error);
        return { success: false, message: 'Failed to update semester status.' };
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
  const batch = writeBatch(db);
  const programsSnapshot = await getDocs(query(collection(db, 'programs'), orderBy('name')));
  const allPrograms = programsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));

  try {
    for (const program of allPrograms) {
        const levelsSnapshot = await getDocs(query(collection(db, 'levels'), where('programId', '==', program.id), orderBy('level')));
        const programLevels = levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level));

        let promotionQueue = 0; // This will hold the count of students moving up
        let studentsToGraduate = 0;

        // Iterate from Level 1 upwards
        for (let i = 1; i <= program.max_level; i++) {
            const currentLevelData = programLevels.find(l => l.level === i);
            
            if (currentLevelData) {
                // This is a level that exists
                const studentsFromBelow = promotionQueue;
                promotionQueue = currentLevelData.students_count; // The current students will be queued for the next level

                const levelRef = doc(db, 'levels', currentLevelData.id);
                batch.update(levelRef, { students_count: studentsFromBelow });
            } else {
                // This level does not exist, but we might need to create it for students from below
                const studentsFromBelow = promotionQueue;
                promotionQueue = 0; // No students were at this non-existent level to be promoted

                if (studentsFromBelow > 0) {
                     const newLevelRef = doc(collection(db, 'levels'));
                      batch.set(newLevelRef, {
                          programId: program.id,
                          level: i,
                          students_count: studentsFromBelow,
                          createdAt: serverTimestamp(),
                      });
                }
            }
        }
        
        // After the loop, promotionQueue holds the students from the final level
        studentsToGraduate = promotionQueue;
        console.log(`Program ${program.name}: Graduating ${studentsToGraduate} students.`);

        // Reset Level 1 to 0 for new intake
        const levelOne = programLevels.find(l => l.level === 1);
        if (levelOne) {
            batch.update(doc(db, 'levels', levelOne.id), { students_count: 0 });
        } else {
            // If level 1 doesn't exist for some reason, create it with 0 students
            const newLevelOneRef = doc(collection(db, 'levels'));
            batch.set(newLevelOneRef, {
                programId: program.id,
                level: 1,
                students_count: 0,
                createdAt: serverTimestamp()
            });
        }
    }

    await batch.commit();

    revalidatePath('/data-creation/levels');
    revalidatePath('/data-creation/sessions');
    return { success: true, message: 'Student promotion process completed successfully! Level 1 groups now require new population.' };
  } catch (error) {
    console.error('Error during student promotion:', error);
    if (error instanceof Error) {
        return { success: false, message: `An error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during promotion.' };
  }
}
