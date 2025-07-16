
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Program, Department } from '@/lib/types';
import { addProgram, updateProgram, deleteProgram } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';

interface ProgramFormProps {
  program: Program | null;
  departments: Department[];
  onClose: () => void;
}

export function ProgramForm({ program, departments, onClose }: ProgramFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [programName, setProgramName] = useState(program?.name || '');
  const [departmentSearch, setDepartmentSearch] = useState(program?.departmentName || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(program?.departmentId || '');
  const [maxLevel, setMaxLevel] = useState(program?.max_level.toString() || '4');

  useEffect(() => {
    if (program) {
      setProgramName(program.name);
      setSelectedDepartmentId(program.departmentId);
      setDepartmentSearch(program.departmentName || '');
      setMaxLevel(program.max_level.toString());
    } else {
      setProgramName('');
      setSelectedDepartmentId('');
      setDepartmentSearch('');
      setMaxLevel('4');
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

  const filteredDepartments = useMemo(() => {
    if (!departmentSearch) return [];
    // Don't show results if a department is already selected and the search term matches its name
    if (selectedDepartmentId && departments.find(d => d.id === selectedDepartmentId)?.name === departmentSearch) return [];

    return departments.filter(d => 
      d.name.toLowerCase().includes(departmentSearch.toLowerCase())
    );
  }, [departmentSearch, departments, selectedDepartmentId]);

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDepartmentId(dept.id);
    setDepartmentSearch(dept.name);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="name" value={programName} />
      <input type="hidden" name="departmentId" value={selectedDepartmentId} />
      <input type="hidden" name="max_level" value={maxLevel} />

      <div>
        <label htmlFor="department-search" className="block text-sm font-medium mb-1">
          Department
        </label>
        <Input
          id="department-search"
          placeholder="Search for a department"
          value={departmentSearch}
          onChange={(e) => {
            setDepartmentSearch(e.target.value);
            setSelectedDepartmentId(''); // Clear selection when user types
          }}
          required
          autoComplete="off"
        />
        {filteredDepartments.length > 0 && (
          <div className="border border-input rounded-md mt-1 max-h-40 overflow-y-auto z-50 bg-background">
            {filteredDepartments.map(dept => (
              <div
                key={dept.id}
                onClick={() => handleSelectDepartment(dept)}
                className="p-2 hover:bg-accent cursor-pointer text-sm"
              >
                {dept.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="program-name" className="block text-sm font-medium mb-1">
          Program Name
        </label>
        <Input
          id="program-name"
          type="text"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          required
          placeholder="e.g., Software Engineering"
        />
      </div>

       <div>
        <label htmlFor='max-level' className="block text-sm font-medium mb-1">Maximum Level</label>
        <Select onValueChange={setMaxLevel} value={maxLevel}>
            <SelectTrigger id="max-level">
                <SelectValue placeholder="Select max level" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="2">2 Years</SelectItem>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="4">4 Years</SelectItem>
                <SelectItem value="5">5 Years</SelectItem>
                <SelectItem value="6">6 Years</SelectItem>
                <SelectItem value="7">7 Years</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center pt-4">
        <div>
          {program && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" onClick={(e) => {e.stopPropagation(); setIsDeleteDialogOpen(true);}}>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the program and all its levels and courses.
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton label={program ? 'Update' : 'Add'} disabled={!selectedDepartmentId || !programName} />
        </div>
      </div>
    </form>
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

    