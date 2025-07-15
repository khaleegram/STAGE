'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { College } from '@/lib/types';
import { addCollege, updateCollege, deleteCollege } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface CollegeFormProps {
  college: College | null;
  onClose: () => void;
}

export function CollegeForm({ college, onClose }: CollegeFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const prefix = "COLLEGE OF ";
  const [appendedName, setAppendedName] = useState(
    college ? college.name.replace(prefix, '') : ''
  );
  const [collegeCode, setCollegeCode] = useState(college?.code || '');
  
  useEffect(() => {
    if (college) {
      setAppendedName(college.name.replace(prefix, ''));
      setCollegeCode(college.code);
    } else {
      setAppendedName('');
      setCollegeCode('');
    }
  }, [college]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (value.startsWith(prefix)) {
      setAppendedName(value.slice(prefix.length));
    } else {
      setAppendedName(value);
    }
  };

  const action = college ? updateCollege.bind(null, college.id) : addCollege;
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
    if (!college) return;
    const result = await deleteCollege(college.id);
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
        <input type="hidden" name="code" value={collegeCode} />
        
        <div>
          <label htmlFor='college-name' className="block text-sm font-medium mb-1">Full College Name</label>
          <Input
            id="college-name"
            type="text"
            value={prefix + appendedName}
            onChange={handleNameChange}
            required
            placeholder="Enter college name"
          />
        </div>

        <div>
          <label htmlFor='college-code' className="block text-sm font-medium mb-1">College Short Code</label>
          <Input
            id="college-code"
            type="text"
            value={collegeCode}
            onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
            required
            placeholder="e.g., NAS"
          />
        </div>

        <div className="flex justify-between items-center pt-4">
            <div>
            {college && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the college and all associated departments, programs, etc.
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
                <SubmitButton label={college ? 'Update' : 'Add'} />
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
