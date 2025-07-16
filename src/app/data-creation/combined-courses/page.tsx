'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { CombinedCourse, Program, Level, CombinedCourseOffering } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { deleteCombinedCourse } from './actions';
import { AddCombinedCourseModal } from './add-combined-course-modal';
import { EditCombinedCourseForm } from './edit-combined-course-form';
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
} from "@/components/ui/alert-dialog";


const CombinedCoursesPage: React.FC = () => {
  const [combinedCourses, setCombinedCourses] = useState<CombinedCourse[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CombinedCourse | null>(null);

  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  
  const { toast } = useToast();

  useEffect(() => {
    const progsQuery = query(collection(db, 'programs'), orderBy('name'));
    const unsubscribeProgs = onSnapshot(progsQuery, (snapshot) => {
      setPrograms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program)));
    });

    const levelsQuery = query(collection(db, 'levels'), orderBy('level'));
    const unsubscribeLevels = onSnapshot(levelsQuery, (snapshot) => {
        setLevels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level)));
    });

    const ccQuery = query(collection(db, 'combined_courses'), orderBy('course_code'));
    const unsubscribeCC = onSnapshot(ccQuery, async (snapshot) => {
      setIsLoading(true);
      const coursesListPromises = snapshot.docs.map(async (ccDoc) => {
        const data = ccDoc.data();
        const offeringsSnapshot = await getDocs(collection(db, 'combined_courses', ccDoc.id, 'offerings'));
        
        const offeringsPromises = offeringsSnapshot.docs.map(async (offeringDoc) => {
            const offering = offeringDoc.data();
            let programName = 'Unknown Program';
            let levelNumber = 0;
            const programId = offering.programId || 'N/A';
            const levelId = offering.levelId || 'N/A';

            if (levelId !== 'N/A') {
              try {
                const levelRef = doc(db, 'levels', levelId);
                const levelSnap = await getDoc(levelRef);
                if (levelSnap.exists()) {
                    const levelData = levelSnap.data();
                    levelNumber = levelData.level || 0;
                    
                    if (levelData.programId) {
                      const progRef = doc(db, 'programs', levelData.programId);
                      const progSnap = await getDoc(progRef);
                      if (progSnap.exists()) {
                          programName = progSnap.data().name || 'Unknown Program';
                      }
                    }
                }
              } catch (error) {
                console.error(`Error fetching details for offering with levelId ${levelId}`, error);
              }
            }
            return { programName, level: levelNumber, programId, levelId };
        });

        const resolvedOfferings = await Promise.all(offeringsPromises);

        return {
          id: ccDoc.id,
          base_course_id: data.base_course_id,
          course_code: data.course_code,
          course_name: data.course_name,
          exam_type: data.exam_type,
          offerings: resolvedOfferings,
        } as CombinedCourse;
      });
      
      const coursesList = await Promise.all(coursesListPromises);
      setCombinedCourses(coursesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching combined courses: ", error);
      toast({ title: 'Error', description: 'Could not fetch data.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => {
      unsubscribeProgs();
      unsubscribeLevels();
      unsubscribeCC();
    };
  }, [toast]);
  
  const handleProgramFilterChange = (programId: string) => {
    setSelectedProgram(programId);
    setSelectedLevel('all'); 
  };

  const handleDelete = async (courseId: string) => {
    const result = await deleteCombinedCourse(courseId);
    toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
    });
  }

  const levelsForFilter = useMemo(() => {
    if (selectedProgram === 'all') return [];
    return levels.filter(l => l.programId === selectedProgram);
  }, [selectedProgram, levels]);

  const filteredCourses = useMemo(() => {
    return combinedCourses.filter(course => {
      if (selectedProgram !== 'all' && !course.offerings.some(o => o.programId === selectedProgram)) {
        return false;
      }
      if (selectedLevel !== 'all' && !course.offerings.some(o => o.levelId === selectedLevel)) {
        return false;
      }
      return true;
    });
  }, [combinedCourses, selectedProgram, selectedLevel]);

  const combinedCourseBaseIds = useMemo(() => {
    return combinedCourses.map(c => c.base_course_id);
  }, [combinedCourses]);

  return (
    <section className="bg-card/80 dark:bg-card/60 p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Combined Courses</h3>

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
                 <Select onValueChange={setSelectedLevel} value={selectedLevel} disabled={selectedProgram === 'all'}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levelsForFilter.map(l => <SelectItem key={l.id} value={l.id}>{l.level}00 Level</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto mt-2 sm:mt-0">
                + Combine Course
            </Button>
        </div>
        
        {isLoading ? (
            <Skeleton className="h-48 w-full" />
        ) : (
            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full table-auto">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="p-4 text-left font-semibold">Code</th>
                            <th className="p-4 text-left font-semibold">Name</th>
                            <th className="p-4 text-left font-semibold">Offered To</th>
                            <th className="p-4 text-left font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredCourses.map((course) => (
                            <tr key={course.id} className="hover:bg-muted/30">
                                <td className="p-4 font-medium">{course.course_code}</td>
                                <td className="p-4">{course.course_name}</td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                    {course.offerings.map((offering, index) => (
                                        <Badge key={index} variant="secondary">
                                        {offering.programName} - {offering.level}00 Level
                                        </Badge>
                                    ))}
                                    </div>
                                </td>
                                <td className="p-4 flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setEditingCourse(course)}>Edit</Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">Delete</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the combined course configuration.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(course.id)}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </td>
                            </tr>
                        ))}
                         {filteredCourses.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-muted-foreground">
                                    No combined courses found for the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      <AddCombinedCourseModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        combinedCourseIds={combinedCourseBaseIds}
      />

      <Dialog open={!!editingCourse} onOpenChange={(isOpen) => !isOpen && setEditingCourse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Combined Course Offerings</DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <EditCombinedCourseForm
              course={editingCourse}
              allPrograms={programs}
              allLevels={levels}
              onClose={() => setEditingCourse(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CombinedCoursesPage;
