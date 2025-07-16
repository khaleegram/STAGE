'use server';

/**
 * @fileOverview AI agent for generating an optimized exam timetable using a hybrid rule-based and AI approach.
 *
 * - generateExamTimetable - A function that generates an exam timetable.
 * - GenerateExamTimetableInput - The input type for the generateExamTimetable function.
 * - GenerateExamTimetableOutput - The return type for the generateExamTimetable function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CourseSchema = z.object({
  id: z.string(),
  course_code: z.string(),
  course_name: z.string(),
  exam_type: z.enum(['CBT', 'Written']),
  offeringPrograms: z.array(z.string()).describe('All programs and levels taking this course.'),
  student_count: z.number().describe('The number of students enrolled in this course.'),
});

const VenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  capacity: z.number(),
  venue_type: z.enum(['CBT', 'Written']),
});

const StaffSchema = z.object({
    id: z.string(),
    name: z.string(),
    collegeName: z.string().optional(),
    departmentName: z.string().optional(),
});

const TimeSlotSchema = z.object({
    time: z.string(),
    type: z.enum(['standard', 'overflow']),
});

const DailyTimeSlotsSchema = z.object({
    day: z.string().describe('The date in YYYY-MM-DD format.'),
    slots: z.array(TimeSlotSchema),
});


const GenerateExamTimetableInputSchema = z.object({
  courses: z.array(CourseSchema).describe('A list of all courses that need to be scheduled.'),
  venues: z.array(VenueSchema).describe('A list of all available venues.'),
  staff: z.array(StaffSchema).describe('A list of all available staff for invigilation.'),
  timeSlots: z.array(DailyTimeSlotsSchema).describe('The available days and time slots for the examination period.'),
  additionalConstraints: z
    .string()
    .optional()
    .describe('Any additional high-level constraints or preferences from the administrator.'),
});
export type GenerateExamTimetableInput = z.infer<typeof GenerateExamTimetableInputSchema>;

const ScheduledExamSchema = z.object({
    course_code: z.string(),
    date: z.string(),
    time: z.string(),
    venue_codes: z.array(z.string()),
    invigilators: z.array(z.string()),
});

const UnscheduledExamSchema = z.object({
    course_code: z.string(),
    reason: z.string(),
});

const GenerateExamTimetableOutputSchema = z.object({
  scheduled_exams: z.array(ScheduledExamSchema).describe('The list of successfully scheduled exams.'),
  unscheduled_exams: z.array(UnscheduledExamSchema).describe('A list of exams that could not be scheduled and the reason why.'),
  conflicts: z
    .string()
    .optional()
    .describe('A report of any scheduling conflicts or rule violations that were permitted to schedule all exams.'),
  summary_report: z.string().describe('A natural language summary of the generation process, including key stats and decisions made.'),
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
  prompt: `You are an AI expert in generating optimized university exam timetables. Your task is to create a schedule based on the provided data and a strict set of rules.

  **Core Data:**
  - Courses to Schedule: {{{json courses}}}
  - Available Venues: {{{json venues}}}
  - Available Staff for Invigilation: {{{json staff}}}
  - Available Time Slots: {{{json timeSlots}}}
  - Additional Admin Constraints: {{{additionalConstraints}}}

  **MANDATORY CONSTRAINTS:**

  1.  **Venue Usage**: A venue can be used multiple times per day, but only ONCE per time slot. A venue is uniquely identified by (date, time_slot).

  2.  **Capacity Matching**:
      - For **Written** exams, you MUST assign a single venue whose capacity is greater than or equal to the course's student count.
      - For **CBT** exams, you can combine MULTIPLE CBT venues to meet the student count. The sum of the capacities of the assigned CBT venues must be greater than or equal to the student count.

  3.  **Invigilator Allocation**:
      - For **Written** exams, assign invigilators based on the formula: \`max(2, floor(student_count / 40) + 1)\`.
      - For **CBT** exams, assign exactly 6 invigilators.
      - You must select invigilators from the provided staff list.

  4.  **One-Time Scheduling**: Each course must be scheduled exactly once.

  5.  **Program/Level Collision**: AVOID scheduling more than one exam for the same program/level on the same day. If unavoidable, you may allow it but you MUST report it in the 'conflicts' output field.

  6.  **Invigilator Fatigue**: An invigilator MUST NOT be scheduled for two consecutive (back-to-back) time slots on the same day. There must be at least one time slot gap between their duties.

  7.  **Fairness**: Spread exams out evenly across the available days to avoid clustering for any single program/level.

  **Output Requirements:**

  -   **scheduled_exams**: Populate this array with all the exams you were able to schedule according to the rules.
  -   **unscheduled_exams**: If a course cannot be scheduled without violating a hard rule, add it to this list with a clear reason (e.g., "Insufficient venue capacity," "No available time slot without conflicts").
  -   **conflicts**: Document any "soft" violations you had to make (e.g., allowing two exams for the same level on one day).
  -   **summary_report**: Provide a brief, natural language summary of the results (e.g., "Successfully scheduled 45 out of 48 exams. 3 courses were unscheduled due to capacity constraints. 2 program-level conflicts were allowed to complete the schedule.").

  Generate the timetable now.
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
