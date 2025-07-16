
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
    // Don't show results if a program is already selected
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
                setSelectedProgramId(''); // Clear selection when user types
              }}
              required
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
        
        <div>
          <label htmlFor='level-number' className="block text-sm font-medium mb-1">Level</label>
            <Select onValueChange={setLevelNumber} value={levelNumber} required>
                <SelectTrigger id="level-number">
                    <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">100 Level</SelectItem>
                    <SelectItem value="2">200 Level</SelectItem>
                    <SelectItem value="3">300 Level</SelectItem>
                    <SelectItem value="4">400 Level</SelectItem>
                    <SelectItem value="5">500 Level</SelectItem>
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
