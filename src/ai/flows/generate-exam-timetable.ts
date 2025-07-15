'use server';

/**
 * @fileOverview AI agent for generating an optimized exam timetable.
 *
 * - generateExamTimetable - A function that generates an exam timetable.
 * - GenerateExamTimetableInput - The input type for the generateExamTimetable function.
 * - GenerateExamTimetableOutput - The return type for the generateExamTimetable function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExamTimetableInputSchema = z.object({
  subjectDependencies: z
    .string()
    .describe('A description of subject dependencies and prerequisites.'),
  studentEnrollment: z.string().describe('The number of students enrolled in each subject.'),
  facultyAvailability: z.string().describe('Information about faculty availability.'),
  roomCapacities: z.string().describe('The capacity of each room available for exams.'),
  examDuration: z.string().describe('The duration of each exam.'),
  additionalConstraints: z
    .string()
    .optional()
    .describe('Any additional constraints or preferences for the timetable.'),
});
export type GenerateExamTimetableInput = z.infer<typeof GenerateExamTimetableInputSchema>;

const GenerateExamTimetableOutputSchema = z.object({
  timetable: z.string().describe('The generated exam timetable in a readable format.'),
  conflicts: z
    .string()
    .optional()
    .describe('A report of any scheduling conflicts identified.'),
});
export type GenerateExamTimetableOutput = z.infer<typeof GenerateExamTimetableOutputSchema>;

export async function generateExamTimetable(
  input: GenerateExamTimetableInput
): Promise<GenerateExamTimetableOutput> {
  return generateExamTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExamTimetablePrompt',
  input: {schema: GenerateExamTimetableInputSchema},
  output: {schema: GenerateExamTimetableOutputSchema},
  prompt: `You are an expert in generating optimized exam timetables for universities.

  Consider the following constraints to generate an efficient and conflict-free timetable:

  Subject Dependencies: {{{subjectDependencies}}}
  Student Enrollment: {{{studentEnrollment}}}
  Faculty Availability: {{{facultyAvailability}}}
  Room Capacities: {{{roomCapacities}}}
  Exam Duration: {{{examDuration}}}
  Additional Constraints: {{{additionalConstraints}}}

  Generate a detailed exam timetable, ensuring that no student has conflicting exams.
  Identify and report any potential scheduling conflicts.
  Return the timetable in a clear, readable format. Include date, time, subject, and room.
  If a conflict is unavoidable, clearly identify the conflict and suggest possible resolutions.
`,
});

const generateExamTimetableFlow = ai.defineFlow(
  {
    name: 'generateExamTimetableFlow',
    inputSchema: GenerateExamTimetableInputSchema,
    outputSchema: GenerateExamTimetableOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
