export interface TimetableEntry {
  id: string;
  date: string;
  time: string;
  subject: string;
  room: string;
  department?: string;
  courseCode?: string;
  instructor?: string;
}
