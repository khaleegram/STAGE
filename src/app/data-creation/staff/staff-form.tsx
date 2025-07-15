
'use client';

import React, { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Staff, College, Department } from '@/lib/types';
import { addStaff, updateStaff, deleteStaff } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const positions = [
    "Vice Chancellor", "Pro Vice Chancellor", "Deputy Vice Chancellor", "Registrar",
    "Bursar", "Director of Academic Planning", "Head of Department", "Principal Lecturer",
    "Senior Lecturer", "Lecturer",
];

interface StaffFormProps {
  staff: Staff | null;
  colleges: College[];
  onClose: () => void;
}

export function StaffForm({ staff, colleges, onClose }: StaffFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState(staff?.name || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [position, setPosition] = useState(staff?.position || '');
  const [collegeId, setCollegeId] = useState(staff?.collegeId || '');
  const [departmentId, setDepartmentId] = useState(staff?.departmentId || '');
  
  const [departmentsForCollege, setDepartmentsForCollege] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  useEffect(() => {
    if (staff) {
        setName(staff.name);
        setEmail(staff.email);
        setPhone(staff.phone);
        setPosition(staff.position);
        setCollegeId(staff.collegeId);
        setDepartmentId(staff.departmentId);
    }
  }, [staff]);

  // Fetch departments when collegeId changes
  useEffect(() => {
    if (!collegeId) {
      setDepartmentsForCollege([]);
      setDepartmentId(''); // Reset department
      return;
    }

    setIsLoadingDepartments(true);
    const deptsQuery = query(collection(db, 'departments'), where('collegeId', '==', collegeId), orderBy('name'));
    const unsubscribe = onSnapshot(deptsQuery, (snapshot) => {
      const fetchedDepts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      setDepartmentsForCollege(fetchedDepts);
      setIsLoadingDepartments(false);

      // If we are editing, don't reset unless the department is no longer valid for the new college
      if (staff && !fetchedDepts.some(d => d.id === staff.departmentId)) {
        setDepartmentId('');
      }

    }, (error) => {
      console.error("Error fetching departments: ", error);
      setIsLoadingDepartments(false);
      toast({ title: 'Error', description: 'Could not fetch departments.', variant: 'destructive' });
    });

    return () => unsubscribe();
  }, [collegeId, staff, toast]);

  // Server action setup
  const action = staff ? updateStaff.bind(null, staff.id) : addStaff;
  const [state, formAction] = useFormState(action, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        onClose();
      }
    }
  }, [state, toast, onClose]);
  
  const handleDelete = async () => {
    if (!staff) return;
    const result = await deleteStaff(staff.id);
     toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        setIsDeleteDialogOpen(false);
        onClose();
      }
  };

  return (
    <>
      <form action={formAction} className="space-y-4">
        {/* Hidden inputs to pass all data to the server action */}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="position" value={position} />
        <input type="hidden" name="collegeId" value={collegeId} />
        <input type="hidden" name="departmentId" value={departmentId} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
             <Select onValueChange={setPosition} value={position}>
                <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                <SelectContent>
                    {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Select onValueChange={(value) => { setCollegeId(value); setDepartmentId(''); }} value={collegeId}>
                <SelectTrigger><SelectValue placeholder="Select College" /></SelectTrigger>
                <SelectContent>
                    {colleges.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
             <Select onValueChange={setDepartmentId} value={departmentId} disabled={!collegeId || isLoadingDepartments}>
                <SelectTrigger><SelectValue placeholder={isLoadingDepartments ? 'Loading...' : 'Select Department'} /></SelectTrigger>
                <SelectContent>
                    {departmentsForCollege.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>


        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
            <div>
                {staff && (
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this staff member.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <SubmitButton label={staff ? 'Update' : 'Add'} />
            </div>
        </div>
      </form>
    </>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? `${label}...` : label}
    </Button>
  );
}
