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


// This is a simplified promotion logic. A real-world scenario would be more complex,
// involving student records, grades, etc. This focuses on updating student counts per level.
export async function promoteStudents(): Promise<{ success: boolean; message: string }> {
  try {
    const programsCollection = collection(db, 'programs');
    const programSnapshot = await getDocs(programsCollection);

    if (programSnapshot.empty) {
      return { success: false, message: 'No programs found to process.' };
    }

    const batch = writeBatch(db);

    for (const programDoc of programSnapshot.docs) {
      const program = { id: programDoc.id, ...programDoc.data() } as Program;
      const levelsCollection = collection(db, 'levels');
      const q = query(levelsCollection, where('programId', '==', program.id));
      const levelsSnapshot = await getDocs(q);

      const levels: Level[] = levelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
      })) as Level[];

      // Sort levels in descending order to avoid overwriting counts before they are used.
      levels.sort((a, b) => b.level - a.level);
      
      let studentsForNextLevel = 0;

      for (const level of levels) {
          const currentStudents = level.students_count;
          // In a real app, promotion_rate would be fetched, here it's assumed to be 100%
          const studentsToPromote = Math.floor(currentStudents * 1.0);
          
          const levelRef = doc(db, 'levels', level.id);

          if (level.level === program.max_level) {
              // These students graduate. In a real app, you'd move them to an 'alumni' collection.
              // For now, we just clear the count.
              batch.update(levelRef, { students_count: 0 });
          } else {
              // Update current level with students who did not get promoted
              batch.update(levelRef, { students_count: currentStudents - studentsToPromote });
              // The next level (which is the previous one in our descending loop) will receive these students.
              const nextLevelData = levels.find(l => l.level === level.level + 1);
              if (nextLevelData) {
                  const nextLevelRef = doc(db, 'levels', nextLevelData.id);
                  // We get the original count and add the promoted students
                  const originalNextLevelCount = nextLevelData.students_count || 0;
                  batch.update(nextLevelRef, { students_count: originalNextLevelCount + studentsToPromote });
              }
          }
      }
      
      // Handle new intake for 100 Level
      const firstLevel = levels.find(l => l.level === 1);
      if (firstLevel) {
          const firstLevelRef = doc(db, 'levels', firstLevel.id);
          // Here we are adding the expected intake to any existing students.
          // You might want to just set it to expected_intake instead.
          batch.update(firstLevelRef, { students_count: (firstLevel.students_count || 0) + (program.expected_intake || 0) });
      }
    }

    await batch.commit();
    revalidatePath('/data-creation/levels');

    return { success: true, message: 'Student promotion process completed successfully!' };
  } catch (error) {
    console.error('Error during student promotion:', error);
    if (error instanceof Error) {
        return { success: false, message: `An error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during promotion.' };
  }
}
