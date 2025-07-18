
'use server';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  accessCode: z.string().min(1, 'Access code is required.'),
});

export async function signup(prevState: any, formData: FormData) {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const message = errors.name?.[0] || errors.email?.[0] || errors.password?.[0] || errors.accessCode?.[0] || 'Invalid input.';
    return { success: false, message };
  }

  const { name, email, password, accessCode } = validatedFields.data;

  try {
    // Check access code first
    const settingsRef = doc(db, 'system_settings', 'access_code');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists() || settingsSnap.data().code !== accessCode) {
      return { success: false, message: 'The provided access code is incorrect.' };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    return { success: true, message: 'Account created successfully.' };

  } catch (e) {
    const error = e as any;
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'This email address is already in use.' };
    }
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
