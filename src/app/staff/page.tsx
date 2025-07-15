
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Staff } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

async function getStaff(): Promise<Staff[]> {
  try {
    const staffCollection = collection(db, 'staffs');
    const staffSnapshot = await getDocs(staffCollection);

    const staffList = await Promise.all(staffSnapshot.docs.map(async (s: QueryDocumentSnapshot<DocumentData>) => {
        const data = s.data();
        const staff: Staff = {
            id: s.id,
            name: data.name || 'Unnamed Staff',
            email: data.email || 'N/A',
            phone: data.phone || 'N/A',
            position: data.position || 'N/A',
            collegeId: data.college_id,
            departmentId: data.department_id,
        };

        if (staff.collegeId) {
            const collegeRef = doc(db, 'colleges', staff.collegeId);
            const collegeSnap = await getDoc(collegeRef);
            if (collegeSnap.exists()) {
                staff.collegeName = collegeSnap.data().name || 'Unknown College';
            }
        }

        if (staff.departmentId) {
            const deptRef = doc(db, 'departments', staff.departmentId);
            const deptSnap = await getDoc(deptRef);
            if (deptSnap.exists()) {
                staff.departmentName = deptSnap.data().name || 'Unknown Department';
            }
        }
        
        return staff;
    }));
    return staffList;
  } catch (error) {
    console.error("Error fetching staff: ", error);
    // Fallback mock data
    return [
      { id: '1', name: 'Khaleefah', email: 'Stillkhaleefah@gmail.com', phone: '07082344576', position: 'Head of Department', collegeId: '16', departmentId: '20', collegeName: 'COLLEGE OF COMPUTER AND INFORMATION SCIENCE', departmentName: 'Software Engineering And Cyber Security' },
    ];
  }
}

export default async function StaffPage() {
  const staff = await getStaff();

  return (
    <div className="flex flex-col h-full">
      <Header title="Staff" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff</CardTitle>
              <CardDescription>Manage your university's staff members.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2" />
              Add Staff
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.position}</TableCell>
                    <TableCell>{member.collegeName}</TableCell>
                    <TableCell>{member.departmentName}</TableCell>
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
