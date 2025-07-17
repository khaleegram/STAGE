
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
});

export async function updateProfile(prevState: any, formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = profileSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid data provided.' };
  }

  // Placeholder for actual update logic
  console.log('Updating profile with:', validatedFields.data);
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  revalidatePath('/settings');
  return { success: true, message: 'Profile updated successfully.' };
}


const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Current password is required.' }),
    newPassword: z.string().min(8, { message: 'New password must be at least 8 characters.' }),
});

export async function updatePassword(prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = passwordSchema.safeParse(values);

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.flatten().fieldErrors.newPassword?.[0] || 'Invalid data.' };
    }

    // Placeholder for actual password change logic
    console.log('Changing password...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true, message: 'Password updated successfully. You will be logged out shortly.' };
}
