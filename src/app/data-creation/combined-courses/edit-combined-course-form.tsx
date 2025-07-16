'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CombinedCourse, Program, Level, CombinedCourseOffering } from '@/lib/types';
import { X } from 'lucide-react';
import { updateCombinedCourseOfferings } from './actions';

interface EditCombinedCourseFormProps {
  course: CombinedCourse;
  allPrograms: Program[];
  allLevels: Level[];
  onClose: () => void;
}

const offeringSchema = z.object({
  programId: z.string().min(1, 'Program is required.'),
  levelId: z.string().min(1, 'Level is required.'),
});

const formSchema = z.object({
  offerings: z.array(offeringSchema).min(1, 'At least one offering is required.'),
});

export function EditCombinedCourseForm({ course, allPrograms, allLevels, onClose }: EditCombinedCourseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      offerings: course.offerings.map(o => ({ programId: o.programId, levelId: o.levelId })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'offerings',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Filter out duplicates before submitting
    const uniqueOfferings = values.offerings.filter(
      (offering, index, self) =>
        index === self.findIndex(o => o.programId === offering.programId && o.levelId === offering.levelId)
    );

    if (uniqueOfferings.length !== values.offerings.length) {
        toast({
            title: 'Warning',
            description: 'Duplicate offerings were removed.',
            variant: 'default',
        });
    }

    const result = await updateCombinedCourseOfferings(course.id, uniqueOfferings);
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) {
      onClose();
    }
    setIsSubmitting(false);
  }

  const getLevelsForProgram = (programId: string) => {
    return allLevels.filter(l => l.programId === programId);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Course</label>
        <Input
          readOnly
          value={`${course.course_code} - ${course.course_name}`}
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground mt-1">
            Exam type: <span className="font-bold">{course.exam_type}</span>
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Offerings</h3>
        <div className="space-y-4">
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                <Controller
                  control={form.control}
                  name={`offerings.${index}.programId`}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>
                        {allPrograms.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={form.control}
                  name={`offerings.${index}.levelId`}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch(`offerings.${index}.programId`)}>
                      <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                      <SelectContent>
                        {getLevelsForProgram(form.watch(`offerings.${index}.programId`)).map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.level}00 Level</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
         <Button type="button" variant="outline" size="sm" onClick={() => append({ programId: '', levelId: '' })} className="mt-2">
            + Add Another Offering
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
