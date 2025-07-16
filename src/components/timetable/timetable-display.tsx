'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Download, Printer, FileWarning, CalendarCheck2, ListX, Save } from 'lucide-react';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import { Badge } from '../ui/badge';


type TimetableDisplayProps = {
  result: GenerateExamTimetableOutput | null;
  isLoading: boolean;
  error: string | null;
  onSave: () => void;
};


export function TimetableDisplay({ result, isLoading, error, onSave }: TimetableDisplayProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!result?.scheduled_exams) return;
    const headers = ['Date', 'Time', 'Course Code', 'Venues', 'Invigilators'];
    const csvContent = [
      headers.join(','),
      ...result.scheduled_exams.map(row => 
          `"${row.date}","${row.time}","${row.course_code}","${row.venue_codes.join('; ')}","${row.invigilators.join('; ')}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-s-8,' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'exam_timetable.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full p-8">
          <FileWarning className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold">Generation Failed</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full p-8">
          <CalendarCheck2 className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Ready to Generate</h3>
          <p className="text-muted-foreground mt-2">Your generated timetable will appear here.</p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Scheduling Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-md">{result.summary_report}</pre>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListX className="text-destructive"/>Unscheduled Exams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {result.unscheduled_exams?.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {result.unscheduled_exams.map(exam => (
                                    <li key={exam.course_code}>
                                        <span className="font-semibold">{exam.course_code}:</span> {exam.reason}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">All courses were scheduled successfully!</p>}
                    </CardContent>
                </Card>
            </div>

            {result.conflicts && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Scheduling Conflicts Permitted!</AlertTitle>
                <AlertDescription>
                  <pre className="whitespace-pre-wrap font-mono text-sm">{result.conflicts}</pre>
                </AlertDescription>
              </Alert>
            )}
            
            {result.scheduled_exams?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Venues</TableHead>
                    <TableHead>Invigilators</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.scheduled_exams.map((entry, index) => (
                    <TableRow key={`${entry.course_code}-${index}`}>
                      <TableCell className="font-medium">{entry.date}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell>{entry.course_code}</TableCell>
                      <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.venue_codes.map(v => <Badge key={v} variant="secondary">{v}</Badge>)}
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex flex-wrap gap-1">
                              {entry.invigilators.map(i => <Badge key={i} variant="outline">{i}</Badge>)}
                          </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                 <p>No exams were scheduled based on the provided data and constraints.</p>
              </div>
            )}
        </div>
      </>
    );
  };
  
  return (
    <Card className="min-h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>AI Generation Result</CardTitle>
        <CardDescription>
          Review the generated schedule. Use actions to export or print.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {renderContent()}
      </CardContent>
      {result && !error && (
        <CardFooter className="border-t pt-6 justify-end gap-2">
          <Button variant="outline" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExport} disabled={!result.scheduled_exams || result.scheduled_exams.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
