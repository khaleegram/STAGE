'use server';

import { generateExamTimetable, GenerateExamTimetableInput, GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { z } from 'zod';

const formSchema = z.object({
  subjectDependencies: z.string().min(10, 'Please provide more details on subject dependencies.'),
  studentEnrollment: z.string().min(10, 'Please provide more details on student enrollment.'),
  facultyAvailability: z.string().min(10, 'Please provide more details on faculty availability.'),
  roomCapacities: z.string().min(10, 'Please provide more details on room capacities.'),
  examDuration: z.string().min(3, 'Please specify exam duration.'),
  additionalConstraints: z.string().optional(),
  sessionId: z.string().min(1, 'Session is required.'),
  semesterId: z.string().min(1, 'Semester is required.'),
});

export async function handleGenerateTimetable(values: z.infer<typeof formSchema>): Promise<{
  data: GenerateExamTimetableOutput | null;
  error: string | null;
}> {
  try {
    const validatedInput = formSchema.parse(values);
    const result = await generateExamTimetable(validatedInput);

    // Save the generated timetable to Firestore
    try {
        const sessionRef = doc(db, 'academic_sessions', validatedInput.sessionId);
        const sessionSnap = await getDoc(sessionRef);
        const sessionName = sessionSnap.exists() ? sessionSnap.data().session_name : `Session ${validatedInput.sessionId}`;

        const semesterRef = doc(db, 'academic_sessions', validatedInput.sessionId, 'semesters', validatedInput.semesterId);
        const semesterSnap = await getDoc(semesterRef);
        const semesterName = semesterSnap.exists() ? 
            (semesterSnap.data().semester_number === 1 ? 'First Semester' : 'Second Semester') 
            : `Semester ${validatedInput.semesterId}`;


        await addDoc(collection(db, 'timetables'), {
            name: `Timetable for ${sessionName} - ${semesterName}`,
            timetable: result.timetable,
            conflicts: result.conflicts || '',
            createdAt: serverTimestamp(),
            inputs: {
                subjectDependencies: validatedInput.subjectDependencies,
                studentEnrollment: validatedInput.studentEnrollment,
                facultyAvailability: validatedInput.facultyAvailability,
                roomCapacities: validatedInput.roomCapacities,
                examDuration: validatedInput.examDuration,
                additionalConstraints: validatedInput.additionalConstraints,
            },
            sessionId: validatedInput.sessionId,
            semesterId: validatedInput.semesterId,
        });
    } catch (dbError) {
        console.error("Error saving timetable to Firestore: ", dbError);
        // We can still return the result to the user even if saving fails.
        // A more robust implementation might warn the user that it wasn't saved.
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Error generating timetable:', error);
    if (error instanceof z.ZodError) {
      return { data: null, error: 'Invalid input. Please check your data.' };
    }
    return { data: null, error: 'An unexpected error occurred. Please try again.' };
  }
}
