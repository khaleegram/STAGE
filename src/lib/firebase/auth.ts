
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


export async function signOut(): Promise<{ error?: Error }> {
  try {
    await firebaseSignOut(auth);
    return {};
  } catch (error) {
    return { error: error as Error };
  }
}
