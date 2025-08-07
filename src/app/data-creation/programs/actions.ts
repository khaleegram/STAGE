
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Department } from '@/lib/types';

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
        const batch = writeBatch(db);
        
        // 1. Delete program document
        const programRef = doc(db, 'programs', programId);
        batch.delete(programRef);
        
        // 2. Find and delete associated levels
        const levelsQuery = query(collection(db, 'levels'), where('programId', '==', programId));
        const levelsSnapshot = await getDocs(levelsQuery);
        levelsSnapshot.forEach(levelDoc => {
            batch.delete(levelDoc.ref);
        });

        await batch.commit();

        revalidatePath('/data-creation/programs');
        revalidatePath('/data-creation/levels');
        return { success: true, message: 'Program and all its levels deleted successfully.' };
    } catch (error) {
        console.error('Error deleting program:', error);
        if (error instanceof Error) {
            return { success: false, message: `An unexpected error occurred: ${error.message}` };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function deleteSelectedPrograms(programIds: string[]): Promise<{ success: boolean; message: string }> {
    if (!programIds || programIds.length === 0) {
      return { success: false, message: 'No program IDs provided.' };
    }
  
    const batch = writeBatch(db);
  
    for (const id of programIds) {
      const programRef = doc(db, 'programs', id);
      batch.delete(programRef);
      // Also delete associated levels
      const levelsQuery = query(collection(db, 'levels'), where('programId', '==', id));
      const levelsSnapshot = await getDocs(levelsQuery);
      levelsSnapshot.forEach(levelDoc => batch.delete(levelDoc.ref));
    }
  
    try {
      await batch.commit();
      revalidatePath('/data-creation/programs');
      revalidatePath('/data-creation/levels');
      return { success: true, message: `${programIds.length} program(s) and their levels deleted.` };
    } catch (error) {
      console.error('Error deleting selected programs:', error);
      if (error instanceof Error) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
      }
      return { success: false, message: 'An unexpected error occurred during bulk deletion.' };
    }
}

const importProgramSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department_name: z.string().min(1, "Department name is required"),
  max_level: z.coerce.number().min(1).max(7),
});
    
export async function importPrograms(programs: any[], departments: Department[]): Promise<{ success: boolean; message: string }> {
  if (!programs || programs.length === 0) {
    return { success: false, message: 'No program data provided.' };
  }

  const batch = writeBatch(db);
  let processedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    const deptMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]));
    const existingProgramsSnapshot = await getDocs(query(collection(db, 'programs')));
    const existingProgramNames = new Set(existingProgramsSnapshot.docs.map(d => d.data().name.toLowerCase()));

    for (const program of programs) {
      const validatedFields = importProgramSchema.safeParse(program);
      
      if (!validatedFields.success) {
        errorCount++;
        errors.push(`Row with name ${program.name || 'N/A'}: Invalid data format.`);
        continue;
      }
      
      const { name, department_name, max_level } = validatedFields.data;
      const formattedName = toTitleCase(name);
      
      if (existingProgramNames.has(formattedName.toLowerCase())) {
        errorCount++;
        errors.push(`Row with name ${name}: Program already exists.`);
        continue;
      }
      
      const departmentId = deptMap.get(department_name.toLowerCase());
      if (!departmentId) {
        errorCount++;
        errors.push(`Row with name ${name}: Department "${department_name}" not found.`);
        continue;
      }

      const newProgramRef = doc(collection(db, 'programs'));
      batch.set(newProgramRef, {
        name: formattedName,
        departmentId,
        max_level,
        expected_intake: 0,
        createdAt: serverTimestamp(),
      });
      
      processedCount++;
      existingProgramNames.add(formattedName.toLowerCase());
    }

    if (processedCount > 0) {
      await batch.commit();
    }
    
    revalidatePath('/data-creation/programs');

    let message = `${processedCount} programs imported successfully.`;
    if (errorCount > 0) {
      message += ` ${errorCount} rows failed. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
    }

    return { success: processedCount > 0, message };

  } catch (error) {
    console.error('Error importing programs:', error);
    return { success: false, message: 'An unexpected error occurred during the import process.' };
  }
}
