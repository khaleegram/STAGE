
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { AcademicSession, Semester, Level } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { PlusCircle, CheckCircle, Lock, PlayCircle, Trash2, Edit, Users, ArrowRight, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, isValid } from 'date-fns';
import { promoteStudents, deleteSession, deleteSemester, updateSemesterStatus } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SessionForm } from './session-form';
import { SemesterForm } from './semester-form';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusIcons: { [key: string]: React.ReactElement } = {
    open: <PlayCircle className="h-4 w-4 text-green-500" />,
    closed: <CheckCircle className="h-4 w-4 text-gray-500" />,
    locked: <Lock className="h-4 w-4 text-red-500" />,
};

const statusColors: { [key: string]: string } = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    locked: 'bg-red-100 text-red-800',
};

function UnresolvedPromotionsCard() {
    const [emptyLevels, setEmptyLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'levels'),
            where('level', '==', 1),
            where('students_count', '==', 0)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                setEmptyLevels([]);
                setIsLoading(false);
                return;
            }
            const levelsWithProgramNames = await Promise.all(
                snapshot.docs.map(async (levelDoc) => {
                    const levelData = { id: levelDoc.id, ...levelDoc.data() } as Level;
                    if (levelData.programId) {
                        const programDoc = await getDoc(doc(db, 'programs', levelData.programId));
                        if (programDoc.exists()) {
                            levelData.programName = programDoc.data()?.name || 'Unknown Program';
                        }
                    }
                    return levelData;
                })
            );
            setEmptyLevels(levelsWithProgramNames);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (emptyLevels.length === 0) {
        return null;
    }

    return (
        <Card className="mt-6 border-amber-500 bg-amber-50/50">
            <CardHeader>
                <CardTitle className="text-amber-800">Pending Level 1 Population</CardTitle>
                <CardDescription className="text-amber-700">
                    The following programs require new student populations for Level 1 after promotion.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Program Name</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {emptyLevels.map((level) => (
                            <TableRow key={level.id}>
                                <TableCell className="font-medium">{level.programName}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/data-creation/levels">
                                            Set Population <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function SessionsPage() {
    const { toast } = useToast();
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPromoting, setIsPromoting] = useState(false);

    // Modal state
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
    const [currentSessionForSemester, setCurrentSessionForSemester] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'academic_sessions'), orderBy('start_year', 'desc'));
        const unsubscribe = onSnapshot(q, async (sessionSnapshot) => {
            const sessionsList = await Promise.all(
                sessionSnapshot.docs.map(async (sessionDoc) => {
                    const data = sessionDoc.data();
                    const semestersQuery = query(collection(db, 'academic_sessions', sessionDoc.id, 'semesters'), orderBy('semester_number'));
                    const semestersSnapshot = await getDocs(semestersQuery);
                    const semesters: Semester[] = semestersSnapshot.docs.map(doc => {
                        const sData = doc.data();
                        const startDate = sData.start_date?.toDate();
                        const endDate = sData.end_date?.toDate();
                        return {
                            id: doc.id,
                            sessionId: sessionDoc.id,
                            semester_number: sData.semester_number,
                            start_date: isValid(startDate) ? format(startDate, 'PPP') : 'N/A',
                            end_date: isValid(endDate) ? format(endDate, 'PPP') : 'N/A',
                            status: sData.status
                        };
                    });
                    return {
                        id: sessionDoc.id,
                        session_name: data.session_name,
                        start_year: data.start_year,
                        end_year: data.end_year,
                        status: data.status,
                        semesters: semesters,
                    } as AcademicSession;
                })
            );
            setSessions(sessionsList);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching sessions:", error);
            toast({ title: 'Error', description: 'Could not fetch sessions.', variant: 'destructive' });
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [toast]);

    const handlePromote = async () => {
        setIsPromoting(true);
        const result = await promoteStudents();
        toast({
            title: result.success ? 'Success' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
            duration: result.success ? 5000 : 9000
        });
        setIsPromoting(false);
    };

    const handleDeleteSession = async (sessionId: string) => {
        const result = await deleteSession(sessionId);
        toast({
            title: result.success ? 'Success' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
    }
    
    const handleSemesterStatusChange = async (semester: Semester, status: 'open' | 'closed' | 'locked') => {
        const result = await updateSemesterStatus(semester.id, semester.sessionId, status);
        toast({
            title: result.success ? 'Success' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
    }

    const handleDeleteSemester = async (semesterId: string, sessionId: string) => {
        const result = await deleteSemester(semesterId, sessionId);
         toast({
            title: result.success ? 'Success' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
    }

    const handleAddNewSession = () => {
        setEditingSession(null);
        setShowSessionModal(true);
    }
    const handleEditSession = (session: AcademicSession) => {
        setEditingSession(session);
        setShowSessionModal(true);
    }

    const handleEditSemester = (semester: Semester) => {
        setEditingSemester(semester);
        setCurrentSessionForSemester(semester.sessionId);
        setShowSemesterModal(true);
    }

    return (
        <section className="p-4 sm:p-6 lg:p-8 rounded-lg">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Academic Sessions</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={isPromoting} className="w-full sm:w-auto">
                                    <Users className="mr-2 h-4 w-4" />
                                    {isPromoting ? 'Promoting...' : 'Promote Students'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will advance all students to their next academic level and reset Level 1 counts to zero. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePromote}>Yes, Promote Students</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button onClick={handleAddNewSession} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> New Session
                        </Button>
                    </div>
                </div>

                <UnresolvedPromotionsCard />

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Manage Sessions & Semesters</CardTitle>
                        <CardDescription>Manage academic years and their corresponding semesters.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <p>Loading sessions...</p> : (
                            <Accordion type="single" collapsible className="w-full" defaultValue={sessions[0]?.id}>
                                {sessions.map((session) => (
                                    <AccordionItem value={session.id} key={session.id}>
                                        <div className="flex items-center justify-between w-full pr-2 sm:pr-4 hover:bg-muted/50 rounded-md">
                                            <AccordionTrigger className="flex-1 hover:no-underline px-2 sm:px-4 py-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                    <span className="font-bold text-lg">{session.session_name}</span>
                                                    <Badge className={`${statusColors[session.status]} hover:${statusColors[session.status]}`}>
                                                        {statusIcons[session.status]}
                                                        <span className="ml-1 capitalize">{session.status}</span>
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditSession(session)}><Edit className="h-4 w-4" /></Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                           This will permanently delete the {session.session_name} session and all its semesters. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteSession(session.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                        <AccordionContent>
                                            <div className="p-4 bg-muted/50 rounded-md">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-semibold">Semesters</h4>
                                                    {/* Semesters are created automatically, no need for an add button
                                                    <Button variant="outline" size="sm" onClick={() => handleAddNewSemester(session.id)}>
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Semester
                                                    </Button>
                                                    */}
                                                </div>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Semester</TableHead>
                                                            <TableHead>Start Date</TableHead>
                                                            <TableHead>End Date</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {session.semesters && session.semesters.length > 0 ? (
                                                        session.semesters.map(semester => (
                                                            <TableRow key={semester.id}>
                                                                <TableCell>{semester.semester_number === 1 ? 'First' : 'Second'}</TableCell>
                                                                <TableCell>{semester.start_date ?? 'Not Set'}</TableCell>
                                                                <TableCell>{semester.end_date ?? 'Not Set'}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={`${statusColors[semester.status]} hover:${statusColors[semester.status]}`}>
                                                                        {statusIcons[semester.status]}
                                                                        <span className="ml-1 capitalize">{semester.status}</span>
                                                                    </Badge>
                                                                </TableCell>
                                                                <td className="p-4 flex justify-end space-x-2">
                                                                     <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => handleEditSemester(semester)}>
                                                                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                                            </DropdownMenuItem>
                                                                            {semester.status !== 'open' && <DropdownMenuItem onClick={() => handleSemesterStatusChange(semester, 'open')}>
                                                                                <PlayCircle className="mr-2 h-4 w-4 text-green-500" /> Mark as Open
                                                                            </DropdownMenuItem>}
                                                                            {semester.status !== 'closed' && <DropdownMenuItem onClick={() => handleSemesterStatusChange(semester, 'closed')}>
                                                                                <CheckCircle className="mr-2 h-4 w-4 text-gray-500" /> Mark as Closed
                                                                            </DropdownMenuItem>}
                                                                            {semester.status !== 'locked' && <DropdownMenuItem onClick={() => handleSemesterStatusChange(semester, 'locked')}>
                                                                                <Lock className="mr-2 h-4 w-4 text-red-500" /> Mark as Locked
                                                                            </DropdownMenuItem>}
                                                                            {/* Deleting individual semesters is disabled to maintain session structure
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Semester
                                                                                    </DropdownMenuItem>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Delete Semester?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>This will permanently delete this semester. Are you sure?</AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction onClick={() => handleDeleteSemester(semester.id, session.id)}>Delete</AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                            */}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </TableRow>
                                                        ))
                                                      ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center text-muted-foreground">No semesters found for this session.</TableCell>
                                                        </TableRow>
                                                      )}
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
            </div>

             <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSession ? 'Edit Session' : 'Add New Session'}</DialogTitle>
                    </DialogHeader>
                    <SessionForm
                        session={editingSession}
                        onClose={() => setShowSessionModal(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showSemesterModal} onOpenChange={setShowSemesterModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Semester</DialogTitle>
                    </DialogHeader>
                    {currentSessionForSemester && (
                        <SemesterForm
                            semester={editingSemester}
                            sessionId={currentSessionForSemester}
                            onClose={() => setShowSemesterModal(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}

