
'use client';

import { useState, useEffect } from 'react';
import { GeneratorForm } from '@/components/timetable/generator-form';
import { TimetableDisplay } from '@/components/timetable/timetable-display';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, doc, where, orderBy, getDoc, limit } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Program, Level, Timetable } from '@/lib/types';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Calendar, Eye, GraduationCap, Users, User, School, Clock, Library, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

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

function StatCard({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-1/2" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    )
}

function StatsOverview() {
    const [stats, setStats] = useState({ students: 0, programs: 0, courses: 0, venues: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const levelsQuery = query(collection(db, 'levels'));
                const programsQuery = query(collection(db, 'programs'));
                const coursesQuery = query(collection(db, 'courses'));
                const venuesQuery = query(collection(db, 'venues'));

                const [levelsSnap, programsSnap, coursesSnap, venuesSnap] = await Promise.all([
                    getDocs(levelsQuery),
                    getDocs(programsQuery),
                    getDocs(coursesQuery),
                    getDocs(venuesQuery),
                ]);

                const totalStudents = levelsSnap.docs.reduce((sum, doc) => sum + (doc.data().students_count || 0), 0);

                setStats({
                    students: totalStudents,
                    programs: programsSnap.size,
                    courses: coursesSnap.size,
                    venues: venuesSnap.size,
                });
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Students" value={stats.students} icon={Users} isLoading={isLoading} />
            <StatCard title="Programs" value={stats.programs} icon={GraduationCap} isLoading={isLoading} />
            <StatCard title="Courses" value={stats.courses} icon={BookOpen} isLoading={isLoading} />
            <StatCard title="Venues" value={stats.venues} icon={MapPin} isLoading={isLoading} />
        </div>
    );
}

function RecentTimetables() {
    const [timetables, setTimetables] = useState<Timetable[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'timetables'), orderBy('createdAt', 'desc'), limit(5));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Timetable));
            setTimetables(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Timetables</CardTitle>
                <CardDescription>A list of the most recently generated timetables.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Conflicts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timetables.length > 0 ? timetables.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.name}</TableCell>
                                    <TableCell>{t.createdAt ? format(t.createdAt.seconds * 1000, 'PPP') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        {t.conflicts ? (
                                            <span className="text-destructive font-bold">Yes</span>
                                        ) : (
                                            <span className="text-green-600">No</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">No timetables generated yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
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
      
      <StatsOverview />
      <UnresolvedPromotionsCard />
      <RecentTimetables />
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
