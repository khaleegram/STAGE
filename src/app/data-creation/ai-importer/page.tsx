
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, File as FileIcon, X, Wand2, Loader2, ArrowRight } from 'lucide-react';
import { analyzeAcademicData, AnalyzeAcademicDataOutput } from '@/ai/flows/analyze-academic-data';
import { EntityTree } from '@/components/data-importer/entity-tree';
import { saveAnalyzedData } from './actions';
import { revalidatePath } from 'next/cache';

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function AiImporterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<AnalyzeAcademicDataOutput | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Limit file size to 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
          toast({
              title: "File Too Large",
              description: "Please upload a file smaller than 10MB.",
              variant: "destructive"
          });
          return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please choose a file to process.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const documentDataUri = await toBase64(file);
      const aiResult = await analyzeAcademicData({ documentDataUri });
      setResult(aiResult);
      toast({ title: 'Analysis Complete', description: 'The AI has processed your document.' });
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast({
        title: 'An Error Occurred',
        description: error.message || 'Failed to process the document with AI.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const saveResult = await saveAnalyzedData(result.entities);
      toast({
        title: saveResult.success ? 'Success!' : 'Error',
        description: saveResult.message,
        variant: saveResult.success ? 'default' : 'destructive',
        duration: 9000
      });
      if (saveResult.success) {
        setResult(null);
        setFile(null);
      }
    } catch (error: any) {
       toast({
        title: 'An Unexpected Error Occurred',
        description: error.message || 'Failed to save the data.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Smart Importer</CardTitle>
          <CardDescription>
            Upload a single document (PDF, JPG, PNG) containing academic data. The AI will analyze it, identify entities, and infer their relationships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center bg-muted/20">
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            {!file ? (
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 flex flex-col items-center">
                <UploadCloud className="w-12 h-12 text-muted-foreground" />
                <span className="font-semibold">Click to upload or drag & drop</span>
                <span className="text-sm text-muted-foreground">PDF, PNG, or JPG (max 10MB)</span>
              </label>
            ) : (
              <div className="flex items-center justify-center gap-4 text-left">
                <FileIcon className="w-10 h-10 text-primary" />
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setResult(null); }}>
                  <X className="w-5 h-5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleProcessFile} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {result && (
        <Card>
            <CardHeader>
                <CardTitle>Analysis Result</CardTitle>
                <CardDescription>The AI has returned the following analysis. Review the data and proceed to save it to the database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">AI Summary</h3>
                    <p className="text-sm bg-muted p-4 rounded-md">{result.summary}</p>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Detected Hierarchy ({result.entities.length} entities)</h3>
                    <div className="border rounded-md p-4 max-h-[60vh] overflow-y-auto">
                      <EntityTree entities={result.entities} />
                    </div>
                </div>

                 <div className="flex justify-end border-t pt-4">
                    <Button onClick={handleSaveData} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving to Database...
                            </>
                        ) : (
                            <>
                                Save to Database <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
