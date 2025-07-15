'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { College } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';
import { AddCollegeDialog } from './add-college-dialog';
import { CollegeActions } from './college-actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const collegesQuery = query(collection(db, 'colleges'), orderBy('name'));
    
    const unsubscribe = onSnapshot(collegesQuery, (snapshot) => {
      const collegesList = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed College',
        code: doc.data().code || 'N/A',
        short_name: doc.data().short_name || 'N/A',
      }));
      setColleges(collegesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching colleges in real-time: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Colleges</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Add College
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Manage Colleges</CardTitle>
            <CardDescription>View, add, edit, or delete your university's colleges.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Short Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : colleges.length > 0 ? (
                colleges.map((college) => (
                  <TableRow key={college.id}>
                    <TableCell className="font-medium">{college.name}</TableCell>
                    <TableCell>{college.code}</TableCell>
                    <TableCell>{college.short_name}</TableCell>
                    <TableCell className="text-right">
                      <CollegeActions college={college} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No colleges found. Get started by adding a new one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddCollegeDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
