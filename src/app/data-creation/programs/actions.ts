
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const programSchema = z.object({
  name: z.string().min(1, { message: 'Program name is required.' }),
  departmentId: z.string().min(1, { message: 'Please select a department.' }),
  max_level: z.coerce.number().min(1, 'Max level must be at least 1.').max(7, 'Max level cannot be more than 7.'),
});

// Utility to convert a string to Title Case
function toTitleCase(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
}

export async function addProgram(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = {
    name: formData.get('name') as string,
    departmentId: formData.get('departmentId') as string,
    max_level: formData.get('max_level') as string,
  };

  const validatedFields = programSchema.safeParse(values);

  if (!validatedFields.success) {
    const errorMsg = validatedFields.error.flatten().fieldErrors.name?.[0] 
                  || validatedFields.error.flatten().fieldErrors.departmentId?.[0] 
                  || validatedFields.error.flatten().fieldErrors.max_level?.[0]
                  || 'Invalid input.';
    return {
      success: false,
      message: errorMsg,
    };
  }
  
  const formattedName = toTitleCase(validatedFields.data.name);

  try {
    await addDoc(collection(db, 'programs'), {
      name: formattedName,
      departmentId: validatedFields.data.departmentId,
      max_level: validatedFields.data.max_level,
      createdAt: serverTimestamp(),
      expected_intake: 0 // Default value
    });
    revalidatePath('/data-creation/programs');
    return { success: true, message: 'Program added successfully.' };
  } catch (error) {
    console.error('Error adding program:', error);
    if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateProgram(programId: string, prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
    const values = {
        name: formData.get('name') as string,
        departmentId: formData.get('departmentId') as string,
        max_level: formData.get('max_level') as string,
    };
    
    const validatedFields = programSchema.safeParse(values);

    if (!validatedFields.success) {
        const errorMsg = validatedFields.error.flatten().fieldErrors.name?.[0] 
                      || validatedFields.error.flatten().fieldErrors.departmentId?.[0] 
                      || validatedFields.error.flatten().fieldErrors.max_level?.[0]
                      || 'Invalid input.';
        return {
          success: false,
          message: errorMsg,
        };
    }
    
    const formattedName = toTitleCase(validatedFields.data.name);

  try {
    const programRef = doc(db, 'programs', programId);
    await updateDoc(programRef, {
        name: formattedName,
        departmentId: validatedFields.data.departmentId,
        max_level: validatedFields.data.max_level,
    });
    revalidatePath('/data-creation/programs');
    return { success: true, message: 'Program updated successfully.' };
  } catch (error) {
    console.error('Error updating program:', error);
     if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteProgram(programId: string): Promise<{ success: boolean; message: string }> {
    if (!programId) {
        return { success: false, message: 'Program ID is missing.' };
    }
    try {
        await deleteDoc(doc(db, 'programs', programId));
        revalidatePath('/data-creation/programs');
        return { success: true, message: 'Program deleted successfully.' };
    } catch (error) {
        console.error('Error deleting program:', error);
        if (error instanceof Error) {
            return { success: false, message: `An unexpected error occurred: ${error.message}` };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
