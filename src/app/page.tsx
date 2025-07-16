'use client';

import { useState } from 'react';
import { GeneratorForm } from '@/components/timetable/generator-form';
import { TimetableDisplay } from '@/components/timetable/timetable-display';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { UnresolvedPromotions } from '@/components/dashboard/unresolved-promotions';

export default function Home() {
  const [result, setResult] = useState<GenerateExamTimetableOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneration = (
    newResult: GenerateExamTimetableOutput | null,
    newError?: string
  ) => {
    setResult(newResult);
    setError(newError || null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      <UnresolvedPromotions />

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
            result={result}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
