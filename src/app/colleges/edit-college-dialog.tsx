'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateCollege } from './actions';
import { College } from '@/lib/types';

const collegeSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters long.'),
  code: z.string().min(2, 'College code must be at least 2 characters long.').max(10, 'College code cannot exceed 10 characters.'),
  short_name: z.string().min(2, 'Short name must be at least 2 characters long.').max(10, 'Short name cannot exceed 10 characters.'),
});

type EditCollegeDialogProps = {
  college: College;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function EditCollegeDialog({ college, isOpen, onOpenChange }: EditCollegeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof collegeSchema>>({
    resolver: zodResolver(collegeSchema),
    defaultValues: {
      name: college.name,
      code: college.code,
      short_name: college.short_name,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: college.name,
        code: college.code,
        short_name: college.short_name,
      });
    }
  }, [isOpen, college, form]);


  const onSubmit = async (values: z.infer<typeof collegeSchema>) => {
    setIsSubmitting(true);
    const result = await updateCollege(college.id, values);
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit College</DialogTitle>
          <DialogDescription>Update the details for the college.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="short_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
