'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { Department, College } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DepartmentForm } from './department-form';

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Colleges
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

    // Fetch Departments and denormalize college name
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

  const filteredDepartments = departments.filter((department) =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.collegeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="bg-card/80 dark:bg-card/60 p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Departments</h3>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center">
          <Input
            type="text"
            placeholder="Search departments or colleges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm mb-2 sm:mb-0"
          />
          <Button
            onClick={handleAddNew}
            className="w-full sm:w-auto"
          >
            + Add Department
          </Button>
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
                <div className="overflow-x-auto hidden sm:block rounded-lg border">
                  <table className="min-w-full table-auto">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-4 text-left font-semibold">#</th>
                        <th className="p-4 text-left font-semibold">Department Name</th>
                        <th className="p-4 text-left font-semibold">College</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredDepartments.map((dept, index) => (
                        <tr key={dept.id}>
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
                          <td colSpan={4} className="text-center p-4 text-muted-foreground">
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
                    <div key={dept.id} className="bg-card/80 p-4 rounded-lg shadow-sm border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-primary">#{index + 1}</h4>
                          <p><strong>Department:</strong> {dept.name}</p>
                          <p><strong>College:</strong> {dept.collegeName || 'N/A'}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
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
    </section>
  );
};

export default DepartmentsPage;
