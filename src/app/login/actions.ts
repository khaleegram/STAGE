'use server';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid email or password.' };
  }

  const { email, password } = validatedFields.data;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true, message: 'Login successful!' };
  } catch (e) {
    const error = e as any; // Cast to any to access error.code
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { success: false, message: 'Incorrect email or password. Please try again.' };
    }
    // Return a generic error for other cases
    return { success: false, message: 'An unknown authentication error occurred. Please try again later.' };
  }
}
