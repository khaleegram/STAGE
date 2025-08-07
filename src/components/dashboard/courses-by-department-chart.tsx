
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, doc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Program, Department, Course } from '@/lib/types';

interface DepartmentCourseData {
  name: string;
  courses: number;
}

export function CoursesByDepartmentChart() {
  const [chartData, setChartData] = useState<DepartmentCourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const departmentsQuery = query(collection(db, 'departments'));
        const coursesQuery = query(collection(db, 'courses'));

        const [departmentsSnap, coursesSnap] = await Promise.all([
          getDocs(departmentsQuery),
          getDocs(coursesQuery),
        ]);

        const departments = departmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        const courses = coursesSnap.docs.map(doc => doc.data() as Course);
        const programsSnap = await getDocs(query(collection(db, 'programs')));
        const programs = programsSnap.docs.map(doc => ({ id: doc.id, ...doc.data()} as Program));
        
        const departmentCourseCounts = new Map<string, number>();

        for (const course of courses) {
            const program = programs.find(p => p.id === course.programId);
            if (program) {
                const departmentId = program.departmentId;
                departmentCourseCounts.set(departmentId, (departmentCourseCounts.get(departmentId) || 0) + 1);
            }
        }
        
        const data: DepartmentCourseData[] = departments.map(dept => ({
            name: dept.name,
            courses: departmentCourseCounts.get(dept.id) || 0,
        }));
        
        setChartData(data);
      } catch (error) {
        console.error("Failed to fetch department course data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Courses by Department</CardTitle>
        <CardDescription>Distribution of all courses across university departments.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
              }}
            />
            <Bar dataKey="courses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
