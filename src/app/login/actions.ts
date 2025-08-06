'use server';

import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid email or password.' };
  }

  const { email, password } = validatedFields.data;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true, message: 'Login successful.' };
  } catch (e) {
    const error = e as Error;
    if ((error as any).code === 'auth/invalid-credential') {
        return { success: false, message: 'Incorrect email or password. Please try again.' };
    }
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
