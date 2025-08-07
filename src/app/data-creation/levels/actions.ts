
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const levelSchema = z.object({
  programId: z.string().min(1, { message: 'Please select a program.' }),
  level: z.coerce.number().min(1, { message: 'Level must be at least 1.' }).max(7, { message: 'Level cannot be greater than 7.' }),
  students_count: z.coerce.number().min(0, { message: 'Student count cannot be negative.' }),
});

export async function addLevel(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = {
    programId: formData.get('programId') as string,
    level: formData.get('level') as string,
    students_count: formData.get('students_count') as string,
  };

  const validatedFields = levelSchema.safeParse(values);

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = error.programId?.[0] || error.level?.[0] || error.students_count?.[0] || 'Invalid input.';
    return { success: false, message };
  }

  const { programId, level, students_count } = validatedFields.data;

  try {
    // Check for duplicates
    const q = query(collection(db, 'levels'), where('programId', '==', programId), where('level', '==', level));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: 'This level already exists for the selected program.' };
    }

    await addDoc(collection(db, 'levels'), {
      programId,
      level,
      students_count,
      createdAt: serverTimestamp(),
      promotion_rate: 1.00 // Default value
    });

    revalidatePath('/data-creation/levels');
    return { success: true, message: 'Level added successfully.' };
  } catch (error) {
    console.error('Error adding level:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateLevel(levelId: string, prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = {
    programId: formData.get('programId') as string,
    level: formData.get('level') as string,
    students_count: formData.get('students_count') as string,
  };

  const validatedFields = levelSchema.safeParse(values);

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = error.programId?.[0] || error.level?.[0] || error.students_count?.[0] || 'Invalid input.';
    return { success: false, message };
  }
  
  const { programId, level, students_count } = validatedFields.data;

  try {
     // Check for duplicates before updating
    const q = query(collection(db, 'levels'), where('programId', '==', programId), where('level', '==', level));
    const querySnapshot = await getDocs(q);
    // Ensure the found duplicate is not the document we are currently editing
    if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== levelId)) {
        return { success: false, message: 'This level already exists for the selected program.' };
    }

    const levelRef = doc(db, 'levels', levelId);
    await updateDoc(levelRef, {
        programId,
        level,
        students_count
    });
    revalidatePath('/data-creation/levels');
    return { success: true, message: 'Level updated successfully.' };
  } catch (error) {
    console.error('Error updating level:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteLevel(levelId: string): Promise<{ success: boolean; message: string }> {
    if (!levelId) {
        return { success: false, message: 'Level ID is missing.' };
    }
    try {
        const batch = writeBatch(db);

        // 1. Delete the level document itself
        const levelRef = doc(db, 'levels', levelId);
        batch.delete(levelRef);

        // 2. Find and delete all courses associated with this level
        const coursesQuery = query(collection(db, 'courses'), where('levelId', '==', levelId));
        const coursesSnapshot = await getDocs(coursesQuery);
        coursesSnapshot.forEach(courseDoc => {
            batch.delete(courseDoc.ref);
        });

        // Commit all batched writes
        await batch.commit();
        
        revalidatePath('/data-creation/levels');
        revalidatePath('/data-creation/courses'); // Also revalidate courses page
        return { success: true, message: 'Level and all associated courses deleted successfully.' };
    } catch (error) {
        console.error('Error deleting level and associated courses:', error);
        if (error instanceof Error) {
            return { success: false, message: `An error occurred: ${error.message}` };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

const importLevelSchema = z.object({
  level: z.coerce.number().min(1).max(7),
  students_count: z.coerce.number().min(0),
});

export async function importLevels(programId: string, levels: any[]): Promise<{ success: boolean; message: string }> {
  if (!programId || !levels || levels.length === 0) {
    return { success: false, message: 'Program ID and a list of levels are required.' };
  }

  const batch = writeBatch(db);
  let processedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    const existingLevelsSnapshot = await getDocs(query(collection(db, 'levels'), where('programId', '==', programId)));
    const existingLevels = new Set(existingLevelsSnapshot.docs.map(doc => doc.data().level));

    for (const levelData of levels) {
      const validatedFields = importLevelSchema.safeParse(levelData);
      
      if (!validatedFields.success) {
        errorCount++;
        errors.push(`Row with level ${levelData.level || 'N/A'}: Invalid data format.`);
        continue;
      }
      
      const { level, students_count } = validatedFields.data;
      
      if (existingLevels.has(level)) {
        errorCount++;
        errors.push(`Row with level ${level}: Level already exists for this program.`);
        continue;
      }

      const newLevelRef = doc(collection(db, 'levels'));
      batch.set(newLevelRef, {
        programId,
        level,
        students_count,
        createdAt: serverTimestamp(),
      });
      
      processedCount++;
      existingLevels.add(level);
    }

    if (processedCount > 0) {
      await batch.commit();
    }
    
    revalidatePath('/data-creation/levels');

    let message = `${processedCount} levels imported successfully.`;
    if (errorCount > 0) {
      message += ` ${errorCount} rows failed. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
    }

    return { success: processedCount > 0, message };

  } catch (error) {
    console.error('Error importing levels:', error);
    return { success: false, message: 'An unexpected error occurred during the import process.' };
  }
}
