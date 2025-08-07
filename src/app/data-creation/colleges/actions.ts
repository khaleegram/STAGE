
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const collegeSchema = z.object({
  name: z.string().min(1, { message: 'College name is required.' }),
  code: z.string().min(1, { message: 'College code is required.' }),
});

export async function addCollege(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = {
    name: formData.get('name') as string,
    code: formData.get('code') as string,
  };

  const validatedFields = collegeSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Invalid input.',
    };
  }

  try {
    await addDoc(collection(db, 'colleges'), {
      ...validatedFields.data,
      short_name: validatedFields.data.code,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/data-creation/colleges');
    return { success: true, message: 'College added successfully.' };
  } catch (error) {
    console.error('Error adding college:', error);
    if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateCollege(collegeId: string, prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
    const values = {
        name: formData.get('name') as string,
        code: formData.get('code') as string,
      };
    
      const validatedFields = collegeSchema.safeParse(values);
    
      if (!validatedFields.success) {
        return {
          success: false,
          message: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Invalid input.',
        };
      }

  try {
    const collegeRef = doc(db, 'colleges', collegeId);
    await updateDoc(collegeRef, {
        ...validatedFields.data,
        short_name: validatedFields.data.code,
    });
    revalidatePath('/data-creation/colleges');
    return { success: true, message: 'College updated successfully.' };
  } catch (error) {
    console.error('Error updating college:', error);
     if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteCollege(collegeId: string): Promise<{ success: boolean; message: string }> {
    if (!collegeId) {
        return { success: false, message: 'College ID is missing.' };
    }
    try {
        await deleteDoc(doc(db, 'colleges', collegeId));
        revalidatePath('/data-creation/colleges');
        return { success: true, message: 'College deleted successfully.' };
    } catch (error) {
        console.error('Error deleting college:', error);
        if (error instanceof Error) {
            return { success: false, message: `An unexpected error occurred: ${error.message}` };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function deleteSelectedColleges(collegeIds: string[]): Promise<{ success: boolean; message: string }> {
  if (!collegeIds || collegeIds.length === 0) {
    return { success: false, message: 'No college IDs provided.' };
  }

  const batch = writeBatch(db);

  for (const collegeId of collegeIds) {
    // Note: This is a simple deletion. A more robust implementation would
    // also handle cascading deletes for departments, programs, etc. within this college.
    // For now, we just delete the college document.
    const collegeRef = doc(db, 'colleges', collegeId);
    batch.delete(collegeRef);
  }

  try {
    await batch.commit();
    revalidatePath('/data-creation/colleges');
    return { success: true, message: `${collegeIds.length} college(s) deleted successfully.` };
  } catch (error) {
    console.error('Error deleting selected colleges:', error);
    if (error instanceof Error) {
      return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred during bulk deletion.' };
  }
}

export async function importColleges(colleges: z.infer<typeof collegeSchema>[]): Promise<{ success: boolean; message: string }> {
  if (!colleges || colleges.length === 0) {
    return { success: false, message: 'No college data provided.' };
  }

  const batch = writeBatch(db);
  let processedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    const existingCollegesSnapshot = await getDocs(query(collection(db, 'colleges')));
    const existingCollegeCodes = new Set(existingCollegesSnapshot.docs.map(doc => doc.data().code));
    
    for (const college of colleges) {
      const validatedFields = collegeSchema.safeParse(college);
      
      if (!validatedFields.success) {
        errorCount++;
        errors.push(`Row with code ${college.code || 'N/A'}: Invalid data format.`);
        continue;
      }
      
      const { code, name } = validatedFields.data;
      
      if (existingCollegeCodes.has(code)) {
        errorCount++;
        errors.push(`Row with code ${code}: College code already exists.`);
        continue;
      }

      const newCollegeRef = doc(collection(db, 'colleges'));
      batch.set(newCollegeRef, {
        name,
        code,
        short_name: code,
        createdAt: serverTimestamp(),
      });
      
      processedCount++;
      existingCollegeCodes.add(code);
    }

    if (processedCount > 0) {
      await batch.commit();
    }
    
    revalidatePath('/data-creation/colleges');

    let message = `${processedCount} colleges imported successfully.`;
    if (errorCount > 0) {
      message += ` ${errorCount} rows failed. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
    }

    return { success: processedCount > 0, message };

  } catch (error) {
    console.error('Error importing colleges:', error);
    return { success: false, message: 'An unexpected error occurred during the import process.' };
  }
}
