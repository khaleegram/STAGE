'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { Course, Program, Level } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseForm } from './course-form';

const CoursesPage: React.FC = () => {
  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  
  // Loading and modal state
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Filter state
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Programs
    const progsQuery = query(collection(db, 'programs'), orderBy('name'));
    const unsubscribeProgs = onSnapshot(progsQuery, (snapshot) => {
      setPrograms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program)));
    }, (error) => {
      console.error("Error fetching programs: ", error);
      toast({ title: 'Error', description: 'Could not fetch programs.', variant: 'destructive' });
    });

    // Fetch Levels based on selected program
    let unsubscribeLevels = () => {};
    if (selectedProgram && selectedProgram !== 'all') {
        const levelsQuery = query(collection(db, 'levels'), where('programId', '==', selectedProgram), orderBy('level'));
        unsubscribeLevels = onSnapshot(levelsQuery, (snapshot) => {
            setLevels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level)));
        });
    } else {
        setLevels([]);
    }

    // Fetch Courses and denormalize program/level info
    const coursesQuery = query(collection(db, 'courses'), orderBy('course_code'));
    const unsubscribeCourses = onSnapshot(coursesQuery, async (snapshot) => {
      setIsLoading(true);
      const coursesListPromises = snapshot.docs.map(async (c) => {
        const data = c.data();
        const course: Course = {
          id: c.id,
          course_code: data.course_code || 'N/A',
          course_name: data.course_name || 'N/A',
          credit_unit: data.credit_unit || 0,
          exam_type: data.exam_type || 'Written',
          levelId: data.levelId,
        };

        if (course.levelId) {
          try {
            const levelRef = doc(db, 'levels', course.levelId);
            const levelSnap = await getDoc(levelRef);
            if (levelSnap.exists()) {
              const levelData = levelSnap.data();
              course.levelNumber = levelData.level;
              course.programId = levelData.programId;
              
              if (course.programId) {
                const programRef = doc(db, 'programs', course.programId);
                const programSnap = await getDoc(programRef);
                if (programSnap.exists()) {
                  course.programName = programSnap.data().name || 'Unknown Program';
                }
              }
            }
          } catch (e) {
            console.error(`Failed to denormalize course ${c.id}`, e);
          }
        }
        return course;
      });
      
      const coursesList = await Promise.all(coursesListPromises);
      setCourses(coursesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching courses: ", error);
      toast({ title: 'Error', description: 'Could not fetch courses.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => {
      unsubscribeProgs();
      unsubscribeLevels();
      unsubscribeCourses();
    };
  }, [toast, selectedProgram]);
  
  const handleProgramFilterChange = (programId: string) => {
    setSelectedProgram(programId);
    setSelectedLevel('all'); // Reset level filter when program changes
  };

  const handleAddNew = () => {
    setEditingCourse(null);
    setShowModal(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setShowModal(true);
  };

  const filteredCourses = useMemo(() => {
    let filtered = courses;
    if (selectedProgram && selectedProgram !== 'all') {
        filtered = filtered.filter(c => c.programId === selectedProgram);
    }
    if (selectedLevel && selectedLevel !== 'all') {
        filtered = filtered.filter(c => c.levelId === selectedLevel);
    }
    return filtered.sort((a,b) => (a.levelNumber || 0) - (b.levelNumber || 0) || a.course_code.localeCompare(b.course_code));
  }, [courses, selectedProgram, selectedLevel]);

  const groupedCourses = useMemo(() => {
    return filteredCourses.reduce((acc, course) => {
      const progName = course.programName || 'Uncategorized';
      if (!acc[progName]) {
        acc[progName] = [];
      }
      acc[progName].push(course);
      return acc;
    }, {} as Record<string, Course[]>);
  }, [filteredCourses]);


  return (
    <section className="bg-card/80 dark:bg-card/60 p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Courses</h3>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/50 p-4 rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                 <Select onValueChange={handleProgramFilterChange} value={selectedProgram}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Filter by Program" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select onValueChange={setSelectedLevel} value={selectedLevel} disabled={!selectedProgram || selectedProgram === 'all'}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.level}00 Level</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto mt-2 sm:mt-0">
                + Add Course
            </Button>
        </div>
        
        {isLoading ? (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-24 w-full" />
            </div>
        ) : (
            <div className="space-y-8">
                {Object.keys(groupedCourses).length > 0 ? Object.entries(groupedCourses).map(([progName, courseArray]) => (
                    <div key={progName}>
                        <h2 className="text-xl font-semibold mb-2 text-primary">{progName}</h2>
                         <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full table-auto">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-4 text-left font-semibold">Code</th>
                                        <th className="p-4 text-left font-semibold">Name</th>
                                        <th className="p-4 text-left font-semibold">Level</th>
                                        <th className="p-4 text-left font-semibold">Credit Unit</th>
                                        <th className="p-4 text-left font-semibold">Exam Type</th>
                                        <th className="p-4 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {courseArray.map((course) => (
                                        <tr key={course.id}>
                                            <td className="p-4 font-medium">{course.course_code}</td>
                                            <td className="p-4">{course.course_name}</td>
                                            <td className="p-4">{course.levelNumber}00 Level</td>
                                            <td className="p-4">{course.credit_unit}</td>
                                            <td className="p-4">{course.exam_type}</td>
                                            <td className="p-4 flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                                                Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-8 text-muted-foreground bg-card/50 rounded-lg border">
                        No courses found for the selected filters.
                    </div>
                )}
            </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          </DialogHeader>
          <CourseForm
            course={editingCourse}
            programs={programs}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CoursesPage;
