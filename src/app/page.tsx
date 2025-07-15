'use client';

import { useState } from 'react';
import { GeneratorForm } from '@/components/timetable/generator-form';
import { TimetableDisplay } from '@/components/timetable/timetable-display';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';

export default function Home() {
  const [timetableResult, setTimetableResult] = useState<GenerateExamTimetableOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneration = (result: GenerateExamTimetableOutput | null, error?: string) => {
    if (error) {
      setError(error);
      setTimetableResult(null);
    } else {
      setTimetableResult(result);
      setError(null);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <GeneratorForm
              onGeneration={handleGeneration}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <TimetableDisplay
              result={timetableResult}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
    </div>
  );
}
