
import { z } from 'zod';

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
  id: z.string().describe('A unique client-side generated UUID for this entity.'),
  type: z.enum(['College', 'Department', 'Program', 'Level', 'Course'])
    .describe('The type of academic entity detected.'),
  
  // Detected Properties
  name: z.string().describe('The primary name of the entity (e.g., "College of Science", "B.Sc. Computer Science", "CSC 101").'),
  properties: z.object({
      code: z.string().optional().describe('A short code for the entity, e.g., "COLNAS" for a college.'),
      course_code: z.string().optional().describe('The course code, e.g., "CSC 101".'),
      credit_unit: z.number().optional().describe('The number of credit units for a course.'),
      students_count: z.number().optional().describe('The number of students in a level.'),
      max_level: z.number().optional().describe('The maximum level for a program.'),
      exam_type: z.enum(['CBT', 'Written']).optional().describe('The type of exam for a course.'),
  }).describe('A flexible object to hold other detected properties.'),
  
  // Hierarchy and Relationships
  parentId: z.string().nullable().describe('The UUID of the parent entity in this same analysis request, if a relationship is inferred.'),
  
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
