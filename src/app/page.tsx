
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, doc, where, orderBy, limit } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Program, Level, Timetable } from '@/lib/types';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Calendar, Eye, GraduationCap, Users, User, School, Clock, Library, MapPin, Sparkles } from 'lucide-react';
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
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link href="/generation">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate New Timetable
          </Link>
        </Button>
      </div>
      
      <StatsOverview />
      <RecentTimetables />
      <StudentPopulationChart />
    </div>
  );
}
