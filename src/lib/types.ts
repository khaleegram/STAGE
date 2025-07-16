




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
  collegeName?: string; 
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
  levelId: string;
  exam_type: 'CBT' | 'Written';
  levelNumber?: number;
  programId?: string;
  programName?: string;
}

export interface CombinedCourseOffering {
  programId: string;
  programName: string;
  levelId: string;
  level: number;
}

export interface CombinedCourse {
  id:string;
  course_code: string;
  course_name: string;
  exam_type: 'CBT' | 'Written';
  offerings: CombinedCourseOffering[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  collegeId: string;
  collegeName?: string;
  departmentId: string;
  departmentName?: string;
}

export interface Venue {
  id: string;
  name: string;
  code: string;
  capacity: number;
  venue_type: 'CBT' | 'Written';
  latitude?: string;
  longitude?: string;
  radius?: number;
}

export interface Semester {
    id: string;
    sessionId: string;
    semester_number: number;
    start_date: string; 
    end_date: string | null;
    status: 'open' | 'closed' | 'locked';
}

export interface AcademicSession {
    id: string;
    session_name: string;
    start_year: number;
    end_year: number;
    status: 'open' | 'closed' | 'locked';
    semesters?: Semester[]; // Optional for UI display
}


