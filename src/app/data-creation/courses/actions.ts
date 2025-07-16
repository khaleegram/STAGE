'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const courseSchema = z.object({
  levelId: z.string().min(1, { message: 'Please select a level.' }),
  course_code: z.string().min(1, { message: 'Course code is required.' }).max(10, { message: 'Course code is too long.' }),
  course_name: z.string().min(1, { message: 'Course name is required.' }),
  credit_unit: z.coerce.number().min(0, { message: 'Credit unit cannot be negative.' }),
  exam_type: z.enum(['CBT', 'Written']),
});

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function addCourse(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = {
    levelId: formData.get('levelId') as string,
    course_code: (formData.get('course_code') as string).toUpperCase(),
    course_name: toTitleCase(formData.get('course_name') as string),
    credit_unit: formData.get('credit_unit') as string,
    exam_type: formData.get('exam_type') as 'CBT' | 'Written',
  };
  
  const validatedFields = courseSchema.safeParse(values);

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = error.levelId?.[0] || error.course_code?.[0] || error.course_name?.[0] || error.credit_unit?.[0] || 'Invalid input.';
    return { success: false, message };
  }
  
  const { levelId, course_code } = validatedFields.data;

  try {
    // Check for duplicate course code within the same level
    const q = query(collection(db, 'courses'), where('levelId', '==', levelId), where('course_code', '==', course_code));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: 'This course code already exists for the selected level.' };
    }

    await addDoc(collection(db, 'courses'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/data-creation/courses');
    return { success: true, message: 'Course added successfully.' };
  } catch (error) {
    console.error('Error adding course:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateCourse(courseId: string, prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const values = {
    levelId: formData.get('levelId') as string,
    course_code: (formData.get('course_code') as string).toUpperCase(),
    course_name: toTitleCase(formData.get('course_name') as string),
    credit_unit: formData.get('credit_unit') as string,
    exam_type: formData.get('exam_type') as 'CBT' | 'Written',
  };

  const validatedFields = courseSchema.safeParse(values);

  if (!validatedFields.success) {
     const error = validatedFields.error.flatten().fieldErrors;
     const message = error.levelId?.[0] || error.course_code?.[0] || error.course_name?.[0] || error.credit_unit?.[0] || 'Invalid input.';
     return { success: false, message };
  }
  
  const { levelId, course_code } = validatedFields.data;

  try {
    // Check for duplicates before updating
    const q = query(collection(db, 'courses'), where('levelId', '==', levelId), where('course_code', '==', course_code));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== courseId)) {
        return { success: false, message: 'This course code already exists for the selected level.' };
    }

    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, validatedFields.data);
    revalidatePath('/data-creation/courses');
    return { success: true, message: 'Course updated successfully.' };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteCourse(courseId: string): Promise<{ success: boolean; message: string }> {
    if (!courseId) {
        return { success: false, message: 'Course ID is missing.' };
    }
    try {
        const batch = writeBatch(db);

        // 1. Delete the course itself
        const courseRef = doc(db, 'courses', courseId);
        batch.delete(courseRef);

        // 2. Find and delete any combined course record that uses this course as a base
        const combinedCoursesQuery = query(collection(db, 'combined_courses'), where('base_course_id', '==', courseId));
        const combinedCoursesSnapshot = await getDocs(combinedCoursesQuery);
        if (!combinedCoursesSnapshot.empty) {
            combinedCoursesSnapshot.forEach(ccDoc => {
                batch.delete(ccDoc.ref);
            });
        }
        
        await batch.commit();

        revalidatePath('/data-creation/courses');
        revalidatePath('/data-creation/combined-courses');
        return { success: true, message: 'Course and its combination records deleted successfully.' };
    } catch (error) {
        console.error('Error deleting course:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
