
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

export interface Department {
  id: string;
  name: string;
  collegeId: string;
  collegeName?: string; // Optional: To store the denormalized college name
}

export interface Program {
  id: string;
  name: string;
  departmentId: string;
  departmentName?: string;
  max_level: number;
  expected_intake: number;
}

export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  credit_unit: number;
  level: number;
  programName?: string;
  exam_type: 'CBT' | 'Written';
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  collegeId: string;
  departmentId: string;
  collegeName?: string;
  departmentName?: string;
}

export interface Venue {
  id: string;
  name: string;
  code: string;
  capacity: number;
  venue_type: 'CBT' | 'Written';
}
