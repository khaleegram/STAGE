
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, doc, where, orderBy, limit } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Program, Level, Timetable } from '@/lib/types';


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

export function StudentPopulationChart() {
    const [chartData, setChartData] = useState<StudentPopulationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const programsQuery = query(collection(db, 'programs'), orderBy('name'));
        const unsubscribe = onSnapshot(programsQuery, async (snapshot) => {
            const programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
            const data: StudentPopulationData[] = [];

            for (const program of programs) {
                const programData: StudentPopulationData = { name: program.name.replace(' Of ', ' of ').replace(' And ', ' and ') };
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
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Population</CardTitle>
                <CardDescription>Student counts across all levels for each program.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip 
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                            }} 
                        />
                        <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="100L" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="200L" stackId="a" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="300L" stackId="a" fill="hsl(var(--chart-3))" />
                        <Bar dataKey="400L" stackId="a" fill="hsl(var(--chart-4))" />
                        <Bar dataKey="500L" stackId="a" fill="hsl(var(--chart-5))" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
