'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { AcademicSession, Semester, Course, Staff, Venue } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { format, differenceInWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { compileAndStoreGenerationData, getExistingGenerationData, GenerationData } from './actions';
import { Badge } from '@/components/ui/badge';

function GenerationSetup({ 
    onDataLoaded, 
    setIsLoading, 
    existingData 
}: { 
    onDataLoaded: (data: GenerationData | null) => void, 
    setIsLoading: (loading: boolean) => void,
    existingData: GenerationData | null
}) {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCompiling, setIsCompiling] = useState(false);
  const { toast } = useToast();

  // Fetch sessions
  useEffect(() => {
    const q = query(collection(db, 'academic_sessions'), orderBy('start_year', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicSession)));
    });
    return () => unsubscribe();
  }, []);

  // Fetch semesters when session changes
  useEffect(() => {
    if (!selectedSession) {
      setSemesters([]);
      setSelectedSemester('');
      return;
    }
    const q = query(collection(db, 'academic_sessions', selectedSession, 'semesters'), where('status', '==', 'open'), orderBy('semester_number'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSemesters(snapshot.docs.map(doc => ({ id: doc.id, sessionId: selectedSession, ...doc.data() } as Semester)));
    });
    return () => unsubscribe();
  }, [selectedSession]);

  // Fetch existing data when semester changes
  useEffect(() => {
    if (!selectedSemester) {
        onDataLoaded(null);
        setDateRange(undefined);
        return;
    };
    
    const fetchExistingData = async () => {
        setIsLoading(true);
        const { data, error } = await getExistingGenerationData(selectedSemester);
        if (error) {
            toast({ title: 'Error', description: error, variant: 'destructive' });
        }
        onDataLoaded(data);
        if(data?.dateRange) {
             setDateRange({
                from: new Date(data.dateRange.from!),
                to: new Date(data.dateRange.to!),
            });
        }
        setIsLoading(false);
    };

    fetchExistingData();
  }, [selectedSemester, onDataLoaded, setIsLoading, toast]);

  const handleCompileData = async () => {
    if (!selectedSemester || !selectedSession || !dateRange?.from || !dateRange?.to) {
      toast({ title: 'Missing Information', description: 'Please select a session, semester, and a valid date range.', variant: 'destructive' });
      return;
    }
    setIsCompiling(true);
    const { success, message } = await compileAndStoreGenerationData(selectedSemester, selectedSession, dateRange);
    
    if (success) {
      toast({ title: 'Success', description: message });
      // Refetch data after compiling
      const { data } = await getExistingGenerationData(selectedSemester);
      onDataLoaded(data);
    } else {
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setIsCompiling(false);
  };

  const weeks = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInWeeks(dateRange.to, dateRange.from);
    }
    return 0;
  }, [dateRange]);
  
  const compileButtonText = existingData ? 'Re-compile & Update Data' : 'Compile Data';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>1. Generation Setup</CardTitle>
                <CardDescription>Select the active semester and define the examination period.</CardDescription>
            </div>
            {existingData?.compiledAt && (
                 <p className="text-xs text-muted-foreground">
                    Last compiled: {format(new Date(existingData.compiledAt.seconds * 1000), 'PPP p')}
                </p>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select onValueChange={setSelectedSession} value={selectedSession}>
            <SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger>
            <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedSemester} value={selectedSemester} disabled={!selectedSession}>
            <SelectTrigger><SelectValue placeholder="Select Semester (Open only)" /></SelectTrigger>
            <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.semester_number === 1 ? 'First Semester' : 'Second Semester'}</SelectItem>)}</SelectContent>
          </Select>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center justify-between">
           <div className="text-sm text-muted-foreground">
             {weeks > 0 && `Total available weeks: ${weeks}`}
           </div>
           <Button onClick={handleCompileData} disabled={isCompiling || !selectedSemester || !dateRange?.from || !dateRange?.to}>
            {isCompiling ? 'Compiling...' : compileButtonText}
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const DataTable = ({ title, description, headers, children, isLoading }: { title: string, description: string, headers: string[], children: React.ReactNode, isLoading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map(h => <TableHead key={h}>{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {children}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
    </Card>
);


export default function GenerationPage() {
  const [generationData, setGenerationData] = useState<GenerationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Generate Timetable</h1>
      </div>
      
      <GenerationSetup onDataLoaded={setGenerationData} setIsLoading={setIsLoading} existingData={generationData} />
      
      {generationData && (
          <>
            <div className="flex items-center justify-end">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Proceed to Generate Timetable
                </Button>
            </div>
            <DataTable
                title="2. Course Details"
                description="All courses to be scheduled for the examination."
                headers={['Course Code', 'Offering Programs', 'Exam Type']}
                isLoading={isLoading}
            >
                {generationData.courses?.length > 0 ? generationData.courses.map(c => (
                    <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.course_code}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {c.offeringPrograms.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                            </div>
                        </TableCell>
                        <TableCell>{c.exam_type}</TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center">No courses found.</TableCell></TableRow>}
            </DataTable>
            <DataTable
                title="3. Staff List"
                description="All available staff for invigilation duties."
                headers={['S/N', 'Name', 'College', 'Department', 'Phone Number']}
                isLoading={isLoading}
            >
                {generationData.staff?.length > 0 ? generationData.staff.map((s, i) => (
                    <TableRow key={s.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.collegeName}</TableCell>
                        <TableCell>{s.departmentName}</TableCell>
                        <TableCell>{s.phone}</TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={5} className="text-center">No staff found.</TableCell></TableRow>}
            </DataTable>
            <DataTable
                title="4. Venue Information"
                description="All available venues for the examination."
                headers={['Hall Name', 'Venue Code', 'Exam Capacity']}
                isLoading={isLoading}
            >
                {generationData.venues?.length > 0 ? generationData.venues.map(v => (
                    <TableRow key={v.id}>
                        <TableCell>{v.name}</TableCell>
                        <TableCell>{v.code}</TableCell>
                        <TableCell>{v.capacity}</TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center">No venues found.</TableCell></TableRow>}
            </DataTable>
          </>
      )}

    </div>
  );
}
