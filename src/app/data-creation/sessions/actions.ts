
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

    const allLevels = allLevelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level));

    for (const programDoc of programsSnapshot.docs) {
      const program = { id: programDoc.id, ...programDoc.data() } as Program;
      
      const levelsForProgram = allLevels
        .filter(l => l.programId === program.id)
        .sort((a, b) => b.level - a.level); // Sort descending: 500, 400, 300...

      if (levelsForProgram.length === 0) continue;

      let studentsFromBelow = 0; // Starts at 0, representing graduating students for the top level.
      
      for (const level of levelsForProgram) {
        const currentStudentCount = level.students_count;
        const levelRef = doc(db, 'levels', level.id);
        
        // Update the current level with the count from the level below it
        batch.update(levelRef, { students_count: studentsFromBelow });
        
        // Pass the current level's original count down to the next iteration
        studentsFromBelow = currentStudentCount;
      }
      
      // After loop, studentsFromBelow holds the original 100L count.
      // Now, we find the new Level 1 and set its count to 0 for new intake.
      const levelOne = levelsForProgram.find(l => l.level === 1);
      if(levelOne) {
          const levelOneRef = doc(db, 'levels', levelOne.id);
          batch.update(levelOneRef, { students_count: 0 });
      }
    }

    await batch.commit();

    revalidatePath('/data-creation/levels');
    revalidatePath('/data-creation/sessions');
    revalidatePath('/'); // Revalidate dashboard/home page

    return { success: true, message: 'Student promotion process completed successfully! Please populate the new Level 1 batches.' };
  } catch (error) {
    console.error('Error during student promotion:', error);
    if (error instanceof Error) {
        return { success: false, message: `An error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during promotion.' };
  }
}
