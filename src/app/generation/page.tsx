
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { CalendarIcon, Sparkles, Clock, AlertTriangle, PlusCircle, X } from 'lucide-react';
import { format, differenceInWeeks, eachDayOfInterval, getDay, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { compileAndStoreGenerationData, getExistingGenerationData, GenerationData } from './actions';
import { generateExamTimetable, GenerateExamTimetableInput, GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { Badge } from '@/components/ui/badge';
import { TimetableDisplay } from '@/components/timetable/timetable-display';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// --- Time Slot Logic & Components ---
interface TimeSlot {
    time: string;
    type: 'standard' | 'overflow';
}

interface DailyTimeSlots {
    day: Date;
    slots: TimeSlot[];
}

const defaultTimeSlots: TimeSlot[] = [
    { time: '8:00 AM – 10:00 AM', type: 'standard' },
    { time: '10:00 AM – 12:00 PM', type: 'standard' },
    { time: '2:00 PM – 4:00 PM', type: 'standard' },
    { time: '4:00 PM – 6:00 PM', type: 'overflow' },
];

const generateAllTimeSlots = (range: DateRange): DailyTimeSlots[] => {
    if (!range.from || !range.to) return [];

    const days = eachDayOfInterval({ start: range.from, end: range.to });

    return days.map(day => {
        const isSunday = getDay(day) === 0;
        return {
            day,
            slots: defaultTimeSlots.map(slot => ({
                ...slot,
                type: isSunday ? 'overflow' : slot.type,
            })),
        };
    });
};

const timeOptions = Array.from({ length: 32 }, (_, i) => { // 7:00 AM to 10:30 PM
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  const date = new Date(2000, 0, 1, hour, minute);
  return format(date, 'h:mm a');
});

function AddSlotModal({ isOpen, onClose, onAddSlot }: { isOpen: boolean, onClose: () => void, onAddSlot: (slot: TimeSlot) => void }) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [type, setType] = useState<'standard' | 'overflow'>('standard');
    const [error, setError] = useState<string | null>(null);

    const handleAdd = () => {
        setError(null);
        if (!startTime || !endTime) {
            setError('Please select a start and end time.');
            return;
        }

        const startDate = parse(startTime, 'h:mm a', new Date());
        const endDate = parse(endTime, 'h:mm a', new Date());

        if (startDate >= endDate) {
            setError('End time must be after start time.');
            return;
        }
        
        const timeString = `${startTime} – ${endTime}`;
        onAddSlot({ time: timeString, type });
        setStartTime('');
        setEndTime('');
        onClose();
    };
    
    const filteredEndTimeOptions = useMemo(() => {
        if (!startTime) return timeOptions;
        const startDate = parse(startTime, 'h:mm a', new Date());
        return timeOptions.filter(time => parse(time, 'h:mm a', new Date()) > startDate);
    }, [startTime]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Custom Time Slot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="grid grid-cols-2 gap-4">
                        <Select onValueChange={setStartTime} value={startTime}>
                            <SelectTrigger><SelectValue placeholder="Start Time" /></SelectTrigger>
                            <SelectContent>
                                {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setEndTime} value={endTime} disabled={!startTime}>
                            <SelectTrigger><SelectValue placeholder="End Time" /></SelectTrigger>
                            <SelectContent>
                                {filteredEndTimeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Select onValueChange={(v: 'standard' | 'overflow') => setType(v)} defaultValue={type}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="overflow">Overflow</SelectItem>
                        </SelectContent>
                    </Select>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAdd}>Add Slot</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- End Time Slot Logic & Components ---


function GenerationSetup({ 
    onDataLoaded, 
    setIsLoading, 
    existingData,
    onDateChange
}: { 
    onDataLoaded: (data: GenerationData | null) => void, 
    setIsLoading: (loading: boolean) => void,
    existingData: GenerationData | null,
    onDateChange: (range: DateRange | undefined) => void
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
        onDateChange(undefined);
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
            const range = {
                from: new Date(data.dateRange.from!),
                to: new Date(data.dateRange.to!),
            };
            setDateRange(range);
            onDateChange(range); // Pass date up to parent
        } else {
            setDateRange(undefined);
            onDateChange(undefined);
        }
        setIsLoading(false);
    };

    fetchExistingData();
  }, [selectedSemester, onDataLoaded, setIsLoading, toast, onDateChange]);

  const handleDateSelect = (range: DateRange | undefined) => {
      setDateRange(range);
      onDateChange(range);
  }

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
                onSelect={handleDateSelect}
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

const TimeSlotsDisplay = ({ dailySlots, isLoading, setDailySlots }: { dailySlots: DailyTimeSlots[], isLoading: boolean, setDailySlots: (slots: DailyTimeSlots[]) => void }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [dayToEdit, setDayToEdit] = useState<Date | null>(null);

    const handleRemoveSlot = (day: Date, slotToRemove: TimeSlot) => {
        setDailySlots(dailySlots.map(d => {
            if (d.day.getTime() === day.getTime()) {
                return { ...d, slots: d.slots.filter(s => s.time !== slotToRemove.time) };
            }
            return d;
        }));
    };

    const handleOpenAddModal = (day: Date) => {
        setDayToEdit(day);
        setIsAddModalOpen(true);
    };

    const handleAddSlot = (newSlot: TimeSlot) => {
        if (!dayToEdit) return;
        setDailySlots(dailySlots.map(d => {
            if (d.day.getTime() === dayToEdit.getTime()) {
                // Check for duplicates before adding
                if (!d.slots.some(s => s.time === newSlot.time)) {
                    return { ...d, slots: [...d.slots, newSlot].sort((a,b) => a.time.localeCompare(b.time)) };
                }
            }
            return d;
        }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>2. Time Slots Editor</CardTitle>
                <CardDescription>Default daily time slots for the selected examination period. You can add or remove slots for each day.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : dailySlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {dailySlots.map(({ day, slots }) => (
                            <div key={day.toISOString()} className={cn("rounded-lg p-3 flex flex-col", getDay(day) === 0 ? "bg-amber-100 border border-amber-300" : "bg-muted/60")}>
                                <h4 className={cn("font-semibold mb-2", getDay(day) === 0 && "text-amber-800")}>{format(day, 'eeee, MMM d')}</h4>
                                <div className="space-y-1 flex-grow">
                                    {slots.map(slot => (
                                        <div key={slot.time} className="flex items-center justify-between text-xs p-1 rounded group hover:bg-black/5">
                                            <span>{slot.time}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={slot.type === 'overflow' ? 'destructive' : 'secondary'} className="capitalize">{slot.type}</Badge>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveSlot(day, slot)}>
                                                    <X className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => handleOpenAddModal(day)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Slot
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-8 text-muted-foreground">
                        <p>Select a date range to see and edit the default time slots.</p>
                    </div>
                )}
            </CardContent>
            <AddSlotModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddSlot={handleAddSlot} />
        </Card>
    );
};


const DataTable = ({ title, description, headers, children, isLoading, stepNumber }: { title: string, description: string, headers: string[], children: React.ReactNode, isLoading: boolean, stepNumber: number }) => (
    <Card>
        <CardHeader>
            <CardTitle>{stepNumber}. {title}</CardTitle>
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeSlots, setTimeSlots] = useState<DailyTimeSlots[]>([]);
  const [timetableResult, setTimetableResult] = useState<GenerateExamTimetableOutput | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDateChange = useCallback((range: DateRange | undefined) => {
    if (range?.from && range.to) {
        setTimeSlots(generateAllTimeSlots(range));
    } else {
        setTimeSlots([]);
    }
  }, []);

  const handleDataLoaded = useCallback((data: GenerationData | null) => {
      setGenerationData(data);
  }, []);

  const handleSetIsLoading = useCallback((loading: boolean) => {
      setIsLoading(loading);
  }, []);

  const handleGenerateTimetable = async () => {
    if (!generationData) {
        toast({ title: 'Error', description: 'No compiled data available to generate a timetable.', variant: 'destructive' });
        return;
    }

    setIsGenerating(true);
    setTimetableResult(null);
    setGenerationError(null);

    // Get student count for each course
    const coursesWithStudentCount = await Promise.all(generationData.courses.map(async course => {
        let student_count = 0;
        if (course.levelId) {
            const levelRef = (await getDocs(query(collection(db, 'levels'), where('levelId', '==', course.levelId)))).docs[0];
            if(levelRef && levelRef.exists()) {
                 const levelDoc = (await getDocs(query(collection(db, 'levels'), where('programId', '==', levelRef.data().programId), where('level', '==', levelRef.data().level)))).docs[0];
                 if(levelDoc && levelDoc.exists()){
                    student_count = levelDoc.data().students_count;
                 }
            }
        }
        return { ...course, student_count };
    }));


    const aiInput: GenerateExamTimetableInput = {
        courses: coursesWithStudentCount.map(c => ({
            id: c.id,
            course_code: c.course_code,
            course_name: c.course_name,
            exam_type: c.exam_type,
            offeringPrograms: c.offeringPrograms,
            student_count: c.student_count || 0
        })),
        venues: generationData.venues,
        staff: generationData.staff.map(s => ({
            id: s.id,
            name: s.name,
            collegeName: s.collegeName || 'N/A',
            departmentName: s.departmentName || 'N/A'
        })),
        timeSlots: timeSlots.map(ts => ({
            day: format(ts.day, 'yyyy-MM-dd'),
            slots: ts.slots
        }))
    };

    try {
        const result = await generateExamTimetable(aiInput);
        setTimetableResult(result);
        toast({ title: "Success", description: "Timetable generated successfully!"});
    } catch (e: any) {
        console.error("Timetable generation failed:", e);
        setGenerationError(e.message || "An unknown error occurred during AI generation.");
        toast({ title: "Generation Failed", description: e.message || "An unknown error occurred.", variant: 'destructive' });
    } finally {
        setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Generate Timetable</h1>
      </div>
      
      <GenerationSetup 
        onDataLoaded={handleDataLoaded} 
        setIsLoading={handleSetIsLoading} 
        existingData={generationData} 
        onDateChange={handleDateChange} 
      />
      
      <TimeSlotsDisplay dailySlots={timeSlots} isLoading={isLoading} setDailySlots={setTimeSlots}/>
      
      {generationData && (
          <>
            <div className="flex items-center justify-end">
                <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleGenerateTimetable} disabled={isGenerating}>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {isGenerating ? 'Generating with AI...' : 'Proceed to Generate Timetable'}
                </Button>
            </div>

            { (isGenerating || timetableResult || generationError) &&
                <TimetableDisplay result={timetableResult} isLoading={isGenerating} error={generationError} />
            }

            <DataTable
                stepNumber={3}
                title="Course Details"
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
                stepNumber={4}
                title="Staff List"
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
                stepNumber={5}
                title="Venue Information"
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
