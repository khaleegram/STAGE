
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { College } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CollegeForm } from './college-form';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteSelectedColleges } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash, Upload } from 'lucide-react';
import { ImportCollegesModal } from './import-colleges-modal';


const CollegesPage: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const collegesQuery = query(collection(db, 'colleges'), orderBy('name'));
    const unsubscribe = onSnapshot(collegesQuery, (snapshot) => {
      const collegesList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'N/A',
        short_name: doc.data().code || 'N/A',
        code: doc.data().code || 'N/A'
      }));
      setColleges(collegesList as College[]);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching colleges: ", error);
      toast({ title: 'Error', description: 'Could not fetch colleges.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleAddNew = () => {
    setEditingCollege(null);
    setShowModal(true);
  };
  
  const handleEdit = (college: College) => {
    setEditingCollege(college);
    setShowModal(true);
  };

  const filteredColleges = useMemo(() => colleges.filter((college) =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.code.toLowerCase().includes(searchTerm.toLowerCase())
  ), [colleges, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredColleges.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await deleteSelectedColleges(selectedIds);
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) {
      setSelectedIds([]);
    }
  };

  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Colleges</h3>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Input
            type="text"
            placeholder="Search colleges by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.length})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {selectedIds.length} college(s) and potentially all their associated data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
             <Button onClick={() => setShowImportModal(true)} variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
             </Button>
            <Button
              onClick={handleAddNew}
              className="w-full"
            >
              + Add College
            </Button>
          </div>
        </div>
        
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden sm:block rounded-lg">
                  <table className="min-w-full table-auto">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-4 w-12 text-left">
                           <Checkbox
                                onCheckedChange={handleSelectAll}
                                checked={selectedIds.length > 0 && selectedIds.length === filteredColleges.length}
                                aria-label="Select all rows"
                            />
                        </th>
                        <th className="p-4 w-16 text-left font-semibold">#</th>
                        <th className="p-4 text-left font-semibold">College Code</th>
                        <th className="p-4 text-left font-semibold">Full College Name</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredColleges.map((college, index) => (
                        <tr key={college.id} className="hover:bg-muted/30" data-state={selectedIds.includes(college.id) ? 'selected' : ''}>
                          <td className="p-4">
                               <Checkbox
                                    onCheckedChange={(checked) => handleRowSelect(college.id, !!checked)}
                                    checked={selectedIds.includes(college.id)}
                                    aria-label={`Select row for ${college.name}`}
                                />
                          </td>
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4">{college.code}</td>
                          <td className="p-4">{college.name}</td>
                          <td className="p-4 flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(college)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredColleges.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center p-4 text-muted-foreground">
                            No colleges found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 block sm:hidden">
                  {filteredColleges.map((college, index) => (
                    <Card key={college.id} className="p-4" data-state={selectedIds.includes(college.id) ? 'selected' : ''}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                             <Checkbox
                                className="mt-1"
                                onCheckedChange={(checked) => handleRowSelect(college.id, !!checked)}
                                checked={selectedIds.includes(college.id)}
                                aria-label={`Select card for ${college.name}`}
                            />
                            <div>
                                <h4 className="font-bold text-primary">#{index + 1}</h4>
                                <p><strong>Code:</strong> {college.code}</p>
                                <p><strong>Full Name:</strong> {college.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(college)}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {filteredColleges.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No colleges found
                    </div>
                  )}
                </div>
            </>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCollege ? 'Edit College' : 'Add New College'}</DialogTitle>
          </DialogHeader>
          <CollegeForm
            college={editingCollege}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>

      <ImportCollegesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </Card>
  );
};

export default CollegesPage;
