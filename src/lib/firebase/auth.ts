
'use server';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export async function signUpWithEmail(name: string, email: string, password: string, accessCode: string): Promise<{ result?: any; error?: Error }> {
  try {
    // Check access code first
    const settingsRef = doc(db, 'system_settings', 'access_code');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists() || settingsSnap.data().code !== accessCode) {
        return { error: new Error('Invalid access code.') };
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
    }
    return { result };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ result?: any; error?: Error }> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { result };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function signOut(): Promise<{ error?: Error }> {
  try {
    await firebaseSignOut(auth);
    return {};
  } catch (error) {
    return { error: error as Error };
  }
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  // photoURL validation can be added here if file uploads are implemented
});


export async function updateUserProfile(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
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
        revalidatePath('/settings'); // Revalidate to show updated info if needed elsewhere
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to update profile: ${errorMessage}` };
    }
}
