import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Course } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, BookOpen } from 'lucide-react';

async function getCourses(): Promise<Course[]> {
  try {
    const coursesCollection = collection(db, 'courses');
    const courseSnapshot = await getDocs(coursesCollection);

    const coursesList = await Promise.all(courseSnapshot.docs.map(async (c: QueryDocumentSnapshot<DocumentData>) => {
        const data = c.data();
        
        // Firestore stores level_id as a reference
        const levelRef = data.level_id;
        let levelNumber = 0;
        let programName = 'Unknown Program';
        
        if (levelRef) {
            const levelSnap = await getDoc(levelRef);
            if (levelSnap.exists()) {
                const levelData = levelSnap.data();
                levelNumber = levelData.level || 0;
                
                // Now get program from level
                const programRef = levelData.program_id;
                if (programRef) {
                    const programSnap = await getDoc(programRef);
                    if (programSnap.exists()) {
                        programName = programSnap.data().name || 'Unknown Program';
                    }
                }
            }
        }

        const course: Course = {
            id: c.id,
            course_code: data.course_code || 'N/A',
            course_name: data.course_name || 'Unnamed Course',
            credit_unit: data.credit_unit || 0,
            exam_type: data.exam_type || 'Written',
            level: levelNumber,
            programName: programName,
        };
        
        return course;
    }));
    return coursesList;
  } catch (error) {
    console.error("Error fetching courses: ", error);
    // Fallback mock data
    return [
      { id: '1', course_code: 'SEN 4223', course_name: 'Software Project Management', credit_unit: 3, level: 4, programName: 'Software Engineering', exam_type: 'Written' },
      { id: '2', course_code: 'SEN 4211', course_name: 'Data Analysis', credit_unit: 5, level: 4, programName: 'Software Engineering', exam_type: 'Written' },
      { id: '3', course_code: 'SEN 4212', course_name: 'Machine Learning', credit_unit: 3, level: 4, programName: 'Software Engineering', exam_type: 'Written' },
    ];
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="flex flex-col h-full">
      <Header title="Courses" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Courses</CardTitle>
              <CardDescription>Manage your university's courses.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2" />
              Add Course
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Credit Units</TableHead>
                  <TableHead>Exam Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.course_code}</TableCell>
                    <TableCell>{course.course_name}</TableCell>
                    <TableCell>{course.programName}</TableCell>
                    <TableCell>{course.level}00</TableCell>
                    <TableCell>{course.credit_unit}</TableCell>
                    <TableCell>{course.exam_type}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
