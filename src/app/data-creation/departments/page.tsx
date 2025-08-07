
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { Department, College } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DepartmentForm } from './department-form';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteSelectedDepartments } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash } from 'lucide-react';

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const collegesQuery = query(collection(db, 'colleges'), orderBy('name'));
    const unsubscribeColleges = onSnapshot(collegesQuery, (snapshot) => {
      const collegesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as College));
      setColleges(collegesList);
    }, (error) => {
      console.error("Error fetching colleges: ", error);
      toast({ title: 'Error', description: 'Could not fetch colleges.', variant: 'destructive' });
    });

    const departmentsQuery = query(collection(db, 'departments'), orderBy('name'));
    const unsubscribeDepartments = onSnapshot(departmentsQuery, async (snapshot) => {
      const departmentsListPromises = snapshot.docs.map(async (d) => {
        const data = d.data();
        const department: Department = {
          id: d.id,
          name: data.name || 'Unnamed Department',
          collegeId: data.collegeId || 'N/A',
        };

        if (department.collegeId !== 'N/A') {
          try {
            const collegeRef = doc(db, 'colleges', department.collegeId);
            const collegeSnap = await getDoc(collegeRef);
            if (collegeSnap.exists()) {
              department.collegeName = collegeSnap.data().name || 'Unknown College';
            }
          } catch (e) {
            console.error(`Failed to fetch college ${department.collegeId}`, e);
            department.collegeName = 'Unknown College';
          }
        }
        return department;
      });
      
      const departmentsList = await Promise.all(departmentsListPromises);
      setDepartments(departmentsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching departments: ", error);
      toast({ title: 'Error', description: 'Could not fetch departments.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => {
      unsubscribeColleges();
      unsubscribeDepartments();
    };
  }, [toast]);

  const handleAddNew = () => {
    setEditingDepartment(null);
    setShowModal(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowModal(true);
  };

  const filteredDepartments = useMemo(() => departments.filter((department) =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.collegeName?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [departments, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredDepartments.map(d => d.id) : []);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };
  
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await deleteSelectedDepartments(selectedIds);
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
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Departments</h3>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Input
            type="text"
            placeholder="Search departments or colleges..."
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
                                This action will permanently delete {selectedIds.length} department(s).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button
              onClick={handleAddNew}
              className="w-full"
            >
              + Add Department
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
                        <th className="p-4 w-12"><Checkbox onCheckedChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredDepartments.length} /></th>
                        <th className="p-4 w-16 text-left font-semibold">#</th>
                        <th className="p-4 text-left font-semibold">Department Name</th>
                        <th className="p-4 text-left font-semibold">College</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredDepartments.map((dept, index) => (
                        <tr key={dept.id} data-state={selectedIds.includes(dept.id) ? 'selected' : ''}>
                          <td className="p-4"><Checkbox onCheckedChange={(checked) => handleRowSelect(dept.id, !!checked)} checked={selectedIds.includes(dept.id)} /></td>
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4">{dept.name}</td>
                          <td className="p-4">{dept.collegeName || 'N/A'}</td>
                          <td className="p-4 flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredDepartments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center p-4 text-muted-foreground">
                            No departments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 block sm:hidden">
                  {filteredDepartments.map((dept, index) => (
                    <Card key={dept.id} className="p-4" data-state={selectedIds.includes(dept.id) ? 'selected' : ''}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <Checkbox className="mt-1" onCheckedChange={(checked) => handleRowSelect(dept.id, !!checked)} checked={selectedIds.includes(dept.id)} />
                            <div>
                                <h4 className="font-bold text-primary">#{index + 1}</h4>
                                <p><strong>Department:</strong> {dept.name}</p>
                                <p><strong>College:</strong> {dept.collegeName || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {filteredDepartments.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No departments found
                    </div>
                  )}
                </div>
            </>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add New Department'}</DialogTitle>
          </DialogHeader>
          <DepartmentForm
            department={editingDepartment}
            colleges={colleges}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DepartmentsPage;
