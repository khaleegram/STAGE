'use client';

import { useState, useEffect } from 'react';
import { GeneratorForm } from '@/components/timetable/generator-form';
import { TimetableDisplay } from '@/components/timetable/timetable-display';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, doc, where } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Program } from '@/lib/types';


interface StudentPopulationData {
  name: string;
  '100L'?: number;
  '200L'?: number;
  '300L'?: number;
  '400L'?: number;
  '500L'?: number;
  '600L'?: number;
  '700L'?: number;
}


function StudentPopulationChart() {
    const [chartData, setChartData] = useState<StudentPopulationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const programsQuery = query(collection(db, 'programs'), orderBy('name'));
        const unsubscribe = onSnapshot(programsQuery, async (snapshot) => {
            const programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
            const data: StudentPopulationData[] = [];

            for (const program of programs) {
                const programData: StudentPopulationData = { name: program.name };
                const levelsQuery = query(collection(db, 'levels'), where('programId', '==', program.id));
                const levelsSnapshot = await getDocs(levelsQuery);
                levelsSnapshot.forEach(doc => {
                    const levelData = doc.data();
                    programData[`${levelData.level}00L` as keyof StudentPopulationData] = levelData.students_count;
                });
                data.push(programData);
            }
            setChartData(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <Skeleton className="h-[350px] w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Population Overview</CardTitle>
                <CardDescription>Number of students across different levels for each program.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="100L" stackId="a" fill="#8884d8" />
                        <Bar dataKey="200L" stackId="a" fill="#82ca9d" />
                        <Bar dataKey="300L" stackId="a" fill="#ffc658" />
                        <Bar dataKey="400L" stackId="a" fill="#ff8042" />
                        <Bar dataKey="500L" stackId="a" fill="#d0ed57" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}


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
      
      <StudentPopulationChart />

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

    