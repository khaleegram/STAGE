import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Department, College } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

async function getDepartments(): Promise<Department[]> {
  try {
    const departmentsCollection = collection(db, 'departments');
    const departmentSnapshot = await getDocs(departmentsCollection);

    const departmentsList = await Promise.all(departmentSnapshot.docs.map(async (d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        const department: Department = {
            id: d.id,
            name: data.name || 'Unnamed Department',
            collegeId: data.collegeId || 'N/A',
        };

        // Fetch college name for better display
        if (department.collegeId !== 'N/A') {
            try {
                const collegeRef = doc(db, 'colleges', department.collegeId);
                const collegeSnap = await getDoc(collegeRef);
                if (collegeSnap.exists()) {
                    department.collegeName = collegeSnap.data().name || 'Unknown College';
                }
            } catch (e) {
                console.error(`Failed to fetch college ${department.collegeId}`, e)
                department.collegeName = 'Unknown College';
            }
        }
        
        return department;
    }));
    return departmentsList;
  } catch (error) {
    console.error("Error fetching departments: ", error);
    // Fallback mock data
    return [
      { id: '1', name: 'Software Engineering And Cyber Security', collegeId: '16', collegeName: 'COLLEGE OF COMPUTER AND INFORMATION SCIENCE' },
      { id: '2', name: 'Computer Science And Information Technology', collegeId: '16', collegeName: 'COLLEGE OF COMPUTER AND INFORMATION SCIENCE' },
    ];
  }
}

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="flex flex-col h-full">
      <Header title="Departments" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Manage your university's departments.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2" />
              Add Department
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.collegeName || department.collegeId}</TableCell>
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
