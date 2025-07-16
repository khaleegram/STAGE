
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Level, Program } from '@/lib/types';
import { addLevel, updateLevel, deleteLevel } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LevelFormProps {
  level: Level | null;
  programs: Program[];
  onClose: () => void;
}

export function LevelForm({ level, programs, onClose }: LevelFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form state
  const [selectedProgramId, setSelectedProgramId] = useState(level?.programId || '');
  const [programSearch, setProgramSearch] = useState(level?.programName || '');
  const [levelNumber, setLevelNumber] = useState(level?.level.toString() || '');
  const [studentCount, setStudentCount] = useState(level?.students_count.toString() || '0');
  
  const [existingLevels, setExistingLevels] = useState<number[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);

  useEffect(() => {
    if (level) {
      setSelectedProgramId(level.programId);
      setProgramSearch(level.programName || '');
      setLevelNumber(level.level.toString());
      setStudentCount(level.students_count.toString());
    } else {
      setSelectedProgramId('');
      setProgramSearch('');
      setLevelNumber('');
      setStudentCount('0');
    }
  }, [level]);

  // Fetch existing levels for the selected program
  useEffect(() => {
    if (!selectedProgramId) {
      setExistingLevels([]);
      setLevelNumber('');
      return;
    }
    setIsLoadingLevels(true);
    const levelsQuery = query(collection(db, 'levels'), where('programId', '==', selectedProgramId));
    const unsubscribe = onSnapshot(levelsQuery, (snapshot) => {
      const levels = snapshot.docs.map(doc => doc.data().level as number);
      setExistingLevels(levels);
      setIsLoadingLevels(false);
    });

    return () => unsubscribe();
  }, [selectedProgramId]);


  // Server action setup
  const action = level ? updateLevel.bind(null, level.id) : addLevel;
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
    if (!level) return;
    const result = await deleteLevel(level.id);
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

  const availableLevels = useMemo(() => {
    const selectedProgram = programs.find(p => p.id === selectedProgramId);
    if (!selectedProgram) return [];
    
    const maxLevel = selectedProgram.max_level;
    const allPossibleLevels = Array.from({ length: maxLevel }, (_, i) => i + 1);
    
    // For a new level, filter out existing ones. For an existing level, allow its own number.
    return allPossibleLevels.filter(lvl => 
        !existingLevels.includes(lvl) || (level && level.level === lvl)
    );
  }, [selectedProgramId, programs, existingLevels, level]);


  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="programId" value={selectedProgramId} />
        <input type="hidden" name="level" value={levelNumber} />
        <input type="hidden" name="students_count" value={studentCount} />

        <div>
            <label className="block text-sm font-medium mb-1">Program</label>
            <Input
              id="program-search"
              placeholder="Search for a program"
              value={programSearch}
              onChange={(e) => {
                setProgramSearch(e.target.value);
                setSelectedProgramId('');
              }}
              required
              readOnly={!!level} // Don't allow changing program when editing
              className={level ? 'bg-muted' : ''}
            />
            {!level && filteredPrograms.length > 0 && (
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
        
        <div>
          <label htmlFor='level-number' className="block text-sm font-medium mb-1">Level</label>
            <Select onValueChange={setLevelNumber} value={levelNumber} required disabled={!selectedProgramId || isLoadingLevels}>
                <SelectTrigger id="level-number">
                    <SelectValue placeholder={isLoadingLevels ? "Loading..." : "Select a level"} />
                </SelectTrigger>
                <SelectContent>
                    {availableLevels.length > 0 ? (
                        availableLevels.map(lvl => (
                            <SelectItem key={lvl} value={lvl.toString()}>{lvl}00 Level</SelectItem>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">No available levels for this program.</div>
                    )}
                </SelectContent>
            </Select>
        </div>
        
        <div>
          <label htmlFor='student-count' className="block text-sm font-medium mb-1">Number of Students</label>
          <Input
            id="student-count"
            type="number"
            value={studentCount}
            onChange={(e) => setStudentCount(e.target.value)}
            required
            placeholder="e.g., 150"
            min="0"
          />
        </div>

        <div className="flex justify-between items-center pt-4">
            <div>
            {level && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" onClick={(e) => e.stopPropagation()}>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the level and all associated courses.
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
                <SubmitButton label={level ? 'Update' : 'Add'} disabled={!selectedProgramId} />
            </div>
        </div>
      </form>
    </>
  );
}

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? `${label}...` : label}
    </Button>
  );
}
