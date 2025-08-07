'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, writeBatch, getDoc } from 'firebase/firestore';
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
    const message = error.levelId?.[0] || error.course_code?.[0] || error.course_name?.[0] || error.credit_unit?.[0] || error.exam_type?.[0] || 'Invalid input.';
    return { success: false, message };
  }
  
  const { levelId, course_code, course_name, credit_unit, exam_type } = validatedFields.data;

  try {
    const levelRef = doc(db, 'levels', levelId);
    const levelSnap = await getDoc(levelRef);
    if (!levelSnap.exists()) {
        return { success: false, message: 'The selected level does not exist.' };
    }
    const programId = levelSnap.data().programId;

    // Check for duplicate course code within the same program
    const q = query(collection(db, 'courses'), where('programId', '==', programId), where('course_code', '==', course_code));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: 'This course code already exists for the selected program.' };
    }

    await addDoc(collection(db, 'courses'), {
      levelId,
      programId,
      course_code,
      course_name,
      credit_unit,
      exam_type,
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
     const message = error.levelId?.[0] || error.course_code?.[0] || error.course_name?.[0] || error.credit_unit?.[0] || error.exam_type?.[0] || 'Invalid input.';
     return { success: false, message };
  }
  
  const { levelId, course_code } = validatedFields.data;

  try {
    const levelRef = doc(db, 'levels', levelId);
    const levelSnap = await getDoc(levelRef);
    if (!levelSnap.exists()) {
        return { success: false, message: 'The selected level does not exist.' };
    }
    const programId = levelSnap.data().programId;

    // Check for duplicates before updating
    const q = query(collection(db, 'courses'), where('programId', '==', programId), where('course_code', '==', course_code));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== courseId)) {
        return { success: false, message: 'This course code already exists for the selected program.' };
    }

    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
        ...validatedFields.data,
        programId,
    });
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
            for (const ccDoc of combinedCoursesSnapshot.docs) {
                // Also delete the subcollection of offerings
                 const offeringsSnapshot = await getDocs(collection(ccDoc.ref, 'offerings'));
                 offeringsSnapshot.forEach(offeringDoc => {
                     batch.delete(offeringDoc.ref);
                 });
                 batch.delete(ccDoc.ref);
            }
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


const importCourseSchema = z.object({
  course_code: z.string(),
  course_name: z.string(),
  credit_unit: z.coerce.number(),
  exam_type: z.enum(['CBT', 'Written']),
  level: z.coerce.number(),
});

export async function importCourses(
  programId: string,
  courses: z.infer<typeof importCourseSchema>[]
): Promise<{ success: boolean; message: string }> {
  if (!programId || !courses || courses.length === 0) {
    return { success: false, message: 'Program ID and a list of courses are required.' };
  }

  const batch = writeBatch(db);
  let processedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    // 1. Get all levels for the selected program to map level numbers to level IDs
    const levelsQuery = query(collection(db, 'levels'), where('programId', '==', programId));
    const levelsSnapshot = await getDocs(levelsQuery);
    const levelMap = new Map<number, string>();
    levelsSnapshot.forEach(doc => {
      levelMap.set(doc.data().level, doc.id);
    });

    // 2. Get all existing course codes for this program to check for duplicates
    const existingCoursesQuery = query(collection(db, 'courses'), where('programId', '==', programId));
    const existingCoursesSnapshot = await getDocs(existingCoursesQuery);
    const existingCourseCodes = new Set(existingCoursesSnapshot.docs.map(doc => doc.data().course_code));

    for (const course of courses) {
      const validatedFields = importCourseSchema.safeParse(course);
      
      if (!validatedFields.success) {
        errorCount++;
        errors.push(`Row with code ${course.course_code || 'N/A'}: Invalid data format.`);
        continue;
      }
      
      const { course_code, level, ...rest } = validatedFields.data;
      const upperCaseCode = course_code.toUpperCase();
      
      if (existingCourseCodes.has(upperCaseCode)) {
        errorCount++;
        errors.push(`Row with code ${upperCaseCode}: Course code already exists for this program.`);
        continue;
      }
      
      const levelId = levelMap.get(level);
      if (!levelId) {
        errorCount++;
        errors.push(`Row with code ${upperCaseCode}: Level '${level}' does not exist for this program.`);
        continue;
      }

      const newCourseRef = doc(collection(db, 'courses'));
      batch.set(newCourseRef, {
        programId,
        levelId,
        course_code: upperCaseCode,
        course_name: toTitleCase(rest.course_name),
        credit_unit: rest.credit_unit,
        exam_type: rest.exam_type,
        createdAt: serverTimestamp(),
      });
      
      processedCount++;
      existingCourseCodes.add(upperCaseCode); // Add to set to prevent duplicates within the same CSV
    }

    if (processedCount > 0) {
      await batch.commit();
    }
    
    revalidatePath('/data-creation/courses');

    let message = `${processedCount} courses imported successfully.`;
    if (errorCount > 0) {
      message += ` ${errorCount} rows failed. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
    }

    return { success: processedCount > 0, message };

  } catch (error) {
    console.error('Error importing courses:', error);
    return { success: false, message: 'An unexpected error occurred during the import process.' };
  }
}
