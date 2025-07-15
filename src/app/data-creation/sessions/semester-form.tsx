'use client';

import React, { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Semester } from '@/lib/types';
import { addSemester, updateSemester } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';


interface SemesterFormProps {
  semester: Semester | null;
  sessionId: string;
  onClose: () => void;
}

export function SemesterForm({ semester, sessionId, onClose }: SemesterFormProps) {
  const { toast } = useToast();

  const [semesterNumber, setSemesterNumber] = useState(semester?.semester_number?.toString() || '1');
  const [status, setStatus] = useState<'open' | 'closed'>(semester?.status || 'open');
  const [startDate, setStartDate] = useState<Date | undefined>(
    semester?.start_date ? new Date(semester.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    semester?.end_date ? new Date(semester.end_date) : undefined
  );

  useEffect(() => {
    if (semester) {
        setSemesterNumber(semester.semester_number.toString());
        setStatus(semester.status);
        setStartDate(new Date(semester.start_date));
        setEndDate(semester.end_date ? new Date(semester.end_date) : undefined);
    }
  }, [semester]);
  
  const action = semester ? updateSemester.bind(null, semester.id, sessionId) : addSemester.bind(null, sessionId);
  const [state, formAction] = useFormState(action, { success: false, message: '' });

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

  return (
    <form action={formAction} className="space-y-4">
        <input type="hidden" name="semester_number" value={semesterNumber} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="start_date" value={startDate ? startDate.toISOString() : ''} />
        <input type="hidden" name="end_date" value={endDate ? endDate.toISOString() : ''} />

        <div>
            <Label>Semester</Label>
            <RadioGroup value={semesterNumber} onValueChange={setSemesterNumber} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="s1" />
                    <Label htmlFor="s1">First</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="s2" />
                    <Label htmlFor="s2">Second</Label>
                </div>
            </RadioGroup>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
             <div>
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        <div>
            <Label>Status</Label>
             <RadioGroup value={status} onValueChange={(v: 'open' | 'closed') => setStatus(v)} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="open" id="status-open" />
                    <Label htmlFor="status-open">Open</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="closed" id="status-closed" />
                    <Label htmlFor="status-closed">Closed</Label>
                </div>
            </RadioGroup>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <SubmitButton label={semester ? 'Update Semester' : 'Add Semester'} />
        </div>
    </form>
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
