
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, doc, where, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Timetable } from '@/lib/types';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Calendar, Eye, GraduationCap, Users, User, School, Clock, Library, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { UnresolvedPromotions } from '@/components/dashboard/unresolved-promotions';
import { StudentPopulationChart } from '@/components/dashboard/student-population-chart';
import { CoursesByDepartmentChart } from '@/components/dashboard/courses-by-department-chart';

function StatCard({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-1/2" />
                ) : (
                    <div className="text-2xl font-bold text-primary">{value}</div>
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
            <StatCard title="Total Students" value={stats.students.toLocaleString()} icon={Users} isLoading={isLoading} />
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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Timetables</CardTitle>
                    <CardDescription>The last 5 generated timetables.</CardDescription>
                </div>
                 <Button asChild variant="outline" size="sm">
                    <Link href="/timetables">View All</Link>
                </Button>
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
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead className="text-right">Conflicts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timetables.length > 0 ? timetables.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{t.createdAt ? format(t.createdAt.seconds * 1000, 'PPP') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        {t.conflicts ? (
                                            <span className="font-bold text-destructive">Yes</span>
                                        ) : (
                                            <span className="text-green-600">No</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No timetables generated yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function Home() {
  return (
     <section>
        <div className="space-y-6">
            <UnresolvedPromotions />
            <StatsOverview />
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                     <RecentTimetables />
                </div>
                 <div className="lg:col-span-3">
                    <StudentPopulationChart />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-1">
                <CoursesByDepartmentChart />
            </div>

            <div className="fixed bottom-6 right-6 z-50">
                <Button asChild size="lg" className="rounded-full shadow-lg">
                <Link href="/generation">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate New Timetable
                </Link>
                </Button>
            </div>
        </div>
    </section>
  );
}
