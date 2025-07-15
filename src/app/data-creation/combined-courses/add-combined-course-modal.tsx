'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Course, Program, Level } from '@/lib/types';
import { collection, getDocs, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addCombinedCourse } from './actions';

interface AddCombinedCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const offeringSchema = z.object({
  programId: z.string().min(1, 'Program is required.'),
  levelId: z.string().min(1, 'Level is required.'),
});

const formSchema = z.object({
  courseId: z.string().min(1, 'A base course must be selected.'),
  offerings: z.array(offeringSchema).min(1, 'At least one offering is required.'),
});

export function AddCombinedCourseModal({ isOpen, onClose }: AddCombinedCourseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isCoursePopoverOpen, setIsCoursePopoverOpen] = useState(false);

  // Fetch all necessary data
  useEffect(() => {
    const unsubCourses = onSnapshot(query(collection(db, 'courses'), orderBy('course_name')), (snap) => {
        setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });
    const unsubPrograms = onSnapshot(query(collection(db, 'programs'), orderBy('name')), (snap) => {
        setPrograms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program)));
    });
    const unsubLevels = onSnapshot(query(collection(db, 'levels'), orderBy('level')), (snap) => {
        setLevels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level)));
    });

    return () => {
      unsubCourses();
      unsubPrograms();
      unsubLevels();
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: '',
      offerings: [{ programId: '', levelId: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'offerings',
  });
  
  const selectedCourseId = form.watch('courseId');

  const selectedCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId);
  }, [selectedCourseId, courses]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await addCombinedCourse(values);
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) {
      form.reset();
      onClose();
    }
    setIsSubmitting(false);
  }
  
  const getLevelsForProgram = (programId: string) => {
    return levels.filter(l => l.programId === programId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a New Combined Course</DialogTitle>
          <DialogDescription>
            Select a base course and specify which programs and levels it should be offered to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Selector */}
             <div>
                <label className="block text-sm font-medium mb-1">Base Course</label>
                <Controller
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                         <Popover open={isCoursePopoverOpen} onOpenChange={setIsCoursePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    <span className="truncate">{field.value ? courses.find(c => c.id === field.value)?.course_name : "Select a course..."}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search courses..." />
                                    <CommandList>
                                        <CommandEmpty>No course found.</CommandEmpty>
                                        <CommandGroup>
                                            {courses.map((course) => (
                                            <CommandItem
                                                key={course.id}
                                                value={`${course.course_code} ${course.course_name}`}
                                                onSelect={() => {
                                                    field.onChange(course.id);
                                                    setIsCoursePopoverOpen(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", field.value === course.id ? "opacity-100" : "opacity-0")} />
                                                {course.course_code} - {course.course_name}
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {form.formState.errors.courseId && <p className="text-sm text-destructive mt-1">{form.formState.errors.courseId.message}</p>}
                {selectedCourse && (
                     <p className="text-xs text-muted-foreground mt-1">
                        Selected exam type (from base course): <span className="font-bold">{selectedCourse.exam_type}</span>
                    </p>
                )}
            </div>

            {/* Offerings */}
            <div>
                <h3 className="text-lg font-medium">Offerings</h3>
                <div className="space-y-4 mt-2">
                    {fields.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                                <Controller
                                    control={form.control}
                                    name={`offerings.${index}.programId`}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                                            <SelectContent>
                                                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Controller
                                    control={form.control}
                                    name={`offerings.${index}.levelId`}
                                    render={({ field }) => (
                                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch(`offerings.${index}.programId`)}>
                                            <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                            <SelectContent>
                                                {getLevelsForProgram(form.watch(`offerings.${index}.programId`)).map(l => (
                                                    <SelectItem key={l.id} value={l.id}>{l.level}00 Level</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <X className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
                {form.formState.errors.offerings && <p className="text-sm text-destructive mt-1">{form.formState.errors.offerings.message}</p>}

                 <Button type="button" variant="outline" size="sm" onClick={() => append({ programId: '', levelId: '' })} className="mt-2">
                    + Add Another Offering
                </Button>
            </div>


            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Combined Course'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
