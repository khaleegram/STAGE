'use client';

import { useState, useEffect } from 'react';
import { GeneratorForm } from '@/components/timetable/generator-form';
import { TimetableDisplay } from '@/components/timetable/timetable-display';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, doc, where, orderBy, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Program, Level } from '@/lib/types';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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


function UnresolvedPromotionsCard() {
    const [emptyLevels, setEmptyLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'levels'),
            where('level', '==', 1),
            where('students_count', '==', 0)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                setEmptyLevels([]);
                setIsLoading(false);
                return;
            }
            const levelsWithProgramNames = await Promise.all(
                snapshot.docs.map(async (levelDoc) => {
                    const levelData = { id: levelDoc.id, ...levelDoc.data() } as Level;
                    if (levelData.programId) {
                        const programDoc = await getDoc(doc(db, 'programs', levelData.programId));
                        if (programDoc.exists()) {
                            levelData.programName = programDoc.data()?.name || 'Unknown Program';
                        }
                    }
                    return levelData;
                })
            );
            setEmptyLevels(levelsWithProgramNames);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Unresolved Promotions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (emptyLevels.length === 0) {
        return null;
    }

    return (
        <Card className="mt-6 border-amber-500 bg-amber-50/50">
            <CardHeader>
                <CardTitle className="text-amber-800">Pending Level 1 Population</CardTitle>
                <CardDescription className="text-amber-700">
                    The following programs require new student populations for Level 1 after promotion.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Program Name</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {emptyLevels.map((level) => (
                            <TableRow key={level.id}>
                                <TableCell className="font-medium">{level.programName}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/data-creation/levels">
                                            Set Population <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
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
      
      <UnresolvedPromotionsCard />
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
