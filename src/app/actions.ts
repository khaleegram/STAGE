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
  data: any | null; // Keeping this generic for now as output schema will change
  error: string | null;
}> {
  try {
    const validatedInput = formSchema.parse(values);
    // The generateExamTimetable function signature has changed. 
    // This action is now deprecated and will be replaced by logic in the generation page.
    // For now, we return a mock error to prevent it from being used.
    
    return { data: null, error: 'This generation method is deprecated. Please use the new generation page.' };

  } catch (error) {
    console.error('Error generating timetable:', error);
    if (error instanceof z.ZodError) {
      return { data: null, error: 'Invalid input. Please check your data.' };
    }
    return { data: null, error: 'An unexpected error occurred. Please try again.' };
  }
}
