
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

export async function updateUserProfile(name: string, photoURL?: string): Promise<{ error?: Error }> {
    const user = auth.currentUser;
    if (!user) {
        return { error: new Error('No user is currently signed in.') };
    }
    try {
        await updateProfile(user, { displayName: name, photoURL });
        return {};
    } catch (error) {
        return { error: error as Error };
    }
}

export async function updateUserPassword(newPassword: string): Promise<{ error?: Error }> {
    const user = auth.currentUser;
    if (!user) {
        return { error: new Error('No user is currently signed in.') };
    }
    try {
        await firebaseUpdatePassword(user, newPassword);
        return {};
    } catch (error) {
        return { error: error as Error };
    }
}
