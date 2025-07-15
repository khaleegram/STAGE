'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { AcademicSession, Semester } from '@/lib/types';
import { collection, getDocs, query, orderBy, collectionGroup, where } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, CheckCircle, Lock, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { promoteStudents } from './actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

async function getSessions(): Promise<AcademicSession[]> {
  try {
    const sessionsCollection = collection(db, 'academic_sessions');
    const q = query(sessionsCollection, orderBy('start_year', 'desc'));
    const sessionSnapshot = await getDocs(q);

    const sessionsList = await Promise.all(sessionSnapshot.docs.map(async (sessionDoc) => {
        const data = sessionDoc.data();
        
        const semestersCollection = collection(db, 'academic_sessions', sessionDoc.id, 'semesters');
        const semestersQuery = query(semestersCollection, orderBy('semester_number'));
        const semestersSnapshot = await getDocs(semestersQuery);
        
        const semesters: Semester[] = semestersSnapshot.docs.map(doc => {
            const semesterData = doc.data();
            return {
                id: doc.id,
                semester_number: semesterData.semester_number,
                start_date: format(new Date(semesterData.start_date.seconds * 1000), 'PPP'),
                end_date: semesterData.end_date ? format(new Date(semesterData.end_date.seconds * 1000), 'PPP') : null,
                status: semesterData.status
            }
        });

        return {
            id: sessionDoc.id,
            session_name: data.session_name,
            start_year: data.start_year,
            end_year: data.end_year,
            status: data.status || 'open',
            semesters: semesters,
        } as AcademicSession;
    }));

    if (sessionsList.length === 0) throw new Error("No sessions found in Firestore.");

    return sessionsList;
  } catch (error) {
    console.error("Error fetching sessions: ", error);
    // Fallback mock data
    return [
      { 
        id: '1', 
        session_name: '2025/2026', 
        start_year: 2025, 
        end_year: 2026, 
        status: 'open',
        semesters: [
            { id: 's1', semester_number: 1, start_date: 'Sep 1, 2025', end_date: 'Dec 20, 2025', status: 'open' },
            { id: 's2', semester_number: 2, start_date: 'Jan 15, 2026', end_date: 'May 10, 2026', status: 'open' }
        ]
      },
      { 
        id: '2', 
        session_name: '2024/2025', 
        start_year: 2024, 
        end_year: 2025, 
        status: 'closed',
        semesters: [
            { id: 's3', semester_number: 1, start_date: 'Sep 2, 2024', end_date: 'Dec 21, 2024', status: 'closed' },
            { id: 's4', semester_number: 2, start_date: 'Jan 16, 2025', end_date: 'May 11, 2025', status: 'closed' }
        ]
      },
    ];
  }
}

const statusIcons = {
    open: <PlayCircle className="h-4 w-4 text-green-500" />,
    closed: <CheckCircle className="h-4 w-4 text-gray-500" />,
    locked: <Lock className="h-4 w-4 text-red-500" />,
};

const statusColors = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    locked: 'bg-red-100 text-red-800',
};

// We need to fetch data on the server, but use hooks and state on the client.
// This component now acts as a wrapper.
export default function SessionsPage() {
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        getSessions().then(data => {
            setSessions(data);
            setIsLoading(false);
        });
    }, []);
    
    return <SessionsView sessions={sessions} isLoading={isLoading} />;
}


function SessionsView({ sessions, isLoading }: { sessions: AcademicSession[], isLoading: boolean }) {
  const { toast } = useToast();
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = async () => {
    setIsPromoting(true);
    const result = await promoteStudents();
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      // Optionally, re-fetch data here to show updated counts
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsPromoting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Academic Sessions" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Academic Sessions</CardTitle>
              <CardDescription>Manage academic years and semesters.</CardDescription>
            </div>
            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={isPromoting}>
                            {isPromoting ? 'Promoting...' : 'Promote Students'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will advance students to the next academic level based on their program's promotion rules. Graduating students will be cleared from their final level, and new students will be added to the first level. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePromote}>Yes, Promote Students</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button>
                    <PlusCircle className="mr-2" />
                    New Session
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <p>Loading sessions...</p> : (
            <Accordion type="single" collapsible className="w-full" defaultValue={sessions[0]?.id}>
                {sessions.map((session) => (
                    <AccordionItem value={session.id} key={session.id}>
                        <div className="flex items-center justify-between w-full pr-4 hover:bg-muted/50 rounded-md">
                            <AccordionTrigger className="flex-1 hover:no-underline px-4 py-0">
                               <div className="flex items-center gap-4">
                                   <span className="font-bold text-lg">{session.session_name}</span>
                                   <Badge className={`${statusColors[session.status]} hover:${statusColors[session.status]}`}>
                                       {statusIcons[session.status]}
                                       <span className="ml-1 capitalize">{session.status}</span>
                                   </Badge>
                               </div>
                            </AccordionTrigger>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal />
                            </Button>
                        </div>
                        <AccordionContent>
                           <div className="p-4 bg-muted/50 rounded-md">
                                <h4 className="font-semibold mb-2">Semesters</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Semester</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>End Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {session.semesters.map(semester => (
                                            <TableRow key={semester.id}>
                                                <TableCell>{semester.semester_number === 1 ? 'First' : 'Second'} Semester</TableCell>
                                                <TableCell>{semester.start_date}</TableCell>
                                                <TableCell>{semester.end_date ?? 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={semester.status === 'open' ? 'default' : 'secondary'} className="capitalize">
                                                        {semester.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
