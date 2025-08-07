
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { Program, Department } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramForm } from './program-form';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteSelectedPrograms } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash, Upload } from 'lucide-react';
import { ImportProgramsModal } from './import-programs-modal';

const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const deptsQuery = query(collection(db, 'departments'), orderBy('name'));
    const unsubscribeDepts = onSnapshot(deptsQuery, (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    }, (error) => {
      console.error("Error fetching departments: ", error);
      toast({ title: 'Error', description: 'Could not fetch departments.', variant: 'destructive' });
    });

    const programsQuery = query(collection(db, 'programs'), orderBy('name'));
    const unsubscribePrograms = onSnapshot(programsQuery, async (snapshot) => {
      const programsListPromises = snapshot.docs.map(async (p) => {
        const data = p.data();
        const program: Program = {
          id: p.id,
          name: data.name || 'Unnamed Program',
          departmentId: data.departmentId || 'N/A',
          max_level: data.max_level || 4,
          expected_intake: data.expected_intake || 0,
        };

        if (program.departmentId !== 'N/A') {
          try {
            const deptRef = doc(db, 'departments', program.departmentId);
            const deptSnap = await getDoc(deptRef);
            if (deptSnap.exists()) {
              program.departmentName = deptSnap.data().name || 'Unknown Department';
            }
          } catch (e) {
            program.departmentName = 'Unknown Department';
          }
        }
        return program;
      });
      
      const programsList = await Promise.all(programsListPromises);
      setPrograms(programsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching programs: ", error);
      toast({ title: 'Error', description: 'Could not fetch programs.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => {
      unsubscribeDepts();
      unsubscribePrograms();
    };
  }, [toast]);

  const handleAddNew = () => {
    setEditingProgram(null);
    setShowModal(true);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setShowModal(true);
  };

  const groupedPrograms = useMemo(() => programs.reduce((acc, prog) => {
      const deptName = prog.departmentName || 'Uncategorized';
      if (!acc[deptName]) acc[deptName] = [];
      acc[deptName].push(prog);
      return acc;
    }, {} as Record<string, Program[]>), [programs]);

  const filteredGroups = useMemo(() => Object.entries(groupedPrograms)
    .filter(([deptName]) => deptName.toLowerCase().includes(departmentSearch.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0])),
  [groupedPrograms, departmentSearch]);

  const allFilteredProgramIds = useMemo(() => filteredGroups.flatMap(([, progs]) => progs.map(p => p.id)), [filteredGroups]);
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? allFilteredProgramIds : []);
  };
  
  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await deleteSelectedPrograms(selectedIds);
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) setSelectedIds([]);
  };

  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Programs</h3>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Input
            type="text"
            placeholder="Search by department..."
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
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
                                This action will permanently delete {selectedIds.length} program(s) and all their associated levels.
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
            <Button onClick={handleAddNew} className="w-full">
              + Add Program
            </Button>
          </div>
        </div>
        
        {isLoading ? (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-24 w-full" />
            </div>
        ) : (
            <div className="space-y-8">
                {filteredGroups.length > 0 ? filteredGroups.map(([deptName, progArray]) => (
                    <div key={deptName}>
                        <div className="flex items-center justify-between mb-2">
                             <h2 className="text-xl font-semibold text-primary">{deptName}</h2>
                        </div>
                         <div className="overflow-x-auto rounded-lg">
                            <table className="min-w-full table-auto">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-4 w-12"><Checkbox onCheckedChange={(checked) => handleSelectAll(!!checked)} checked={allFilteredProgramIds.length > 0 && selectedIds.length === allFilteredProgramIds.length} /></th>
                                        <th className="p-4 w-16 text-left font-semibold">#</th>
                                        <th className="p-4 text-left font-semibold">Program Name</th>
                                        <th className="p-4 text-left font-semibold">Max Level</th>
                                        <th className="p-4 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {progArray.sort((a, b) => a.name.localeCompare(b.name)).map((prog, index) => (
                                        <tr key={prog.id} data-state={selectedIds.includes(prog.id) ? 'selected' : ''}>
                                            <td className="p-4"><Checkbox onCheckedChange={(checked) => handleRowSelect(prog.id, !!checked)} checked={selectedIds.includes(prog.id)} /></td>
                                            <td className="p-4">{index + 1}</td>
                                            <td className="p-4 font-medium">{prog.name}</td>
                                            <td className="p-4">{prog.max_level} Years</td>
                                            <td className="p-4 flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(prog)}>
                                                Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-8 text-muted-foreground bg-card/50 rounded-lg">
                        No programs found for your search criteria.
                    </div>
                )}
            </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Edit Program' : 'Add New Program'}</DialogTitle>
          </DialogHeader>
          <ProgramForm
            program={editingProgram}
            departments={departments}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>

      <ImportProgramsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        departments={departments}
       />
    </Card>
  );
};

export default ProgramsPage;
