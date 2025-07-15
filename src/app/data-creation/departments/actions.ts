'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const departmentSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required.' }),
  collegeId: z.string().min(1, { message: 'Please select a college.' }),
});

export async function addDepartment(formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = {
    name: formData.get('name') as string,
    collegeId: formData.get('collegeId') as string,
  };

  const validatedFields = departmentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Invalid input.',
    };
  }

  try {
    await addDoc(collection(db, 'departments'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/data-creation/departments');
    return { success: true, message: 'Department added successfully.' };
  } catch (error) {
    console.error('Error adding department:', error);
    if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateDepartment(departmentId: string, formData: FormData): Promise<{ success: boolean; message: string }> {
    const values = {
        name: formData.get('name') as string,
        collegeId: formData.get('collegeId') as string,
      };
    
      const validatedFields = departmentSchema.safeParse(values);
    
      if (!validatedFields.success) {
        return {
          success: false,
          message: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Invalid input.',
        };
      }

  try {
    const departmentRef = doc(db, 'departments', departmentId);
    await updateDoc(departmentRef, validatedFields.data);
    revalidatePath('/data-creation/departments');
    return { success: true, message: 'Department updated successfully.' };
  } catch (error) {
    console.error('Error updating department:', error);
     if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message: string }> {
    if (!departmentId) {
        return { success: false, message: 'Department ID is missing.' };
    }
    try {
        await deleteDoc(doc(db, 'departments', departmentId));
        revalidatePath('/data-creation/departments');
        return { success: true, message: 'Department deleted successfully.' };
    } catch (error) {
        console.error('Error deleting department:', error);
        if (error instanceof Error) {
            return { success: false, message: `An unexpected error occurred: ${error.message}` };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
