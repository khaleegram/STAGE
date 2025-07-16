'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Program, Department } from '@/lib/types';
import { addProgram, updateProgram, deleteProgram } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';


interface ProgramFormProps {
  program: Program | null;
  departments: Department[];
  onClose: () => void;
}

export function ProgramForm({ program, departments, onClose }: ProgramFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [programName, setProgramName] = useState(program?.name || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(program?.departmentId || '');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (program) {
        setProgramName(program.name);
        setSelectedDepartmentId(program.departmentId);
    } else {
        setProgramName('');
        setSelectedDepartmentId('');
    }
  }, [program]);

  const action = program ? updateProgram.bind(null, program.id) : addProgram;
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
    if (!program) return;
    const result = await deleteProgram(program.id);
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

  const selectedDepartmentName = useMemo(() => {
    return departments.find(d => d.id === selectedDepartmentId)?.name || 'Select a department';
  }, [selectedDepartmentId, departments]);

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="name" value={programName} />
        <input type="hidden" name="departmentId" value={selectedDepartmentId} />

        <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isPopoverOpen} className="w-full justify-between">
                        <span className="truncate">{selectedDepartmentName}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search departments..." />
                        <CommandList>
                            <CommandEmpty>No department found.</CommandEmpty>
                            <CommandGroup>
                                {departments.map((department) => (
                                <CommandItem
                                    key={department.id}
                                    value={department.name}
                                    onSelect={() => {
                                        setSelectedDepartmentId(department.id);
                                        setIsPopoverOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedDepartmentId === department.id ? "opacity-100" : "opacity-0")} />
                                    {department.name}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
        
        <div>
          <label htmlFor='program-name' className="block text-sm font-medium mb-1">Program Name</label>
          <Input
            id="program-name"
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            required
            placeholder="e.g., Software Engineering"
          />
        </div>

        <div className="flex justify-between items-center pt-4">
            <div>
            {program && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" onClick={(e) => e.stopPropagation()}>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the program.
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
                <SubmitButton label={program ? 'Update' : 'Add'} />
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
