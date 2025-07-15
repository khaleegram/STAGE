'use server';

import { generateExamTimetable, GenerateExamTimetableInput, GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { z } from 'zod';

const formSchema = z.object({
  subjectDependencies: z.string().min(10, 'Please provide more details on subject dependencies.'),
  studentEnrollment: z.string().min(10, 'Please provide more details on student enrollment.'),
  facultyAvailability: z.string().min(10, 'Please provide more details on faculty availability.'),
  roomCapacities: z.string().min(10, 'Please provide more details on room capacities.'),
  examDuration: z.string().min(3, 'Please specify exam duration.'),
  additionalConstraints: z.string().optional(),
});

export async function handleGenerateTimetable(values: z.infer<typeof formSchema>): Promise<{
  data: GenerateExamTimetableOutput | null;
  error: string | null;
}> {
  try {
    const validatedInput = formSchema.parse(values);
    const result = await generateExamTimetable(validatedInput);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error generating timetable:', error);
    if (error instanceof z.ZodError) {
      return { data: null, error: 'Invalid input. Please check your data.' };
    }
    return { data: null, error: 'An unexpected error occurred. Please try again.' };
  }
}
