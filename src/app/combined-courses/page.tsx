import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { CombinedCourse, CombinedCourseOffering } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, getDoc, query, where } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

async function getCombinedCourses(): Promise<CombinedCourse[]> {
  try {
    const combinedCoursesCollection = collection(db, 'combined_courses');
    const combinedCourseSnapshot = await getDocs(combinedCoursesCollection);

    const combinedCoursesList = await Promise.all(combinedCourseSnapshot.docs.map(async (cc: QueryDocumentSnapshot<DocumentData>) => {
        const data = cc.data();
        
        const offerings: CombinedCourseOffering[] = [];
        const offeringsCollection = collection(db, 'combined_courses_offerings');
        const q = query(offeringsCollection, where("combined_course_id", "==", cc.id));
        const offeringsSnapshot = await getDocs(q);

        for (const offeringDoc of offeringsSnapshot.docs) {
            const offeringData = offeringDoc.data();
            
            let programName = 'Unknown Program';
            let levelNumber = 0;

            if (offeringData.program_id) {
                const programRef = doc(db, 'programs', offeringData.program_id);
                const programSnap = await getDoc(programRef);
                if (programSnap.exists()) {
                    programName = programSnap.data().name || 'Unknown Program';
                }
            }

            if (offeringData.level_id) {
                const levelRef = doc(db, 'levels', offeringData.level_id);
                const levelSnap = await getDoc(levelRef);
                if (levelSnap.exists()) {
                    levelNumber = levelSnap.data().level || 0;
                }
            }
            
            offerings.push({ programName, level: levelNumber });
        }

        const combinedCourse: CombinedCourse = {
            id: cc.id,
            course_code: data.course_code || 'N/A',
            course_name: data.course_name || 'Unnamed Course',
            offerings: offerings,
        };
        
        return combinedCourse;
    }));
    return combinedCoursesList;
  } catch (error) {
    console.error("Error fetching combined courses: ", error);
    // Fallback mock data
    return [
      { id: '1', course_code: 'SEN 4211', course_name: 'Data Analysis', offerings: [{ programName: 'Software Engineering', level: 4 }, { programName: 'Computer Science', level: 4 }] },
      { id: '2', course_code: 'SEN 4223', course_name: 'Software Project Management', offerings: [{ programName: 'Software Engineering', level: 4 }] },
    ];
  }
}

export default async function CombinedCoursesPage() {
  const combinedCourses = await getCombinedCourses();

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Combined Courses</h1>
        <Button>
          <PlusCircle className="mr-2" />
          Combine Course
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Manage Combined Courses</CardTitle>
            <CardDescription>Manage courses shared across multiple programs or levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Offered To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.course_code}</TableCell>
                  <TableCell>{course.course_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {course.offerings.map((offering, index) => (
                        <Badge key={index} variant="secondary">
                          {offering.programName} - {offering.level}00L
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
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
    </div>
  );
}
