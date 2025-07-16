'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
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

// Helper to remove duplicate offerings
const getUniqueOfferings = (offerings: { programId: string; levelId: string }[]) => {
    const unique = new Map<string, { programId: string; levelId: string }>();
    offerings.forEach(o => {
        const key = `${o.programId}-${o.levelId}`;
        if (!unique.has(key)) {
            unique.set(key, o);
        }
    });
    return Array.from(unique.values());
};

export async function addCombinedCourse(values: z.infer<typeof addFormSchema>): Promise<{ success: boolean; message: string }> {
  const validatedFields = addFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  
  const { courseId, offerings } = validatedFields.data;

  try {
    // 1. Check if this course is already used as a base for a combined course
    const q = query(collection(db, 'combined_courses'), where('base_course_id', '==', courseId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return { success: false, message: 'This course is already the base for another combined course.' };
    }

    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      return { success: false, message: 'Base course not found.' };
    }
    const courseData = courseSnap.data();

    const uniqueOfferings = getUniqueOfferings(offerings);

    // 2. Create the new combined course record
    const combinedCourseRef = await addDoc(collection(db, 'combined_courses'), {
      base_course_id: courseId,
      course_code: courseData.course_code,
      course_name: courseData.course_name,
      exam_type: courseData.exam_type,
      // offerings are now handled in a subcollection
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Add offerings to the subcollection
    const batch = writeBatch(db);
    uniqueOfferings.forEach(offering => {
        const offeringRef = doc(collection(db, 'combined_courses', combinedCourseRef.id, 'offerings'));
        batch.set(offeringRef, {
             programId: offering.programId,
             levelId: offering.levelId,
        });
    });
    await batch.commit();


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
  
  const uniqueOfferings = getUniqueOfferings(offerings);
   if (!uniqueOfferings || uniqueOfferings.length === 0) {
    return { success: false, message: 'At least one unique offering must be provided.' };
  }

  try {
    const offeringsCollectionRef = collection(db, 'combined_courses', courseId, 'offerings');
    const batch = writeBatch(db);

    // 1. Delete all existing offerings for this combined course
    const existingOfferingsSnapshot = await getDocs(offeringsCollectionRef);
    existingOfferingsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Add the new, unique set of offerings
    uniqueOfferings.forEach(offering => {
        const newOfferingRef = doc(offeringsCollectionRef);
        batch.set(newOfferingRef, {
            programId: offering.programId,
            levelId: offering.levelId,
        });
    });

    // 3. Update the timestamp on the parent document
    batch.update(doc(db, 'combined_courses', courseId), { updatedAt: serverTimestamp() });
    
    await batch.commit();

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
        const batch = writeBatch(db);
        const courseRef = doc(db, 'combined_courses', courseId);
        
        // Delete all offerings in the subcollection
        const offeringsSnapshot = await getDocs(collection(courseRef, 'offerings'));
        offeringsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the main combined course document
        batch.delete(courseRef);

        await batch.commit();

        revalidatePath('/data-creation/combined-courses');
        return { success: true, message: 'Combined course and its offerings deleted successfully.' };
    } catch (error) {
        console.error('Error deleting combined course:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
