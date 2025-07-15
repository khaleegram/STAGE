




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

export interface Timetable {
  id: string;
  name: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  timetable: string;
  conflicts?: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
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

export interface Level {
  id: string;
  programId: string;
  programName?: string;
  level: number;
  students_count: number;
}

export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  credit_unit: number;
  levelId: string; // Storing the ID of the level document
  exam_type: 'CBT' | 'Written';
  // Denormalized fields for easier display
  levelNumber?: number;
  programId?: string;
  programName?: string;
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

export interface CombinedCourseOffering {
  programName: string;
  level: number;
}

export interface CombinedCourse {
  id:string;
  course_code: string;
  course_name: string;
  offerings: CombinedCourseOffering[];
}

export interface Semester {
    id: string;
    semester_number: number;
    start_date: string; // Storing as string for simplicity
    end_date: string | null;
    status: 'open' | 'closed';
}

export interface AcademicSession {
    id: string;
    session_name: string;
    start_year: number;
    end_year: number;
    status: 'open' | 'closed' | 'locked';
    semesters: Semester[];
}
