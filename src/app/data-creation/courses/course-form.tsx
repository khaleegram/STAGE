'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Course, Program, Level } from '@/lib/types';
import { addCourse, updateCourse, deleteCourse } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, query, where, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CourseFormProps {
  course: Course | null;
  programs: Program[];
  onClose: () => void;
}

export function CourseForm({ course, programs, onClose }: CourseFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [selectedProgramId, setSelectedProgramId] = useState(course?.programId || '');
  const [programSearch, setProgramSearch] = useState(course?.programName || '');
  const [selectedLevelId, setSelectedLevelId] = useState(course?.levelId || '');
  const [courseCode, setCourseCode] = useState(course?.course_code || '');
  const [courseName, setCourseName] = useState(course?.course_name || '');
  const [creditUnit, setCreditUnit] = useState(course?.credit_unit.toString() || '1');
  const [examType, setExamType] = useState<'CBT' | 'Written'>(course?.exam_type || 'Written');
  
  // State for dependent dropdown
  const [levelsForProgram, setLevelsForProgram] = useState<Level[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);

  useEffect(() => {
    if (course) {
        setSelectedProgramId(course.programId || '');
        setProgramSearch(course.programName || '');
        setSelectedLevelId(course.levelId);
        setCourseCode(course.course_code);
        setCourseName(course.course_name);
        setCreditUnit(course.credit_unit.toString());
        setExamType(course.exam_type);
    } else {
        // Reset form for adding new
        setSelectedProgramId('');
        setProgramSearch('');
        setSelectedLevelId('');
        setCourseCode('');
        setCourseName('');
        setCreditUnit('1');
        setExamType('Written');
    }
  }, [course]);

  // Fetch levels when selectedProgramId changes
  useEffect(() => {
    if (!selectedProgramId) {
      setLevelsForProgram([]);
      setSelectedLevelId(''); // Reset level when program changes
      return;
    }

    setIsLoadingLevels(true);
    const levelsQuery = query(collection(db, 'levels'), where('programId', '==', selectedProgramId), orderBy('level'));
    const unsubscribe = onSnapshot(levelsQuery, (snapshot) => {
      const fetchedLevels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level));
      setLevelsForProgram(fetchedLevels);
      setIsLoadingLevels(false);

      if (course && course.programId === selectedProgramId) {
          setSelectedLevelId(course.levelId)
      } else {
          setSelectedLevelId('');
      }

    }, (error) => {
      console.error("Error fetching levels for program: ", error);
      setIsLoadingLevels(false);
      toast({ title: 'Error', description: 'Could not fetch levels.', variant: 'destructive' });
    });

    return () => unsubscribe();
  }, [selectedProgramId, course, toast]);

   // Auto-set exam type based on selected level
   useEffect(() => {
    if (selectedLevelId) {
      const selectedLevel = levelsForProgram.find(l => l.id === selectedLevelId);
      if (selectedLevel) {
        setExamType(selectedLevel.level === 1 ? 'CBT' : 'Written');
      }
    }
  }, [selectedLevelId, levelsForProgram]);


  // Server action setup
  const action = course ? updateCourse.bind(null, course.id) : addCourse;
  const [state, formAction] = useActionState(action, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        onClose();
      }
    }
  }, [state, toast, onClose]);
  
  const handleDelete = async () => {
    if (!course) return;
    const result = await deleteCourse(course.id);
     toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        setIsDeleteDialogOpen(false);
        onClose();
      }
  };
  
  const filteredPrograms = useMemo(() => {
    if (!programSearch) return [];
    if (selectedProgramId && programs.find(p => p.id === selectedProgramId)?.name === programSearch) return [];
    return programs.filter(p => 
      p.name.toLowerCase().includes(programSearch.toLowerCase())
    );
  }, [programSearch, programs, selectedProgramId]);

  const handleSelectProgram = (prog: Program) => {
    setSelectedProgramId(prog.id);
    setProgramSearch(prog.name);
  }

  return (
    <>
      <form action={formAction} className="space-y-4">
        {/* Hidden inputs to pass all data to the server action */}
        <input type="hidden" name="levelId" value={selectedLevelId} />
        <input type="hidden" name="course_code" value={courseCode} />
        <input type="hidden" name="course_name" value={courseName} />
        <input type="hidden" name="credit_unit" value={creditUnit} />
        <input type="hidden" name="exam_type" value={examType} />

        {/* Program Selector */}
        <div>
            <label className="block text-sm font-medium mb-1">Program</label>
            <Input
              id="program-search"
              placeholder="Search for a program"
              value={programSearch}
              onChange={(e) => {
                setProgramSearch(e.target.value);
                setSelectedProgramId(''); // Clear selection when user types
              }}
              required
              autoComplete="off"
            />
            {filteredPrograms.length > 0 && (
              <div className="border border-input rounded-md mt-1 max-h-40 overflow-y-auto z-50 bg-background">
                {filteredPrograms.map(prog => (
                  <div
                    key={prog.id}
                    onClick={() => handleSelectProgram(prog)}
                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                  >
                    {prog.name}
                  </div>
                ))}
              </div>
            )}
        </div>


        {/* Level Selector (dependent on Program) */}
        <div>
          <label htmlFor='level-selector' className="block text-sm font-medium mb-1">Level</label>
            <Select onValueChange={setSelectedLevelId} value={selectedLevelId} disabled={!selectedProgramId || isLoadingLevels}>
                <SelectTrigger id="level-selector">
                    <SelectValue placeholder={isLoadingLevels ? "Loading levels..." : "Select a level"} />
                </SelectTrigger>
                <SelectContent>
                    {levelsForProgram.map((level) => (
                         <SelectItem key={level.id} value={level.id}>
                            {level.level}00 Level
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        
        {/* Course Details */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor='course-code' className="block text-sm font-medium mb-1">Course Code</label>
                <Input id="course-code" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g., CSC101" />
            </div>
            <div>
                <label htmlFor='credit-unit' className="block text-sm font-medium mb-1">Credit Unit</label>
                <Input id="credit-unit" type="number" value={creditUnit} onChange={(e) => setCreditUnit(e.target.value)} placeholder="e.g., 3" min="0"/>
            </div>
        </div>

        <div>
            <label htmlFor='course-name' className="block text-sm font-medium mb-1">Course Name</label>
            <Input id="course-name" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g., Introduction to Computing" />
        </div>

        <div>
            <label htmlFor='exam-type' className="block text-sm font-medium mb-1">Exam Type</label>
             <Select onValueChange={(value: 'CBT' | 'Written') => setExamType(value)} value={examType}>
                <SelectTrigger id="exam-type">
                    <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Written">Written</SelectItem>
                    <SelectItem value="CBT">CBT</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
                Exam type is automatically suggested based on level. 100L is CBT, others are Written.
            </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
            <div>
                {course && (
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the course and any combined course configurations it belongs to.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <SubmitButton label={course ? 'Update' : 'Add'} />
            </div>
        </div>
      </form>
    </>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? `${label}...` : label}
    </Button>
  );
}
