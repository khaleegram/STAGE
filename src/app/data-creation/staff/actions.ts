
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, where, query, getDocs, writeBatch } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const staffSchema = z.object({
  name: z.string().min(1, 'Staff name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  position: z.string().min(1, 'Position is required.'),
  collegeId: z.string().min(1, 'College is required.'),
  departmentId: z.string().min(1, 'Department is required.'),
});

export async function addStaff(prevState: any, formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = staffSchema.safeParse(values);

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = error.name?.[0] || error.email?.[0] || error.phone?.[0] || error.position?.[0] || error.collegeId?.[0] || error.departmentId?.[0] || 'Invalid input.';
    return { success: false, message };
  }

  try {
    const q = query(
      collection(db, 'staffs'),
      where('email', '==', validatedFields.data.email)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: 'A staff member with this email already exists.' };
    }

    await addDoc(collection(db, 'staffs'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/data-creation/staff');
    return { success: true, message: 'Staff member added successfully.' };
  } catch (error) {
    console.error('Error adding staff:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateStaff(staffId: string, prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = staffSchema.safeParse(values);

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = error.name?.[0] || error.email?.[0] || error.phone?.[0] || error.position?.[0] || error.collegeId?.[0] || error.departmentId?.[0] || 'Invalid input.';
    return { success: false, message };
  }
  
  try {
    const q = query(
        collection(db, 'staffs'),
        where('email', '==', validatedFields.data.email)
      );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== staffId)) {
        return { success: false, message: 'A staff member with this email already exists.' };
    }
    
    const staffRef = doc(db, 'staffs', staffId);
    await updateDoc(staffRef, validatedFields.data);

    revalidatePath('/data-creation/staff');
    return { success: true, message: 'Staff member updated successfully.' };
  } catch (error) {
    console.error('Error updating staff:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteStaff(staffId: string) {
  if (!staffId) {
    return { success: false, message: 'Staff ID is missing.' };
  }
  try {
    await deleteDoc(doc(db, 'staffs', staffId));
    revalidatePath('/data-creation/staff');
    return { success: true, message: 'Staff member deleted successfully.' };
  } catch (error) {
    console.error('Error deleting staff:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

// --- CSV Import Action ---
const importStaffSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(1, "Phone is required"),
    position: z.string().min(1, "Position is required"),
    college_name: z.string().min(1, "College name is required"),
    department_name: z.string().min(1, "Department name is required"),
  });
  
  export async function importStaff(
    allColleges: { id: string; name: string }[],
    allDepartments: { id: string; name: string; collegeId: string }[],
    staffList: any[], // Raw data from CSV
    headerMapping: Record<string, string> // e.g., { 'Staff Name': 'name', 'Email Address': 'email' }
  ): Promise<{ success: boolean; message: string }> {
    if (!staffList || staffList.length === 0) {
      return { success: false, message: 'No staff data provided.' };
    }
  
    const batch = writeBatch(db);
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
  
    try {
      const collegeMap = new Map(allColleges.map(c => [c.name.toLowerCase(), c.id]));
      const departmentMap = new Map(allDepartments.map(d => [d.name.toLowerCase(), { id: d.id, collegeId: d.collegeId }]));
      
      const existingStaffSnapshot = await getDocs(query(collection(db, 'staffs')));
      const existingEmails = new Set(existingStaffSnapshot.docs.map(doc => doc.data().email.toLowerCase()));
      
      for (const row of staffList) {
        // Map row data using the user-confirmed mapping
        const mappedRow = {
          name: row[headerMapping.name] || '',
          email: row[headerMapping.email] || '',
          phone: row[headerMapping.phone] || '',
          position: row[headerMapping.position] || '',
          college_name: row[headerMapping.college_name] || '',
          department_name: row[headerMapping.department_name] || '',
        };

        const validatedFields = importStaffSchema.safeParse(mappedRow);
        
        if (!validatedFields.success) {
          errorCount++;
          const errorMessage = validatedFields.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          errors.push(`Row with email ${mappedRow.email || 'N/A'}: ${errorMessage}`);
          continue;
        }
        
        const { name, email, phone, position, college_name, department_name } = validatedFields.data;
        const lowerCaseEmail = email.toLowerCase();
        
        if (existingEmails.has(lowerCaseEmail)) {
          errorCount++;
          errors.push(`Row with email ${email}: Email already exists.`);
          continue;
        }
  
        const collegeId = collegeMap.get(college_name.toLowerCase());
        if (!collegeId) {
          errorCount++;
          errors.push(`Row with email ${email}: College "${college_name}" not found.`);
          continue;
        }
        
        const departmentInfo = departmentMap.get(department_name.toLowerCase());
        if (!departmentInfo) {
          errorCount++;
          errors.push(`Row with email ${email}: Department "${department_name}" not found.`);
          continue;
        }
  
        if (departmentInfo.collegeId !== collegeId) {
          errorCount++;
          errors.push(`Row with email ${email}: Department "${department_name}" does not belong to college "${college_name}".`);
          continue;
        }
  
        const newStaffRef = doc(collection(db, 'staffs'));
        batch.set(newStaffRef, {
          name,
          email,
          phone,
          position,
          collegeId,
          departmentId: departmentInfo.id,
          createdAt: serverTimestamp(),
        });
        
        processedCount++;
        existingEmails.add(lowerCaseEmail);
      }
  
      if (processedCount > 0) {
        await batch.commit();
      }
      
      revalidatePath('/data-creation/staff');
  
      let message = `${processedCount} staff members imported successfully.`;
      if (errorCount > 0) {
        message += ` ${errorCount} rows failed. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
      }
  
      return { success: processedCount > 0, message };
  
    } catch (error) {
      console.error('Error importing staff:', error);
      return { success: false, message: 'An unexpected error occurred during the import process.' };
    }
  }
