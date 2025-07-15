'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { College } from '@/lib/types';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

// Mock data based on your SQL dump
const mockColleges: College[] = [
  { id: '16', name: 'COLLEGE OF COMPUTER AND INFORMATION SCIENCE', code: 'CIS', short_name: 'CIS' },
  { id: '18', name: 'COLLEGE OF NATURAL AND APPLIED SCIENCES', code: 'NAS', short_name: 'NAS' },
  { id: '19', name: 'COLLEGE OF SOCIAL AND MANAGEMENT SCIENCES', code: 'SMS', short_name: 'SMS' },
  { id: '20', name: 'COLLEGE OF ALLIED HEALTH SCIENCE', code: 'AHS', short_name: 'AHS' },
  { id: '21', name: 'COLLEGE OF HUMANITIES', code: 'HUM', short_name: 'HUM' },
  { id: '22', name: 'COLLEGE OF EDUCATION', code: 'EDU', short_name: 'EDU' },
];


export default function CollegesPage() {
  // In a real app, you would fetch this data from Firebase
  const colleges = mockColleges;

  return (
    <div className="flex flex-col h-full">
      <Header title="Colleges" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Colleges</CardTitle>
              <CardDescription>Manage your university's colleges.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2" />
              Add College
            </Button>
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
                {colleges.map((college) => (
                  <TableRow key={college.id}>
                    <TableCell className="font-medium">{college.name}</TableCell>
                    <TableCell>{college.code}</TableCell>
                    <TableCell>{college.short_name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
