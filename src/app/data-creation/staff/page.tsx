
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { Staff, College, Department } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffForm } from './staff-form';
import { Card } from '@/components/ui/card';
import { ImportStaffModal } from './import-staff-modal';
import { Upload } from 'lucide-react';

const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Colleges & Departments for the form/import modal
    const collegesQuery = query(collection(db, 'colleges'), orderBy('name'));
    const unsubscribeColleges = onSnapshot(collegesQuery, (snapshot) => {
      setColleges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College)));
    });
    
    const deptsQuery = query(collection(db, 'departments'), orderBy('name'));
    const unsubscribeDepts = onSnapshot(deptsQuery, (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    });


    // Fetch Staff and denormalize college/department names
    const staffQuery = query(collection(db, 'staffs'), orderBy('name'));
    const unsubscribeStaff = onSnapshot(staffQuery, async (snapshot) => {
      setIsLoading(true);
      const listPromises = snapshot.docs.map(async (s) => {
        const data = s.data();
        const staff: Staff = {
          id: s.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          position: data.position,
          collegeId: data.collegeId,
          departmentId: data.departmentId,
        };

        const collegePromise = staff.collegeId ? getDoc(doc(db, 'colleges', staff.collegeId)) : Promise.resolve(null);
        const departmentPromise = staff.departmentId ? getDoc(doc(db, 'departments', staff.departmentId)) : Promise.resolve(null);
        
        try {
            const [collegeSnap, departmentSnap] = await Promise.all([collegePromise, departmentPromise]);
            if (collegeSnap?.exists()) staff.collegeName = collegeSnap.data().name;
            if (departmentSnap?.exists()) staff.departmentName = departmentSnap.data().name;
        } catch (e) {
            console.error(`Failed to denormalize staff ${s.id}`, e);
        }
        
        return staff;
      });
      
      const list = await Promise.all(listPromises);
      setStaffList(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching staff: ", error);
      toast({ title: 'Error', description: 'Could not fetch staff.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => {
      unsubscribeColleges();
      unsubscribeStaff();
      unsubscribeDepts();
    };
  }, [toast]);
  
  const handleAddNew = () => {
    setEditingStaff(null);
    setShowModal(true);
  };
  
  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setShowModal(true);
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.collegeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staffList, searchTerm]);


  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Staff</h3>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <div className="flex gap-2 w-full sm:w-auto">
             <Button onClick={() => setShowImportModal(true)} variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Import Staff
              </Button>
            <Button
              onClick={handleAddNew}
              className="w-full"
            >
              + Add Staff
            </Button>
          </div>
        </div>
        
        {isLoading ? (
            <Skeleton className="h-48 w-full" />
        ) : (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden sm:block rounded-lg">
                  <table className="min-w-full table-auto">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-4 text-left font-semibold">Name</th>
                        <th className="p-4 text-left font-semibold">Contact</th>
                        <th className="p-4 text-left font-semibold">Position</th>
                        <th className="p-4 text-left font-semibold">College</th>
                        <th className="p-4 text-left font-semibold">Department</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredStaff.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/30">
                          <td className="p-4 font-medium">{s.name}</td>
                          <td className="p-4 text-sm">
                            <div>{s.email}</div>
                            <div className="text-muted-foreground">{s.phone}</div>
                          </td>
                          <td className="p-4">{s.position}</td>
                          <td className="p-4">{s.collegeName || 'N/A'}</td>
                          <td className="p-4">{s.departmentName || 'N/A'}</td>
                          <td className="p-4">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(s)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredStaff.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-muted-foreground">
                            No staff members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 block sm:hidden">
                  {filteredStaff.map((s) => (
                    <Card key={s.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-primary">{s.name}</h4>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(s)}>Edit</Button>
                        </div>
                        <p className="text-sm"><strong>Position:</strong> {s.position}</p>
                        <p className="text-sm"><strong>Email:</strong> {s.email}</p>
                        <p className="text-sm"><strong>Phone:</strong> {s.phone}</p>
                        <p className="text-sm"><strong>College:</strong> {s.collegeName || 'N/A'}</p>
                        <p className="text-sm"><strong>Department:</strong> {s.departmentName || 'N/A'}</p>
                    </Card>
                  ))}
                  {filteredStaff.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No staff members found.
                    </div>
                  )}
                </div>
            </>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          </DialogHeader>
          <StaffForm
            staff={editingStaff}
            colleges={colleges}
            departments={departments}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>
      
      <ImportStaffModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        colleges={colleges}
        departments={departments}
      />
    </Card>
  );
};

export default StaffPage;
