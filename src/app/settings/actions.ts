
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

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
