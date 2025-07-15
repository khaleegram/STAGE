import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { College } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

async function getColleges(): Promise<College[]> {
  try {
    const collegesCollection = collection(db, 'colleges');
    const collegeSnapshot = await getDocs(collegesCollection);
    const collegesList = collegeSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Unnamed College',
            code: data.code || 'N/A',
            short_name: data.short_name || 'N/A',
        }
    });
    return collegesList;
  } catch (error) {
    console.error("Error fetching colleges: ", error);
    // In a real app, you'd want to handle this error more gracefully
    // For now, returning mock data if there's an error
    return [
      { id: '16', name: 'COLLEGE OF COMPUTER AND INFORMATION SCIENCE', code: 'CIS', short_name: 'CIS' },
      { id: '18', name: 'COLLEGE OF NATURAL AND APPLIED SCIENCES', code: 'NAS', short_name: 'NAS' },
      { id: '19', name: 'COLLEGE OF SOCIAL AND MANAGEMENT SCIENCES', code: 'SMS', short_name: 'SMS' },
    ];
  }
}

export default async function CollegesPage() {
  const colleges = await getColleges();

  return (
    <div className="flex flex-col h-full">
      <Header title="Colleges" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Colleges</CardTitle>
              <CardDescription>Manage your university's colleges.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2" />
              Add College
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Short Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colleges.map((college) => (
                  <TableRow key={college.id}>
                    <TableCell className="font-medium">{college.name}</TableCell>
                    <TableCell>{college.code}</TableCell>
                    <TableCell>{college.short_name}</TableCell>
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
