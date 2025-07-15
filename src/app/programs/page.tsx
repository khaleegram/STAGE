import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Program } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

async function getPrograms(): Promise<Program[]> {
  try {
    const programsCollection = collection(db, 'programs');
    const programSnapshot = await getDocs(programsCollection);

    const programsList = await Promise.all(programSnapshot.docs.map(async (p: QueryDocumentSnapshot<DocumentData>) => {
        const data = p.data();
        const program: Program = {
            id: p.id,
            name: data.name || 'Unnamed Program',
            departmentId: data.department_id || 'N/A',
            max_level: data.max_level || 0,
            expected_intake: data.expected_intake || 0,
        };

        if (program.departmentId !== 'N/A') {
            try {
                const deptRef = doc(db, 'departments', program.departmentId);
                const deptSnap = await getDoc(deptRef);
                if (deptSnap.exists()) {
                    program.departmentName = deptSnap.data().name || 'Unknown Department';
                }
            } catch (e) {
                console.error(`Failed to fetch department ${program.departmentId}`, e)
                program.departmentName = 'Unknown Department';
            }
        }
        
        return program;
    }));
    return programsList;
  } catch (error) {
    console.error("Error fetching programs: ", error);
    // Fallback mock data
    return [
      { id: '1', name: 'Software Engineering', departmentId: '20', departmentName: 'Software Engineering And Cyber Security', max_level: 4, expected_intake: 150 },
      { id: '2', name: 'Computer Science', departmentId: '21', departmentName: 'Computer Science And Information Technology', max_level: 4, expected_intake: 200 },
    ];
  }
}

export default async function ProgramsPage() {
  const programs = await getPrograms();

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
        <Button>
          <PlusCircle className="mr-2" />
          Add Program
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Manage Programs</CardTitle>
            <CardDescription>Manage your university's academic programs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Max Level</TableHead>
                <TableHead>Expected Intake</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.departmentName || program.departmentId}</TableCell>
                  <TableCell>{program.max_level}</TableCell>
                  <TableCell>{program.expected_intake}</TableCell>
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
