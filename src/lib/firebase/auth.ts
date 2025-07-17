
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

export async function updateUserPassword(password: string): Promise<{ success: boolean; message: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, message: 'No user is currently signed in.' };
  }

  try {
    await firebaseUpdatePassword(user, password);
    return { success: true, message: 'Password updated successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // Provide more specific error messages
    if (errorMessage.includes('auth/requires-recent-login')) {
      return { success: false, message: 'This is a sensitive operation. Please sign out and sign back in before changing your password.' };
    }
    return { success: false, message: `Failed to update password: ${errorMessage}` };
  }
}
