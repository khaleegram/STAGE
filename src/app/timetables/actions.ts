'use server';

import { db } from '@/lib/firebase';
import { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Timetable } from '@/lib/types';

const SaveTimetableInputSchema = z.object({
  name: z.string().min(1, 'Timetable name is required.'),
  scheduled_exams: z.array(z.any()), // Keeping these as 'any' for simplicity
  unscheduled_exams: z.array(z.any()),
  conflicts: z.string().optional(),
  summary_report: z.string(),
});

type SaveTimetableInput = z.infer<typeof SaveTimetableInputSchema>;

export async function saveTimetable(input: SaveTimetableInput): Promise<{ success: boolean; message: string }> {
  const validatedFields = SaveTimetableInputSchema.safeParse(input);

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid timetable data provided.' };
  }

  try {
    await addDoc(collection(db, 'timetables'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/timetables'); // Revalidate the timetables list page
    return { success: true, message: 'Timetable saved successfully.' };
  } catch (error) {
    console.error('Error saving timetable:', error);
    if (error instanceof Error) {
        return { success: false, message: `Failed to save timetable: ${error.message}` };
    }
    return { success: false, message: 'An unexpected error occurred while saving the timetable.' };
  }
}

export async function getTimetableById(id: string): Promise<{ data: Timetable | null; error: string | null; }> {
    if (!id) {
        return { data: null, error: 'Timetable ID is required.' };
    }
    try {
        const docRef = doc(db, 'timetables', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { data: { id: docSnap.id, ...docSnap.data() } as Timetable, error: null };
        } else {
            return { data: null, error: 'Timetable not found.' };
        }
    } catch (error) {
        console.error('Error fetching timetable:', error);
        return { data: null, error: 'Failed to fetch timetable from database.' };
    }
}
