
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Timetable } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, orderBy, query } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

async function getTimetables(): Promise<Timetable[]> {
  try {
    const timetablesCollection = collection(db, 'timetables');
    const q = query(timetablesCollection, orderBy('createdAt', 'desc'));
    const timetableSnapshot = await getDocs(q);
    
    if (timetableSnapshot.empty) {
        console.log("No timetables found, returning mock data.");
        return mockTimetables();
    }

    const timetablesList = timetableSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Untitled Timetable',
            createdAt: data.createdAt,
            timetable: data.timetable,
            conflicts: data.conflicts,
        }
    });
    return timetablesList;
  } catch (error) {
    console.error("Error fetching timetables: ", error);
    return mockTimetables();
  }
}

function mockTimetables(): Timetable[] {
    const now = new Date();
    return [
        { id: 'mock1', name: 'Mock Timetable 1 - Fall 2024 Final Exams', createdAt: { seconds: Math.floor(now.getTime() / 1000) - 86400, nanoseconds: 0 }, timetable: '...', conflicts: 'Conflict A vs B' },
        { id: 'mock2', name: 'Mock Timetable 2 - Spring 2025 Midterms', createdAt: { seconds: Math.floor(now.getTime() / 1000) - 172800, nanoseconds: 0 }, timetable: '...', conflicts: '' },
    ];
}


export default async function TimetablesPage() {
  const timetables = await getTimetables();

  return (
    <div className="flex flex-col h-full">
      <Header title="Timetables" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Saved Timetables</CardTitle>
              <CardDescription>Manage and view previously generated timetables.</CardDescription>
            </div>
            <Link href="/" passHref>
              <Button>
                <PlusCircle className="mr-2" />
                Generate New Timetable
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Conflicts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timetables.map((timetable) => (
                  <TableRow key={timetable.id}>
                    <TableCell className="font-medium">{timetable.name}</TableCell>
                    <TableCell>
                      {timetable.createdAt ? format(new Date(timetable.createdAt.seconds * 1000), 'PPP p') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {timetable.conflicts ? (
                        <span className="text-destructive font-medium">Yes</span>
                      ) : (
                        <span>No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       {/* This could link to a detailed view page in the future */}
                      <Button variant="outline" size="sm">
                         <Eye className="mr-2 h-4 w-4" />
                         View
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
