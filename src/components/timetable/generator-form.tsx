'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { handleGenerateTimetable } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { AcademicSession, Semester, Venue, Course, Level } from '@/lib/types';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  sessionId: z.string().min(1, 'Please select a session.'),
  semesterId: z.string().min(1, 'Please select a semester.'),
  subjectDependencies: z.string().min(10, { message: 'Please provide more details on subject dependencies.' }),
  studentEnrollment: z.string().min(10, { message: 'Please provide more details on student enrollment.' }),
  facultyAvailability: z.string().min(10, { message: 'Please provide more details on faculty availability.' }),
  roomCapacities: z.string().min(10, { message: 'Please provide more details on room capacities.' }),
  examDuration: z.string().min(3, { message: 'Please specify exam duration(s).' }),
  additionalConstraints: z.string().optional(),
});

type GeneratorFormProps = {
  onGeneration: (result: GenerateExamTimetableOutput | null, error?: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
};

export function GeneratorForm({ onGeneration, setIsLoading, isLoading }: GeneratorFormProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionId: '',
      semesterId: '',
      subjectDependencies: 'e.g., CSC401 depends on CSC301.',
      studentEnrollment: '',
      facultyAvailability: 'e.g., Dr. Bello is available Mon-Wed. All staff available on Fridays.',
      roomCapacities: '',
      examDuration: '3 hours',
      additionalConstraints: 'e.g., No exams after 6pm. Computer Science exams should be held in the CBT center.',
    },
  });

  const selectedSessionId = form.watch('sessionId');

  // Fetch sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      const q = query(collection(db, 'academic_sessions'), orderBy('start_year', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedSessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicSession));
      setSessions(fetchedSessions);
    };
    fetchSessions();
  }, []);

  // Fetch semesters when session changes
  useEffect(() => {
    if (!selectedSessionId) {
      setSemesters([]);
      form.setValue('semesterId', '');
      return;
    }
    const fetchSemesters = async () => {
      const q = query(collection(db, 'academic_sessions', selectedSessionId, 'semesters'), orderBy('semester_number'));
      const querySnapshot = await getDocs(q);
      const fetchedSemesters = querySnapshot.docs.map(doc => ({ id: doc.id, sessionId: selectedSessionId, ...doc.data() } as Semester));
      setSemesters(fetchedSemesters);
    };
    fetchSemesters();
  }, [selectedSessionId, form]);

  // Pre-fill form when semester changes
  useEffect(() => {
    const prefillData = async () => {
      setIsDataLoading(true);
      
      const [venuesSnapshot, levelsSnapshot, coursesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'venues'), orderBy('name'))),
        getDocs(query(collection(db, 'levels'), orderBy('level'))),
        getDocs(query(collection(db, 'courses'), orderBy('course_code')))
      ]);
      
      const venues = venuesSnapshot.docs.map(doc => doc.data() as Venue);
      const levels = levelsSnapshot.docs.map(doc => doc.data() as Level);
      const courses = coursesSnapshot.docs.map(doc => doc.data() as Course);

      const roomCapacities = venues.map(v => `${v.code} (${v.name}): ${v.capacity} capacity, type: ${v.venue_type}`).join('\n');
      const studentEnrollment = courses.map(c => {
          const levelInfo = levels.find(l => l.id === c.levelId);
          return `${c.course_code}: ${levelInfo?.students_count || 0} students`;
      }).join('\n');

      form.setValue('roomCapacities', roomCapacities);
      form.setValue('studentEnrollment', studentEnrollment);
      
      setIsDataLoading(false);
    };

    if (form.watch('semesterId')) {
      prefillData();
    }
  }, [form.watch('semesterId'), form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    onGeneration(null);
    const { data, error } = await handleGenerateTimetable(values);
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      onGeneration(null, error);
    } else {
      toast({
        title: 'Success!',
        description: 'Your timetable has been generated.',
      });
      onGeneration(data);
    }
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Timetable</CardTitle>
        <CardDescription>
          Provide constraints to generate an optimized exam timetable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="semesterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSessionId || semesters.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.semester_number === 1 ? 'First Semester' : 'Second Semester'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {isDataLoading && (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
            <div className={isDataLoading ? 'hidden' : 'space-y-6'}>
              <FormField
                control={form.control}
                name="subjectDependencies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Dependencies</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Calculus II requires Calculus I. Physics II requires Physics I..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentEnrollment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Enrollment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., CS101: 150 students, MATH203: 80 students..." {...field} rows={5}/>
                    </FormControl>
                     <FormDescription>This data is pre-filled based on your selection.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facultyAvailability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty Availability</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Dr. Smith: Mon-Wed, 9am-5pm. Prof. Jones: not available on Fridays." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomCapacities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Capacities</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Hall A: 200, Room 101: 50, Lab B: 30." {...field} rows={5}/>
                    </FormControl>
                     <FormDescription>This data is pre-filled based on your selection.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="examDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 3 hours for all exams." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalConstraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Constraints (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., No exams after 6pm." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isDataLoading}>
              {isLoading || isDataLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLoading ? 'Generating...' : 'Loading Data...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles />
                  Generate with AI
                </span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
