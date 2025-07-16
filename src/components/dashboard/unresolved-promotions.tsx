
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { Level } from '@/lib/types';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function UnresolvedPromotions() {
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
            try {
              const programDoc = await getDoc(doc(db, 'programs', levelData.programId));
              if (programDoc.exists()) {
                levelData.programName = programDoc.data()?.name || 'Unknown Program';
              }
            } catch (e) {
                console.error("Failed to fetch program name for level", levelData.id, e);
                levelData.programName = 'Error fetching program';
            }
          }
          return levelData;
        })
      );
      
      setEmptyLevels(levelsWithProgramNames);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching unresolved promotions:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Unresolved Promotions</CardTitle>
                <CardDescription>Checking for Level 1 groups that need new student populations...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  if (emptyLevels.length === 0) {
    return null; // Don't render anything if there are no issues
  }

  return (
    <Card className="border-amber-500 bg-amber-50/50">
      <CardHeader>
        <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <div>
                <CardTitle className="text-amber-800">Unresolved Promotions</CardTitle>
                <CardDescription className="text-amber-700">
                The following Level 1 groups are empty after promotion and require new student populations.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
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
                    <TableCell className="font-medium">{level.programName || 'Unknown Program'}</TableCell>
                    <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/data-creation/levels">
                        Populate Level <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
