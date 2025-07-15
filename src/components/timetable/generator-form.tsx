'use client';

import { useForm } from 'react-hook-form';
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

const formSchema = z.object({
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectDependencies: '',
      studentEnrollment: '',
      facultyAvailability: '',
      roomCapacities: '',
      examDuration: '3 hours',
      additionalConstraints: '',
    },
  });

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
                    <Textarea placeholder="e.g., CS101: 150 students, MATH203: 80 students..." {...field} />
                  </FormControl>
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
                    <Textarea placeholder="e.g., Hall A: 200, Room 101: 50, Lab B: 30." {...field} />
                  </FormControl>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
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
