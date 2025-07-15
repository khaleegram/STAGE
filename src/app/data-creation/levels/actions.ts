
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const levelSchema = z.object({
  programId: z.string().min(1, { message: 'Please select a program.' }),
  level: z.coerce.number().min(1, { message: 'Level must be at least 1.' }).max(5, { message: 'Level cannot be greater than 5.' }),
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
        await deleteDoc(doc(db, 'levels', levelId));
        revalidatePath('/data-creation/levels');
        return { success: true, message: 'Level deleted successfully.' };
    } catch (error) {
        console.error('Error deleting level:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
