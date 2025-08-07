import { config } from 'dotenv';
config();

import '@/ai/flows/generate-exam-timetable.ts';
import '@/ai/flows/map-csv-headers.ts';
import '@/ai/flows/analyze-academic-data.ts';
