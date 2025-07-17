
'use server';

import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import { updateUserPassword as firebaseUpdateUserPassword, updateProfile } from '@/lib/firebase/auth';
import { revalidatePath } from 'next/cache';

const accessCodeSchema = z.object({
  currentCode: z.string().min(1, 'Current code is required.'),
  newCode: z.string().min(6, 'New code must be at least 6 characters.'),
});

export async function updateAccessCode(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
    const validatedFields = accessCodeSchema.safeParse({
        currentCode: formData.get('currentCode'),
        newCode: formData.get('newCode'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: validatedFields.error.flatten().fieldErrors.newCode?.[0] || 'Invalid input.',
        };
    }

    const { currentCode, newCode } = validatedFields.data;

    const settingsRef = doc(db, 'system_settings', 'access_code');

    try {
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists() || settingsSnap.data().code !== currentCode) {
            return { success: false, message: 'The current access code is incorrect.' };
        }

        await updateDoc(settingsRef, {
            code: newCode,
        });

        return { success: true, message: 'Access code updated successfully.' };

    } catch (error) {
        console.error('Error updating access code:', error);
        if (error instanceof Error) {
            return { success: false, message: `An unexpected error occurred: ${error.message}` };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function updateUserPassword(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const validatedFields = passwordSchema.safeParse({
    newPassword: formData.get('newPassword'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.newPassword?.[0] || 'Invalid input.',
    };
  }

  const { success, message } = await firebaseUpdateUserPassword(validatedFields.data.newPassword);

  if (!success) {
    return { success: false, message };
  }

  return { success: true, message: 'Password updated successfully. You will be logged out.' };
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
});

export async function updateUserProfile(formData: FormData): Promise<{ success: boolean; message: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, message: 'No user is currently signed in.' };
  }
  
  const validatedFields = profileSchema.safeParse({
    name: formData.get('name')
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Invalid input.',
    };
  }

  try {
    await updateProfile(user, { displayName: validatedFields.data.name });
    revalidatePath('/settings'); // Revalidate to show updated info
    return { success: true, message: 'Profile updated successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update profile: ${errorMessage}` };
  }
}
