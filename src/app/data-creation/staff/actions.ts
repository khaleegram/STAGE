
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, where, query, getDocs } from 'firebase/firestore';
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
