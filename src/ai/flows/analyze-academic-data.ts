'use server';
/**
 * @fileOverview AI agent for analyzing academic documents to extract and structure data.
 *
 * This flow can process various document formats (like images or PDFs of tables)
 * to identify academic entities (Colleges, Departments, Programs, Levels, Courses),
 * understand their properties, and infer their hierarchical relationships.
 *
 * - analyzeAcademicData - The main function to process a document.
 * - AnalyzeAcademicDataInput - The input type for the analysis function.
 * - AnalyzedEntity - The output schema for a single identified entity.
 * - AnalyzeAcademicDataOutput - The full return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
export const AnalyzeAcademicDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to analyze, provided as a data URI. This can be an image (e.g., JPEG, PNG) or a PDF. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeAcademicDataInput = z.infer<typeof AnalyzeAcademicDataInputSchema>;


// Output Schema for a single entity
export const AnalyzedEntitySchema = z.object({
  id: z.string().uuid().describe('A unique client-side generated UUID for this entity.'),
  type: z.enum(['College', 'Department', 'Program', 'Level', 'Course'])
    .describe('The type of academic entity detected.'),
  
  // Detected Properties
  name: z.string().describe('The primary name of the entity (e.g., "College of Science", "B.Sc. Computer Science", "CSC 101").'),
  properties: z.record(z.any()).describe('A flexible object to hold other detected properties (e.g., { course_code: "CSC 101", credit_unit: 3, level: 100, students_count: 150 }).'),
  
  // Hierarchy and Relationships
  parentId: z.string().uuid().nullable().describe('The UUID of the parent entity in this same analysis request, if a relationship is inferred.'),
  
  // AI Confidence and Explanation
  confidence: z.number().min(0).max(1).describe('The AI\'s confidence in the accuracy of the detected information and relationship (0.0 to 1.0).'),
  reasoning: z.string().describe('A brief explanation of how the AI identified this entity and its relationships based on the document content.'),

  // Status for UI
  status: z.enum(['new', 'matched', 'ambiguous', 'error']).describe('The processing status of this entity.'),
  suggestions: z.array(z.string()).optional().describe('If ambiguous, suggest possible matches from the database.'),
});
export type AnalyzedEntity = z.infer<typeof AnalyzedEntitySchema>;


// Final Output Schema
export const AnalyzeAcademicDataOutputSchema = z.object({
    entities: z.array(AnalyzedEntitySchema).describe('A flat list of all academic entities found in the document.'),
    summary: z.string().describe('A high-level natural language summary of the document\'s content and structure.'),
});
export type AnalyzeAcademicDataOutput = z.infer<typeof AnalyzeAcademicDataOutputSchema>;


/**
 * Analyzes an academic document to extract entities and their hierarchy.
 * @param input The document to analyze.
 * @returns A structured list of entities and a summary.
 */
export async function analyzeAcademicData(
  input: AnalyzeAcademicDataInput
): Promise<AnalyzeAcademicDataOutput> {
  return analyzeAcademicDataFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeAcademicDataPrompt',
  input: { schema: AnalyzeAcademicDataInputSchema },
  output: { schema: AnalyzeAcademicDataOutputSchema },
  prompt: `You are an expert AI data analyst specializing in academic records for a university. Your task is to analyze the provided document (image, PDF, or text data) and extract all academic entities, structure them, and infer their hierarchical relationships.

**DOCUMENT FOR ANALYSIS:**
{{media url=documentDataUri}}

**YOUR TASK:**

1.  **Analyze the Document:** Carefully examine the entire document. It could be a table, a list, or a structured text. Use OCR if it's an image or PDF.

2.  **Identify Entities:** Detect every academic entity. The possible types are:
    *   **College**: The highest academic division (e.g., "College of Natural and Applied Sciences").
    *   **Department**: A division within a College (e.g., "Department of Computer Science").
    *   **Program**: A degree program within a Department (e.g., "B.Sc. Software Engineering").
    *   **Level**: An academic year within a Program (e.g., "100 Level", "200 Level").
    *   **Course**: A specific course within a Level (e.g., "CSC 101 - Introduction to Programming").

3.  **Extract Properties:** For each entity, extract all available properties.
    *   The `name` is the primary identifier.
    *   Put all other data into the `properties` object. For example, a Course might have \`{ course_code: "CSC101", credit_unit: 3 }\`. A Level might have \`{ students_count: 250 }\`.

4.  **Infer Hierarchy:** This is the most critical step. Based on the document's layout, indentation, and context, determine the parent-child relationships.
    *   A Course belongs to a Level.
    *   A Level belongs to a Program.
    *   A Program belongs to a Department.
    *   A Department belongs to a College.
    *   For each entity, set its \`parentId\` to the unique \`id\` of its parent from the SAME analysis. If an entity has no parent (like a College), its \`parentId\` must be \`null\`.

5.  **Generate UUIDs:** Assign a unique v4 UUID to the `id` field for EVERY entity you create. This is crucial for establishing the `parentId` links.

6.  **Assess Confidence and Reasoning:** For each entity, provide:
    *   `confidence`: Your confidence score (0.0 to 1.0) for the extracted data and the inferred parent link.
    *   `reasoning`: A short sentence explaining your logic. E.g., "Identified as a Course under '100 Level' due to its format and position in the table."

7.  **Set Initial Status:** For this initial analysis, set the `status` of all entities to \`new\`. The UI will handle matching later.

8.  **Provide a Summary:** Write a brief, high-level summary of what you found in the document.

**OUTPUT FORMAT:**
Return a single JSON object that strictly adheres to the 'AnalyzeAcademicDataOutput' schema. Ensure the output is a flat list of all detected entities.
`,
});

const analyzeAcademicDataFlow = ai.defineFlow(
  {
    name: 'analyzeAcademicDataFlow',
    inputSchema: AnalyzeAcademicDataInputSchema,
    outputSchema: AnalyzeAcademicDataOutputSchema,
  },
  async (input) => {
    // In a future step, we could fetch existing data from Firestore here
    // and pass it to the prompt to enable smart matching against the DB.
    
    const { output } = await prompt(input);
    return output!;
  }
);
