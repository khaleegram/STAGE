
'use client';

import React, { useState, useRef } from 'react';
import { Department } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, Download, X } from 'lucide-react';
import Papa from 'papaparse';
import { importPrograms } from './actions';
import { Card } from '@/components/ui/card';

interface ImportProgramsModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
}

const CSV_TEMPLATE_HEADERS = "name,department_name,max_level\n";
const CSV_TEMPLATE_ROW1 = "B.Sc. Software Engineering,Computer Science,4\n";
const CSV_TEMPLATE_ROW2 = "B.A. History,History,4\n";

export function ImportProgramsModal({ isOpen, onClose, departments }: ImportProgramsModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setParsedData([]);
    setFileName('');
    setIsSubmitting(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Error parsing CSV: ${results.errors[0].message}`);
            setParsedData([]);
          } else {
            setParsedData(results.data);
          }
        },
      });
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_ROW1, CSV_TEMPLATE_ROW2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "programs_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError("No data to import. Please upload a valid CSV file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const plainDepartments = departments.map(d => ({ id: d.id, name: d.name, collegeId: d.collegeId }));
    const result = await importPrograms(parsedData, plainDepartments);
    
    toast({
      title: result.success ? 'Import Complete' : 'Import Failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
      duration: 10000,
    });

    if (result.success) {
      handleClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Programs from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with program details to bulk-add them to the system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Instructions & Upload */}
          <div className="space-y-4">
            <h4 className="font-semibold">Step 1: Prepare & Upload CSV</h4>
            <Card className="bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Your CSV must contain these headers: <code className="font-mono bg-background p-1 rounded-sm">name</code>, <code className="font-mono bg-background p-1 rounded-sm">department_name</code>, and <code className="font-mono bg-background p-1 rounded-sm">max_level</code>. The department name must match an existing department exactly.
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Download Template
              </Button>
            </Card>

            <div>
              <Input
                id="csv-file-programs"
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="mr-2 h-4 w-4" /> Upload CSV File
              </Button>
               {fileName && (
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground bg-background p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{fileName}</span>
                  </div>
                  <button onClick={resetState}><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-4">
            <h4 className="font-semibold">Step 2: Preview Data ({parsedData.length} rows)</h4>
            <div className="border rounded-md max-h-80 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Max Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.length > 0 ? (
                    parsedData.slice(0, 50).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.department_name}</TableCell>
                        <TableCell>{row.max_level}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        Upload a file to see a preview.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
             {parsedData.length > 50 && (
                <p className="text-xs text-center text-muted-foreground">Showing first 50 rows for preview.</p>
            )}
          </div>
        </div>

        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button 
            type="button" 
            onClick={handleImport} 
            disabled={isSubmitting || parsedData.length === 0}
          >
            {isSubmitting ? 'Importing...' : 'Start Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
