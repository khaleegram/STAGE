'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const venueSchema = z.object({
  name: z.string().min(1, 'Venue name is required.'),
  code: z.string().min(1, 'Venue code is required.'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1.'),
  venue_type: z.enum(['CBT', 'Written']),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  radius: z.coerce.number().optional(),
});

export async function addVenue(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = venueSchema.safeParse(values);

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = error.name?.[0] || error.code?.[0] || error.capacity?.[0] || 'Invalid input.';
    return { success: false, message };
  }

  try {
    const q = query(
      collection(db, 'venues'),
      where('code', '==', validatedFields.data.code)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: 'A venue with this code already exists.' };
    }

    await addDoc(collection(db, 'venues'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/data-creation/venues');
    return { success: true, message: 'Venue added successfully.' };
  } catch (error) {
    console.error('Error adding venue:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateVenue(venueId: string, prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = venueSchema.safeParse(values);

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = error.name?.[0] || error.code?.[0] || error.capacity?.[0] || 'Invalid input.';
        return { success: false, message };
    }
  
  try {
    const q = query(
      collection(db, 'venues'),
      where('code', '==', validatedFields.data.code)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== venueId)) {
        return { success: false, message: 'A venue with this code already exists.' };
    }
    
    const venueRef = doc(db, 'venues', venueId);
    await updateDoc(venueRef, validatedFields.data);

    revalidatePath('/data-creation/venues');
    return { success: true, message: 'Venue updated successfully.' };
  } catch (error) {
    console.error('Error updating venue:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteVenue(venueId: string) {
  if (!venueId) {
    return { success: false, message: 'Venue ID is missing.' };
  }
  try {
    await deleteDoc(doc(db, 'venues', venueId));
    revalidatePath('/data-creation/venues');
    return { success: true, message: 'Venue deleted successfully.' };
  } catch (error) {
    console.error('Error deleting venue:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
