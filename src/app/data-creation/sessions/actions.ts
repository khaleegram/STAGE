
'use server';

import { db } from '@/lib/firebase';
import { Program, Level } from '@/lib/types';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
  writeBatch,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
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
        // Note: In a real app, you'd also want to delete subcollections like semesters.
        // This is a simplified deletion for now.
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
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    if (programsSnapshot.empty) {
      return { success: false, message: 'No programs found to process.' };
    }

    const batch = writeBatch(db);

    for (const programDoc of programsSnapshot.docs) {
      const program = { id: programDoc.id, ...programDoc.data() } as Program;
      
      const levelsQuery = query(collection(db, 'levels'), where('programId', '==', program.id));
      const levelsSnapshot = await getDocs(levelsQuery);
      
      const levels = levelsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Level))
        .sort((a, b) => b.level - a.level); // Sort descending (400L, 300L, etc.)

      if (levels.length === 0) continue;

      let studentsToPromoteFromBelow = 0;

      // Iterate from the highest level down to the lowest
      for (const level of levels) {
        const levelRef = doc(db, 'levels', level.id);
        const currentStudentsInLevel = level.students_count;
        
        // This is the new count for the current level in the loop
        const newCountForThisLevel = studentsToPromoteFromBelow;
        
        // Update the current level with the count from the level below it
        batch.update(levelRef, { students_count: newCountForThisLevel });

        // Now, set the number of students to be promoted for the *next* iteration (the level above this one)
        // For now, we assume 100% promotion rate
        studentsToPromoteFromBelow = currentStudentsInLevel;
      }
      
      // Handle new intake for 100 Level
      const firstLevel = levels.find(l => l.level === 1);
      if (firstLevel) {
        const firstLevelRef = doc(db, 'levels', firstLevel.id);
        // The new intake becomes the count for 100L.
        // The previous 100L students have already been promoted to 200L.
        batch.update(firstLevelRef, { students_count: program.expected_intake || 0 });
      }
    }

    await batch.commit();
    revalidatePath('/data-creation/levels');
    revalidatePath('/data-creation/sessions'); // Revalidate sessions page as well

    return { success: true, message: 'Student promotion process completed successfully!' };
  } catch (error) {
    console.error('Error during student promotion:', error);
    if (error instanceof Error) {
        return { success: false, message: `An error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during promotion.' };
  }
}
