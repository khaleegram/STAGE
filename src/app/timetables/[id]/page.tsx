'use client';

import React, { useState, useEffect } from 'react';
import { TimetableDisplay } from '@/components/timetable/timetable-display';
import { getTimetableById } from '../actions';
import { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type TimetablePageProps = {
  params: {
    id: string;
  };
};

export default function TimetablePage({ params }: TimetablePageProps) {
  const [timetableResult, setTimetableResult] = useState<GenerateExamTimetableOutput | null>(null);
  const [timetableName, setTimetableName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTimetable = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await getTimetableById(params.id);

      if (fetchError) {
        setError(fetchError);
        toast({ title: 'Error', description: fetchError, variant: 'destructive' });
      } else if (data) {
        setTimetableResult({
            scheduled_exams: data.scheduled_exams,
            unscheduled_exams: data.unscheduled_exams,
            conflicts: data.conflicts,
            summary_report: data.summary_report,
        });
        setTimetableName(data.name);
      }
      setIsLoading(false);
    };

    fetchTimetable();
  }, [params.id, toast]);
  
  // The onSave prop is not needed here as we are just viewing
  const handleSave = () => {
     toast({ title: 'Info', description: 'This timetable is already saved.' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{isLoading ? "Loading Timetable..." : timetableName}</h1>
            <p className="text-muted-foreground">Viewing saved timetable details.</p>
        </div>
        <Button asChild variant="outline">
            <Link href="/timetables">
                &larr; Back to Timetables
            </Link>
        </Button>
      </div>
      <TimetableDisplay result={timetableResult} isLoading={isLoading} error={error} onSave={handleSave} />
    </div>
  );
}
