'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { Level, Program } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { LevelForm } from './level-form';

const LevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [programSearch, setProgramSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Programs
    const progsQuery = query(collection(db, 'programs'), orderBy('name'));
    const unsubscribeProgs = onSnapshot(progsQuery, (snapshot) => {
      const progsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Program));
      setPrograms(progsList);
    }, (error) => {
      console.error("Error fetching programs: ", error);
      toast({ title: 'Error', description: 'Could not fetch programs.', variant: 'destructive' });
    });

    // Fetch Levels and denormalize program name
    const levelsQuery = query(collection(db, 'levels'), orderBy('level'));
    const unsubscribeLevels = onSnapshot(levelsQuery, async (snapshot) => {
      const levelsListPromises = snapshot.docs.map(async (l) => {
        const data = l.data();
        const level: Level = {
          id: l.id,
          programId: data.programId,
          level: data.level,
          students_count: data.students_count,
        };

        if (level.programId) {
          try {
            const progRef = doc(db, 'programs', level.programId);
            const progSnap = await getDoc(progRef);
            if (progSnap.exists()) {
              level.programName = progSnap.data().name || 'Unknown Program';
            }
          } catch (e) {
            console.error(`Failed to fetch program ${level.programId}`, e);
            level.programName = 'Unknown Program';
          }
        }
        return level;
      });
      
      const levelsList = await Promise.all(levelsListPromises);
      setLevels(levelsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching levels: ", error);
      toast({ title: 'Error', description: 'Could not fetch levels.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => {
      unsubscribeProgs();
      unsubscribeLevels();
    };
  }, [toast]);

  const handleAddNew = () => {
    setEditingLevel(null);
    setShowModal(true);
  };

  const handleEdit = (level: Level) => {
    setEditingLevel(level);
    setShowModal(true);
  };

  const groupedLevels = useMemo(() => {
    return levels.reduce((acc, lvl) => {
      const progName = lvl.programName || 'Uncategorized';
      if (!acc[progName]) {
        acc[progName] = [];
      }
      acc[progName].push(lvl);
      return acc;
    }, {} as Record<string, Level[]>);
  }, [levels]);

  const filteredGroups = Object.entries(groupedLevels).filter(([progName]) =>
    progName.toLowerCase().includes(programSearch.toLowerCase())
  );

  return (
    <section className="bg-card/80 dark:bg-card/60 p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Levels</h3>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center">
          <Input
            type="text"
            placeholder="Search by program..."
            value={programSearch}
            onChange={(e) => setProgramSearch(e.target.value)}
            className="w-full sm:max-w-sm mb-2 sm:mb-0"
          />
          <Button
            onClick={handleAddNew}
            className="w-full sm:w-auto"
          >
            + Add Level
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
                {filteredGroups.length > 0 ? filteredGroups.map(([progName, lvlArray]) => (
                    <div key={progName}>
                        <h2 className="text-xl font-semibold mb-2 text-primary">{progName}</h2>
                         <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full table-auto">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-4 text-left font-semibold">Level</th>
                                        <th className="p-4 text-left font-semibold">Student Count</th>
                                        <th className="p-4 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {lvlArray.sort((a, b) => a.level - b.level).map((lvl) => (
                                        <tr key={lvl.id}>
                                            <td className="p-4 font-medium">{lvl.level}00 Level</td>
                                            <td className="p-4">{lvl.students_count}</td>
                                            <td className="p-4 flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(lvl)}>
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
                    <div className="text-center p-8 text-muted-foreground bg-card/50 rounded-lg border">
                        No levels found for your search criteria.
                    </div>
                )}
            </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLevel ? 'Edit Level' : 'Add New Level'}</DialogTitle>
          </DialogHeader>
          <LevelForm
            level={editingLevel}
            programs={programs}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default LevelsPage;
