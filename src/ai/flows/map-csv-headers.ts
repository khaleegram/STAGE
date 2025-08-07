
'use server';

/**
 * @fileOverview AI agent for intelligently mapping CSV headers to a target schema.
 *
 * - mapCsvHeaders - A function that suggests mappings for CSV headers.
 * - MapCsvHeadersInput - The input type for the mapCsvHeaders function.
 * - MapCsvHeadersOutput - The return type for the mapCsvHeaders function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TARGET_STAFF_FIELDS = [
    'name', 
    'email', 
    'phone', 
    'position', 
    'college_name', 
    'department_name'
];

const MapCsvHeadersInputSchema = z.object({
  headers: z.array(z.string()).describe('The headers extracted from the user\'s uploaded CSV file.'),
});
export type MapCsvHeadersInput = z.infer<typeof MapCsvHeadersInputSchema>;

const HeaderMappingSchema = z.object({
    userHeader: z.string().describe('The original header from the user\'s file.'),
    mappedTo: z.string().nullable().describe(`The target field this header should map to. Should be one of: ${TARGET_STAFF_FIELDS.join(', ')}. If no clear mapping is found, this should be null.`),
    confidence: z.number().min(0).max(1).describe('The AI\'s confidence in this mapping, from 0.0 to 1.0.'),
});

const MapCsvHeadersOutputSchema = z.object({
    mappings: z.array(HeaderMappingSchema).describe('The list of suggested mappings for each user header.'),
});
export type MapCsvHeadersOutput = z.infer<typeof MapCsvHeadersOutputSchema>;


export async function mapCsvHeaders(
  input: MapCsvHeadersInput
): Promise<MapCsvHeadersOutput> {
  return mapCsvHeadersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mapCsvHeadersPrompt',
  input: { schema: MapCsvHeadersInputSchema },
  output: { schema: MapCsvHeadersOutputSchema },
  prompt: `You are an intelligent data mapping assistant. Your task is to map a list of CSV headers provided by a user to a predefined set of target fields for importing staff data.

  The target fields are:
  - name: The full name of the staff member.
  - email: The email address of the staff member.
  - phone: The phone number of the staff member.
  - position: The job title or position (e.g., Lecturer, Professor).
  - college_name: The name of the college the staff belongs to.
  - department_name: The name of the department the staff belongs to.

  User's CSV Headers: {{{json headers}}}

  Analyze the user's headers and for each one, determine which target field it best corresponds to. Consider common variations, abbreviations, and different languages (e.g., "Full Name", "Staff Name" -> name; "Email Address" -> email; "College" -> college_name).

  Provide a confidence score between 0.0 (no confidence) and 1.0 (very high confidence) for each mapping.

  If a user header does not seem to correspond to any of the target fields, map it to \`null\` with a low confidence score.
  
  Return the result as a JSON object matching the output schema.
`,
});

const mapCsvHeadersFlow = ai.defineFlow(
  {
    name: 'mapCsvHeadersFlow',
    inputSchema: MapCsvHeadersInputSchema,
    outputSchema: MapCsvHeadersOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
