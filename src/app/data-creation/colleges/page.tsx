'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { College } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CollegeForm } from './college-form';

const CollegesPage: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
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

  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="bg-card/80 dark:bg-card/60 p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Manage Colleges</h1>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input
            type="text"
            placeholder="Search colleges by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Button
            onClick={handleAddNew}
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
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-4 text-left font-semibold">#</th>
                        <th className="p-4 text-left font-semibold">College Code</th>
                        <th className="p-4 text-left font-semibold">Full College Name</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredColleges.map((college, index) => (
                        <tr key={college.id}>
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
                    <div key={college.id} className="bg-card/80 p-4 rounded-lg shadow-sm border">
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
            <DialogTitle>{editingCollege ? 'Edit College' : 'Add New College'}</DialogTitle>
          </DialogHeader>
          <CollegeForm
            college={editingCollege}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CollegesPage;
