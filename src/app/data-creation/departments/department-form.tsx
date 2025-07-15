'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Department, College } from '@/lib/types';
import { addDepartment, updateDepartment, deleteDepartment } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog"

interface DepartmentFormProps {
  department: Department | null;
  colleges: College[];
  onClose: () => void;
}

function toTitleCase(str: string): string {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function DepartmentForm({ department, colleges, onClose }: DepartmentFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const prefix = "B.SC. ";
  const [appendedName, setAppendedName] = useState(
    department ? department.name.replace(prefix, '') : ''
  );
  const [selectedCollegeId, setSelectedCollegeId] = useState(department?.collegeId || '');
  
  useEffect(() => {
    if (department) {
      setAppendedName(department.name.replace(prefix, ''));
      setSelectedCollegeId(department.collegeId);
    } else {
      setAppendedName('');
      setSelectedCollegeId('');
    }
  }, [department]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.toUpperCase().startsWith(prefix)) {
        setAppendedName(toTitleCase(value.slice(prefix.length)));
    } else {
        setAppendedName(toTitleCase(value));
    }
  };

  const action = department ? updateDepartment.bind(null, department.id) : addDepartment;
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
    if (!department) return;
    const result = await deleteDepartment(department.id);
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


  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="name" value={prefix + appendedName} />
        <input type="hidden" name="collegeId" value={selectedCollegeId} />

        <div>
            <label htmlFor="collegeId" className="block text-sm font-medium mb-1">College</label>
            <Select onValueChange={setSelectedCollegeId} defaultValue={selectedCollegeId} required>
                <SelectTrigger id="collegeId">
                    <SelectValue placeholder="Select a college" />
                </SelectTrigger>
                <SelectContent>
                {colleges.map((college) => (
                    <SelectItem key={college.id} value={college.id}>
                    {college.name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
        
        <div>
          <label htmlFor='department-name' className="block text-sm font-medium mb-1">Department Name</label>
          <Input
            id="department-name"
            type="text"
            value={prefix + appendedName}
            onChange={handleNameChange}
            required
            placeholder="e.g., Computer Science"
          />
        </div>

        <div className="flex justify-between items-center pt-4">
            <div>
            {department && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the department.
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
                <SubmitButton label={department ? 'Update' : 'Add'} />
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
