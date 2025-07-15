
'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Level, Program } from '@/lib/types';
import { addLevel, updateLevel, deleteLevel } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelFormProps {
  level: Level | null;
  programs: Program[];
  onClose: () => void;
}

export function LevelForm({ level, programs, onClose }: LevelFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [selectedProgramId, setSelectedProgramId] = useState(level?.programId || '');
  const [levelNumber, setLevelNumber] = useState(level?.level.toString() || '');
  const [studentCount, setStudentCount] = useState(level?.students_count.toString() || '0');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (level) {
      setSelectedProgramId(level.programId);
      setLevelNumber(level.level.toString());
      setStudentCount(level.students_count.toString());
    } else {
      setSelectedProgramId('');
      setLevelNumber('');
      setStudentCount('0');
    }
  }, [level]);

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

  const selectedProgramName = programs.find(p => p.id === selectedProgramId)?.name || 'Select a program';

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="programId" value={selectedProgramId} />
        <input type="hidden" name="level" value={levelNumber} />
        <input type="hidden" name="students_count" value={studentCount} />

        <div>
            <label className="block text-sm font-medium mb-1">Program</label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isPopoverOpen} className="w-full justify-between">
                        <span className="truncate">{selectedProgramName}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search programs..." />
                        <CommandList>
                            <CommandEmpty>No program found.</CommandEmpty>
                            <CommandGroup>
                                {programs.map((program) => (
                                <CommandItem
                                    key={program.id}
                                    value={program.name}
                                    onSelect={() => {
                                        setSelectedProgramId(program.id);
                                        setIsPopoverOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedProgramId === program.id ? "opacity-100" : "opacity-0")} />
                                    {program.name}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
        
        <div>
          <label htmlFor='level-number' className="block text-sm font-medium mb-1">Level</label>
            <Select onValueChange={setLevelNumber} defaultValue={levelNumber} required>
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
                                This action cannot be undone. This will permanently delete the level.
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
                <SubmitButton label={level ? 'Update' : 'Add'} />
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
