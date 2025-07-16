'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const offeringSchema = z.object({
  programId: z.string().min(1, 'Program is required.'),
  levelId: z.string().min(1, 'Level is required.'),
});

const addFormSchema = z.object({
  courseId: z.string().min(1, 'A base course must be selected.'),
  offerings: z.array(offeringSchema).min(1, 'At least one offering is required.'),
});

export async function addCombinedCourse(values: z.infer<typeof addFormSchema>): Promise<{ success: boolean; message: string }> {
  const validatedFields = addFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  
  const { courseId, offerings } = validatedFields.data;

  try {
    // Check if this course is already used as a base for a combined course
    const q = query(collection(db, 'combined_courses'), where('base_course_id', '==', courseId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return { success: false, message: 'This course is already used in another combined course.' };
    }

    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      return { success: false, message: 'Base course not found.' };
    }
    const courseData = courseSnap.data();

    await addDoc(collection(db, 'combined_courses'), {
      base_course_id: courseId,
      course_code: courseData.course_code,
      course_name: courseData.course_name,
      exam_type: courseData.exam_type,
      offerings: offerings.map(o => ({
        programId: o.programId,
        levelId: o.levelId,
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/data-creation/combined-courses');
    return { success: true, message: 'Combined course created successfully.' };
  } catch (error) {
    console.error('Error adding combined course:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateCombinedCourseOfferings(
  courseId: string,
  offerings: { programId: string; levelId: string }[]
): Promise<{ success: boolean; message: string }> {
  
  if (!courseId) {
    return { success: false, message: 'Course ID is missing.' };
  }
  if (!offerings || offerings.length === 0) {
    return { success: false, message: 'At least one offering must be provided.' };
  }

  try {
    const courseRef = doc(db, 'combined_courses', courseId);
    await updateDoc(courseRef, {
      offerings: offerings.map(o => ({
        programId: o.programId,
        levelId: o.levelId,
      })),
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/data-creation/combined-courses');
    return { success: true, message: 'Offerings updated successfully.' };
  } catch (error) {
    console.error('Error updating offerings:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}


export async function deleteCombinedCourse(courseId: string): Promise<{ success: boolean; message: string }> {
    if (!courseId) {
        return { success: false, message: 'Combined course ID is missing.' };
    }
    try {
        await deleteDoc(doc(db, 'combined_courses', courseId));
        revalidatePath('/data-creation/combined-courses');
        return { success: true, message: 'Combined course deleted successfully.' };
    } catch (error) {
        console.error('Error deleting combined course:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
