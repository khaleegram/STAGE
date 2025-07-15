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
import { AlertTriangle, Download, Printer, FileWarning, CalendarCheck2 } from 'lucide-react';
import type { GenerateExamTimetableOutput } from '@/ai/flows/generate-exam-timetable';
import type { TimetableEntry } from '@/lib/types';

type TimetableDisplayProps = {
  result: GenerateExamTimetableOutput | null;
  isLoading: boolean;
  error: string | null;
};

function parseTimetable(timetableString: string): TimetableEntry[] {
  try {
    const lines = timetableString.split('\n').filter(line => line.trim() !== '' && !line.startsWith('--'));
    const entries: TimetableEntry[] = [];
    
    const headerKeywords = ['date', 'time', 'subject', 'room'];
    const potentialHeaderIndex = lines.findIndex(line => headerKeywords.every(kw => line.toLowerCase().includes(kw)));
    if (potentialHeaderIndex !== -1) {
      lines.splice(potentialHeaderIndex, 1);
    }
    
    lines.forEach((line, index) => {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        entries.push({
          id: `entry-${index}`,
          date: parts[0],
          time: parts[1],
          subject: parts[2],
          room: parts[3],
        });
      }
    });
    return entries;
  } catch (e) {
    console.error("Failed to parse timetable string:", e);
    return [];
  }
}

export function TimetableDisplay({ result, isLoading, error }: TimetableDisplayProps) {
  const parsedTimetable = useMemo(() => {
    if (result?.timetable) {
      return parseTimetable(result.timetable);
    }
    return [];
  }, [result]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (parsedTimetable.length === 0) return;
    const headers = ['Date', 'Time', 'Subject', 'Room'];
    const csvContent = [
      headers.join(','),
      ...parsedTimetable.map(row => `"${row.date}","${row.time}","${row.subject}","${row.room}"`)
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
        <div className="space-y-4">
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
        {result.conflicts && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Scheduling Conflicts Detected!</AlertTitle>
            <AlertDescription>
              <pre className="whitespace-pre-wrap font-mono text-sm">{result.conflicts}</pre>
            </AlertDescription>
          </Alert>
        )}
        
        {parsedTimetable.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedTimetable.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.date}</TableCell>
                  <TableCell>{entry.time}</TableCell>
                  <TableCell>{entry.subject}</TableCell>
                  <TableCell>{entry.room}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div>
            <h4 className="font-semibold mb-2">Raw Timetable Output</h4>
            <pre className="bg-muted p-4 rounded-md whitespace-pre-wrap font-mono text-sm">{result.timetable}</pre>
          </div>
        )}
      </>
    );
  };
  
  return (
    <Card className="min-h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle>Generated Timetable</CardTitle>
        <CardDescription>
          Review the generated schedule. Use actions to export or print.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {renderContent()}
      </CardContent>
      {result && !error && (
        <CardFooter className="border-t pt-6 justify-end gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExport} disabled={parsedTimetable.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
