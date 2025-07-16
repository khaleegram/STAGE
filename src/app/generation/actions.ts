'use server';

import { db } from '@/lib/firebase';
import { Course, Staff, Venue } from '@/lib/types';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { DateRange } from 'react-day-picker';

export interface GenerationData {
    courses: (Course & { offeringPrograms: string[] })[];
    staff: Staff[];
    venues: Venue[];
    dateRange?: DateRange;
    compiledAt?: {
        seconds: number;
        nanoseconds: number;
    };
}

// Helper to get program and level details from a levelId
async function getProgramAndLevelDetails(levelId: string): Promise<{ programName: string, levelNumber: number, programId: string }> {
    if (!levelId) return { programName: 'N/A', levelNumber: 0, programId: 'N/A' };
    try {
        const levelRef = doc(db, 'levels', levelId);
        const levelSnap = await getDoc(levelRef);
        if (!levelSnap.exists()) return { programName: 'N/A', levelNumber: 0, programId: 'N/A' };

        const levelData = levelSnap.data();
        let programName = 'Unknown Program';
        if (levelData.programId) {
            const programRef = doc(db, 'programs', levelData.programId);
            const programSnap = await getDoc(programRef);
            if (programSnap.exists()) {
                programName = programSnap.data().name || 'Unknown Program';
            }
        }
        return { programName, levelNumber: levelData.level || 0, programId: levelData.programId };
    } catch (e) {
        console.error(`Error fetching details for level ${levelId}:`, e);
        return { programName: 'Error', levelNumber: 0, programId: 'N/A' };
    }
}


export async function compileAndStoreGenerationData(
    semesterId: string, 
    sessionId: string,
    dateRange: DateRange
): Promise<{ success: boolean; message: string; }> {
    if (!semesterId || !sessionId || !dateRange.from || !dateRange.to) {
        return { success: false, message: "Missing semester, session, or a complete date range." };
    }

    try {
        // 1. Fetch all Venues
        const venuesQuery = query(collection(db, 'venues'), orderBy('name'));
        const venuesSnapshot = await getDocs(venuesQuery);
        const venues: Venue[] = venuesSnapshot.docs.map(doc => {
            const { createdAt, ...serializableData } = doc.data();
            return { id: doc.id, ...serializableData } as Venue;
        });

        // 2. Fetch all Staff
        const staffQuery = query(collection(db, 'staffs'), orderBy('name'));
        const staffSnapshot = await getDocs(staffQuery);
        const staffList: Staff[] = await Promise.all(staffSnapshot.docs.map(async (s) => {
             const { createdAt, ...data } = s.data();
             const staff: Staff = {
                 id: s.id,
                 name: data.name,
                 email: data.email,
                 phone: data.phone,
                 position: data.position,
                 collegeId: data.collegeId,
                 departmentId: data.departmentId,
             };
              if (staff.collegeId) {
                const collegeSnap = await getDoc(doc(db, 'colleges', staff.collegeId));
                if (collegeSnap.exists()) staff.collegeName = collegeSnap.data().name;
             }
             if (staff.departmentId) {
                const departmentSnap = await getDoc(doc(db, 'departments', staff.departmentId));
                if (departmentSnap.exists()) staff.departmentName = departmentSnap.data().name;
             }
             return staff;
        }));

        // 3. Fetch Courses (both regular and combined)
        const coursesMap = new Map<string, Course & { offeringPrograms: string[] }>();

        // Process regular courses
        const coursesQuery = query(collection(db, 'courses'), orderBy('course_code'));
        const regularCoursesSnapshot = await getDocs(coursesQuery);
        for (const courseDoc of regularCoursesSnapshot.docs) {
            const courseData = courseDoc.data();
            // Omit the non-serializable 'createdAt' field
            const { createdAt, ...serializableData } = courseData;
            
            const { programName } = await getProgramAndLevelDetails(courseData.levelId);
            
            coursesMap.set(courseDoc.id, {
                id: courseDoc.id,
                ...serializableData,
                offeringPrograms: [programName]
            } as Course & { offeringPrograms: string[] });
        }

        // Process combined courses and update map
        const combinedCoursesQuery = query(collection(db, 'combined_courses'), orderBy('course_code'));
        const combinedCoursesSnapshot = await getDocs(combinedCoursesQuery);
        for (const ccDoc of combinedCoursesSnapshot.docs) {
            const ccData = ccDoc.data();
            const offeringsSnapshot = await getDocs(collection(ccDoc.ref, 'offerings'));

            const offeringPrograms: string[] = [];
            for (const offeringDoc of offeringsSnapshot.docs) {
                const { programName } = await getProgramAndLevelDetails(offeringDoc.data().levelId);
                offeringPrograms.push(programName);
            }

            if (coursesMap.has(ccData.base_course_id)) {
                // Update existing course with combined offerings
                const existingCourse = coursesMap.get(ccData.base_course_id)!;
                existingCourse.offeringPrograms = [...new Set([...existingCourse.offeringPrograms, ...offeringPrograms])];
            } else {
                 const baseCourseSnap = await getDoc(doc(db, 'courses', ccData.base_course_id));
                 if (baseCourseSnap.exists()) {
                     const courseData = baseCourseSnap.data();
                     const { createdAt, ...serializableData } = courseData;
                     coursesMap.set(baseCourseSnap.id, {
                         id: baseCourseSnap.id,
                         ...serializableData,
                         offeringPrograms: offeringPrograms
                     } as Course & { offeringPrograms: string[] });
                 }
            }
        }
        
        const allCourses = Array.from(coursesMap.values());

        const compiledData: Omit<GenerationData, 'compiledAt'> = {
            courses: allCourses,
            staff: staffList,
            venues: venues,
            dateRange: dateRange,
        };

        // 4. Store the compiled data
        const generationDocRef = doc(db, 'generation_data', semesterId);
        await setDoc(generationDocRef, {
            ...compiledData,
            semesterId: semesterId,
            sessionId: sessionId,
            compiledAt: serverTimestamp(),
        });
        
        return {
            success: true,
            message: 'Data compiled and saved successfully.'
        };

    } catch (error) {
        console.error("Error compiling and storing data: ", error);
        if (error instanceof Error) {
            return { success: false, message: `An unexpected error occurred: ${error.message}` };
        }
        return { success: false, message: 'An unexpected error occurred while compiling data.' };
    }
}

export async function getExistingGenerationData(semesterId: string): Promise<{ data: GenerationData | null; error: string | null; }> {
    if (!semesterId) {
        return { data: null, error: 'Semester ID is required.' };
    }
    try {
        const docRef = doc(db, 'generation_data', semesterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamps to serializable format for the client
            const serializableData: GenerationData = {
                ...data,
                dateRange: {
                    from: data.dateRange.from.toDate(),
                    to: data.dateRange.to.toDate(),
                },
                compiledAt: {
                    seconds: data.compiledAt.seconds,
                    nanoseconds: data.compiledAt.nanoseconds,
                }
            } as GenerationData;
            return { data: serializableData, error: null };
        } else {
            return { data: null, error: null }; // No existing data is not an error
        }
    } catch (error) {
        console.error('Error fetching existing generation data:', error);
        return { data: null, error: 'Failed to fetch existing data.' };
    }
}
