'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Timetable } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PlusCircle, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


export default function TimetablesPage() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'timetables'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Timetable));
      setTimetables(data);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching timetables: ", error);
        toast({
            title: 'Error',
            description: 'Could not fetch timetables. Please try again later.',
            variant: 'destructive',
        });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Saved Timetables</h1>
         <Link href="/generation" passHref>
          <Button>
            <Sparkles className="mr-2" />
            Generate New Timetable
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Generated Timetables</CardTitle>
          <CardDescription>Manage and view previously generated timetables.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
           ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Creation Date</TableHead>
                    <TableHead>Conflicts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {timetables.length > 0 ? timetables.map((timetable) => (
                    <TableRow key={timetable.id}>
                    <TableCell className="font-medium">{timetable.name}</TableCell>
                    <TableCell>
                        {timetable.createdAt ? format(new Date(timetable.createdAt.seconds * 1000), 'PPP p') : 'N/A'}
                    </TableCell>
                    <TableCell>
                        {timetable.conflicts ? (
                        <span className="text-destructive font-medium">Yes</span>
                        ) : (
                        <span>No</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        {/* This could link to a detailed view page in the future */}
                        <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                        </Button>
                    </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                            No timetables have been saved yet.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
