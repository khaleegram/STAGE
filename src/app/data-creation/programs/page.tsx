
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

const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Departments
    const deptsQuery = query(collection(db, 'departments'), orderBy('name'));
    const unsubscribeDepts = onSnapshot(deptsQuery, (snapshot) => {
      const deptsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Department));
      setDepartments(deptsList);
    }, (error) => {
      console.error("Error fetching departments: ", error);
      toast({ title: 'Error', description: 'Could not fetch departments.', variant: 'destructive' });
    });

    // Fetch Programs and denormalize department name
    const programsQuery = query(collection(db, 'programs'), orderBy('name'));
    const unsubscribePrograms = onSnapshot(programsQuery, async (snapshot) => {
      const programsListPromises = snapshot.docs.map(async (p) => {
        const data = p.data();
        const program: Program = {
          id: p.id,
          name: data.name || 'Unnamed Program',
          departmentId: data.departmentId || 'N/A',
          max_level: data.max_level || 4, // Default value
          expected_intake: data.expected_intake || 0, // Default value
        };

        if (program.departmentId !== 'N/A') {
          try {
            const deptRef = doc(db, 'departments', program.departmentId);
            const deptSnap = await getDoc(deptRef);
            if (deptSnap.exists()) {
              program.departmentName = deptSnap.data().name || 'Unknown Department';
            }
          } catch (e) {
            console.error(`Failed to fetch department ${program.departmentId}`, e);
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

  const groupedPrograms = useMemo(() => {
    return programs.reduce((acc, prog) => {
      const deptName = prog.departmentName || 'Uncategorized';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push(prog);
      return acc;
    }, {} as Record<string, Program[]>);
  }, [programs]);

  const filteredGroups = Object.entries(groupedPrograms).filter(([deptName]) =>
    deptName.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  return (
    <section className="p-4 sm:p-6 lg:p-8 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Manage Programs</h1>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input
            type="text"
            placeholder="Search by department..."
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Button
            onClick={handleAddNew}
            className="w-full sm:w-auto"
          >
            + Add Program
          </Button>
        </div>
        
        {isLoading ? (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-24 w-full" />
            </div>
        ) : (
            <div className="space-y-8">
                {filteredGroups.length > 0 ? filteredGroups.map(([deptName, progArray]) => (
                    <div key={deptName}>
                        <h2 className="text-xl font-semibold mb-2 text-primary">{deptName}</h2>
                         <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full table-auto">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-4 text-left font-semibold">#</th>
                                        <th className="p-4 text-left font-semibold">Program Name</th>
                                        <th className="p-4 text-left font-semibold">Max Level</th>
                                        <th className="p-4 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {progArray.sort((a, b) => a.name.localeCompare(b.name)).map((prog, index) => (
                                        <tr key={prog.id}>
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
                    <div className="text-center p-8 text-muted-foreground bg-card rounded-lg border">
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
    </section>
  );
};

export default ProgramsPage;
