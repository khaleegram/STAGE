
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { College, Department } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, Download, X, Wand2, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import { importStaff } from './actions';
import { mapCsvHeaders } from '@/ai/flows/map-csv-headers';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface ImportStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  colleges: College[];
  departments: Department[];
}

type Mapping = {
  userHeader: string;
  mappedTo: string | null;
  confidence: number;
};

const TARGET_FIELDS = ['name', 'email', 'phone', 'position', 'college_name', 'department_name'];

export function ImportStaffModal({ isOpen, onClose, colleges, departments }: ImportStaffModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setIsProcessing(false);
    setIsSubmitting(false);
    setError(null);
    setMappings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setError(null);
      setFile(selectedFile);
      setStep(2);
      setIsProcessing(true);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        preview: 1, // Only parse the header row first
        complete: async (results) => {
          const foundHeaders = results.meta.fields || [];
          setHeaders(foundHeaders);
          try {
            const aiResponse = await mapCsvHeaders({ headers: foundHeaders });
            setMappings(aiResponse.mappings);
          } catch (aiError) {
            setError("AI mapping failed. Please map headers manually.");
            setMappings(foundHeaders.map(h => ({ userHeader: h, mappedTo: null, confidence: 0 })));
          } finally {
            setIsProcessing(false);
          }
        },
      });
    }
  };

  const handleMappingChange = (userHeader: string, newMappedTo: string) => {
    setMappings(currentMappings =>
      currentMappings.map(m =>
        m.userHeader === userHeader ? { ...m, mappedTo: newMappedTo } : m
      )
    );
  };
  
  const proceedToPreview = () => {
      // Check if all target fields are mapped
      const mappedTargets = new Set(mappings.map(m => m.mappedTo).filter(Boolean));
      if (mappedTargets.size < TARGET_FIELDS.length) {
          setError("All target fields must be mapped. Please review your selections.");
          return;
      }
      setError(null);
      setIsProcessing(true);
      if (file) {
          Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                  setParsedData(results.data);
                  setIsProcessing(false);
                  setStep(3);
              }
          })
      }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError("No data to import.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    const plainColleges = colleges.map(c => ({ id: c.id, name: c.name }));
    const plainDepartments = departments.map(d => ({ id: d.id, name: d.name, collegeId: d.collegeId }));

    const finalMapping = mappings.reduce((acc, m) => {
        if(m.mappedTo) {
            acc[m.mappedTo] = m.userHeader;
        }
        return acc;
    }, {} as Record<string, string>);

    const result = await importStaff(plainColleges, plainDepartments, parsedData, finalMapping);
    
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

  const currentProgress = useMemo(() => {
    if (step === 1) return 25;
    if (step === 2) return 50;
    if (step === 3) return 75;
    return 100;
  }, [step]);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Smart Staff Import</DialogTitle>
          <DialogDescription>A multi-step process to intelligently import your staff data.</DialogDescription>
        </DialogHeader>

        <Progress value={currentProgress} className="w-full my-4" />

        {step === 1 && (
            <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-medium mb-2">Upload Your CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">The AI will attempt to automatically map your columns.</p>
                <Input id="csv-file-staff" type="file" ref={fileInputRef} accept=".csv" onChange={handleFileChange} className="hidden"/>
                <Button type="button" onClick={() => fileInputRef.current?.click()} size="lg">
                    <Upload className="mr-2 h-5 w-5" /> Choose File
                </Button>
            </div>
        )}

        {step === 2 && (
            <div>
                <h3 className="text-lg font-semibold mb-2">Step 2: Map Columns</h3>
                <p className="text-sm text-muted-foreground mb-4">Review the AI's suggestions and correct any mismatched columns.</p>
                {isProcessing ? <p>AI is processing your headers...</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
                      {mappings.map(m => (
                          <div key={m.userHeader} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                              <div className="flex-1 font-medium">{m.userHeader}</div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                  <Select onValueChange={(value) => handleMappingChange(m.userHeader, value)} defaultValue={m.mappedTo || ''}>
                                      <SelectTrigger className="bg-background">
                                          <SelectValue placeholder="Select target field..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="ignore">-- Ignore this column --</SelectItem>
                                          {TARGET_FIELDS.map(field => (
                                              <SelectItem key={field} value={field} disabled={mappings.some(otherMap => otherMap.mappedTo === field)}>
                                                  {field.replace(/_/g, ' ')}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground mt-1">AI Confidence: {(m.confidence * 100).toFixed(0)}%</p>
                              </div>
                          </div>
                      ))}
                  </div>
                )}
            </div>
        )}

         {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Step 3: Preview Data ({parsedData.length} rows)</h4>
            <div className="border rounded-md max-h-80 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                     {mappings.filter(m => m.mappedTo !== 'ignore').map(m => (
                        <TableHead key={m.userHeader}>{m.userHeader}</TableHead>
                     ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.length > 0 ? (
                    parsedData.slice(0, 50).map((row, index) => (
                      <TableRow key={index}>
                        {mappings.filter(m => m.mappedTo !== 'ignore').map(m => (
                            <TableCell key={m.userHeader}>{row[m.userHeader]}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="h-24 text-center">
                        No data to preview.
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
        )}
        
        {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <DialogFooter className="pt-4 mt-4">
          {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          {step === 2 && (
              <Button type="button" onClick={proceedToPreview} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Next: Preview Data'}
              </Button>
          )}
          {step === 3 && (
            <Button 
              type="button" 
              onClick={handleImport} 
              disabled={isSubmitting || parsedData.length === 0}
            >
              {isSubmitting ? 'Importing...' : 'Confirm and Start Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
