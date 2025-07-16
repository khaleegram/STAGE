'use server';

import { db } from '@/lib/firebase';
import { Course, Staff, Venue } from '@/lib/types';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

export interface GenerationData {
    courses: (Course & { offeringPrograms: string[] })[];
    staff: Staff[];
    venues: Venue[];
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


export async function getGenerationData(semesterId: string): Promise<{ data: GenerationData | null; error: string | null; }> {
    if (!semesterId) {
        return { data: null, error: "Semester ID must be provided." };
    }

    try {
        const semesterNumber = semesterId.endsWith('_1') ? 1 : 2; // Simple check, might need adjustment based on actual ID format

        // 1. Fetch all Venues
        const venuesQuery = query(collection(db, 'venues'), orderBy('name'));
        const venuesSnapshot = await getDocs(venuesQuery);
        const venues: Venue[] = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));

        // 2. Fetch all Staff
        const staffQuery = query(collection(db, 'staffs'), orderBy('name'));
        const staffSnapshot = await getDocs(staffQuery);
        const staffList: Staff[] = await Promise.all(staffSnapshot.docs.map(async (s) => {
             const data = s.data();
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
            const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
            const { programName } = await getProgramAndLevelDetails(courseData.levelId);
            
            coursesMap.set(courseDoc.id, {
                ...courseData,
                offeringPrograms: [programName]
            });
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
                 // This case is unlikely if data is consistent, but as a fallback:
                 const baseCourseSnap = await getDoc(doc(db, 'courses', ccData.base_course_id));
                 if (baseCourseSnap.exists()) {
                     const courseData = { id: baseCourseSnap.id, ...baseCourseSnap.data() } as Course;
                     coursesMap.set(baseCourseSnap.id, {
                         ...courseData,
                         offeringPrograms: offeringPrograms
                     });
                 }
            }
        }
        
        const allCourses = Array.from(coursesMap.values());

        return {
            data: {
                courses: allCourses,
                staff: staffList,
                venues: venues
            },
            error: null
        };
    } catch (error) {
        console.error("Error fetching data for timetable generation: ", error);
        if (error instanceof Error) {
            return { data: null, error: `An unexpected error occurred: ${error.message}` };
        }
        return { data: null, error: 'An unexpected error occurred while fetching data.' };
    }
}
