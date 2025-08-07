
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { College } from '@/lib/types';

const departmentSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required.' }),
  collegeId: z.string().min(1, { message: 'Please select a college.' }),
});

export async function addDepartment(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
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

export async function updateDepartment(departmentId: string, prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
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


export async function deleteSelectedDepartments(departmentIds: string[]): Promise<{ success: boolean; message: string }> {
  if (!departmentIds || departmentIds.length === 0) {
    return { success: false, message: 'No department IDs provided.' };
  }

  const batch = writeBatch(db);

  departmentIds.forEach(id => {
    const deptRef = doc(db, 'departments', id);
    batch.delete(deptRef);
  });

  try {
    await batch.commit();
    revalidatePath('/data-creation/departments');
    return { success: true, message: `${departmentIds.length} department(s) deleted successfully.` };
  } catch (error) {
    console.error('Error deleting selected departments:', error);
    if (error instanceof Error) {
      return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred during bulk deletion.' };
  }
}

const importDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  college_name: z.string().min(1, "College name is required"),
});

export async function importDepartments(departments: any[], colleges: College[]): Promise<{ success: boolean; message: string }> {
  if (!departments || departments.length === 0) {
    return { success: false, message: 'No department data provided.' };
  }

  const batch = writeBatch(db);
  let processedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    const collegeMap = new Map(colleges.map(c => [c.name.toLowerCase(), c.id]));
    const existingDeptsSnapshot = await getDocs(query(collection(db, 'departments')));
    const existingDeptNames = new Set(existingDeptsSnapshot.docs.map(d => d.data().name.toLowerCase()));

    for (const department of departments) {
      const validatedFields = importDepartmentSchema.safeParse(department);
      
      if (!validatedFields.success) {
        errorCount++;
        errors.push(`Row with name ${department.name || 'N/A'}: Invalid data format.`);
        continue;
      }
      
      const { name, college_name } = validatedFields.data;
      
      if (existingDeptNames.has(name.toLowerCase())) {
        errorCount++;
        errors.push(`Row with name ${name}: Department already exists.`);
        continue;
      }
      
      const collegeId = collegeMap.get(college_name.toLowerCase());
      if (!collegeId) {
        errorCount++;
        errors.push(`Row with name ${name}: College "${college_name}" not found.`);
        continue;
      }

      const newDeptRef = doc(collection(db, 'departments'));
      batch.set(newDeptRef, {
        name,
        collegeId,
        createdAt: serverTimestamp(),
      });
      
      processedCount++;
      existingDeptNames.add(name.toLowerCase());
    }

    if (processedCount > 0) {
      await batch.commit();
    }
    
    revalidatePath('/data-creation/departments');

    let message = `${processedCount} departments imported successfully.`;
    if (errorCount > 0) {
      message += ` ${errorCount} rows failed. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
    }

    return { success: processedCount > 0, message };

  } catch (error) {
    console.error('Error importing departments:', error);
    return { success: false, message: 'An unexpected error occurred during the import process.' };
  }
}
