'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { College } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const AddCollege: React.FC = () => {
  const prefix = "COLLEGE OF ";
  const [appendedCollegeName, setAppendedCollegeName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editCollege, setEditCollege] = useState<College | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const collegesQuery = query(collection(db, 'colleges'), orderBy('name'));
    const unsubscribe = onSnapshot(collegesQuery, (snapshot) => {
      const collegesList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'N/A',
        short_name: doc.data().code || 'N/A',
        code: doc.data().code || 'N/A' // Ensure code property exists
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

  const fullCollegeName = prefix + appendedCollegeName;

  const handleCollegeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (value.startsWith(prefix)) {
      setAppendedCollegeName(value.slice(prefix.length));
    } else {
      // If user tries to edit prefix, just update based on what's after it
      setAppendedCollegeName(value);
    }
  };

  const handleCollegeCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCollegeCode(e.target.value.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appendedCollegeName || !collegeCode) {
        toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
      if (editId) {
        const collegeRef = doc(db, 'colleges', editId);
        await updateDoc(collegeRef, { name: fullCollegeName, code: collegeCode, short_name: collegeCode });
        toast({ title: 'Success', description: 'College updated successfully' });
      } else {
        await addDoc(collection(db, 'colleges'), { name: fullCollegeName, code: collegeCode, short_name: collegeCode, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'College added successfully' });
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving college:', error);
      toast({ title: 'Error', description: 'An error occurred while saving.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (college: College) => {
    setEditId(college.id);
    setEditCollege(college);
    if (college.name.startsWith(prefix)) {
      setAppendedCollegeName(college.name.slice(prefix.length));
    } else {
      setAppendedCollegeName(college.name);
    }
    setCollegeCode(college.code);
    setShowModal(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this college?')) return;
    try {
      await deleteDoc(doc(db, 'colleges', id));
      toast({ title: 'Success', description: 'College deleted successfully' });
    } catch (error) {
      console.error('Error deleting college:', error);
      toast({ title: 'Error', description: 'Could not delete college.', variant: 'destructive' });
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setEditCollege(null);
    setAppendedCollegeName('');
    setCollegeCode('');
    setShowModal(true);
  }

  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="p-4 sm:p-6 lg:p-8 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Manage Colleges</h1>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input
            type="text"
            placeholder="Search colleges by full name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Button
            onClick={openAddModal}
            className="w-full sm:w-auto"
          >
            + Add College
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
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-4 text-left font-semibold">#</th>
                        <th className="p-4 text-left font-semibold">College Code</th>
                        <th className="p-4 text-left font-semibold">Full College Name</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredColleges.map((college, index) => (
                        <tr key={college.id}>
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4">{college.code}</td>
                          <td className="p-4">{college.name}</td>
                          <td className="p-4 flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(college)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(college.id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredColleges.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center p-4 text-muted-foreground">
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
                    <div key={college.id} className="bg-card p-4 rounded-lg shadow-sm border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-primary">#{index + 1}</h4>
                          <p><strong>Code:</strong> {college.code}</p>
                          <p><strong>Full Name:</strong> {college.name}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(college)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(college.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
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
            <DialogTitle>{editId ? 'Edit College' : 'Add College'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor='college-name' className="block text-sm font-medium mb-1">Full College Name</label>
                <Input
                    id="college-name"
                    type="text"
                    value={prefix + appendedCollegeName}
                    onChange={handleCollegeNameChange}
                    required
                    placeholder="Enter college name"
                />
              </div>
            <div>
              <label htmlFor='college-code' className="block text-sm font-medium mb-1">College Short Code</label>
              <Input
                id="college-code"
                type="text"
                value={collegeCode}
                onChange={handleCollegeCodeChange}
                required
                placeholder="e.g., NAS"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (editId ? 'Updating...' : 'Adding...') : (editId ? 'Update' : 'Add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AddCollege;
