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

export interface College {
  id: string;
  name: string;
  code: string;
  short_name: string;
}
