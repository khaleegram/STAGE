'use server';

import { db } from '@/lib/firebase';
import { College } from '@/lib/types';
import { addDoc, collection, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const collegeSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters long.'),
  code: z.string().min(2, 'College code must be at least 2 characters long.').max(10, 'College code cannot exceed 10 characters.'),
  short_name: z.string().min(2, 'Short name must be at least 2 characters long.').max(10, 'Short name cannot exceed 10 characters.'),
});

export async function addCollege(values: z.infer<typeof collegeSchema>): Promise<{ success: boolean; message: string; }> {
  try {
    const validatedData = collegeSchema.parse(values);
    await addDoc(collection(db, 'colleges'), {
      ...validatedData,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/colleges');
    return { success: true, message: 'College added successfully.' };
  } catch (error) {
    console.error('Error adding college:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid data provided. Please check your inputs.' };
    }
    // Return a more specific error message
    if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
}

export async function updateCollege(id: string, values: z.infer<typeof collegeSchema>) {
  try {
    const validatedData = collegeSchema.parse(values);
    const collegeRef = doc(db, 'colleges', id);
    await updateDoc(collegeRef, validatedData);
    revalidatePath('/colleges');
    return { success: true, message: 'College updated successfully.' };
  } catch (error) {
    console.error('Error updating college:', error);
     if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid data provided.' };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteCollege(id: string) {
  try {
    const collegeRef = doc(db, 'colleges', id);
    await deleteDoc(collegeRef);
    revalidatePath('/colleges');
    return { success: true, message: 'College deleted successfully.' };
  } catch (error) {
    console.error('Error deleting college:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
