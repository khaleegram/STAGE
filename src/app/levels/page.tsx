
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Level } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Layers } from 'lucide-react';

async function getLevels(): Promise<Level[]> {
  try {
    const levelsCollection = collection(db, 'levels');
    const levelSnapshot = await getDocs(levelsCollection);

    const levelsList = await Promise.all(levelSnapshot.docs.map(async (l: QueryDocumentSnapshot<DocumentData>) => {
        const data = l.data();
        const level: Level = {
            id: l.id,
            programId: data.program_id || 'N/A',
            level: data.level || 0,
            students_count: data.students_count || 0,
            promotion_rate: data.promotion_rate || 0,
        };

        if (level.programId !== 'N/A') {
            try {
                const programRef = doc(db, 'programs', level.programId);
                const programSnap = await getDoc(programRef);
                if (programSnap.exists()) {
                    level.programName = programSnap.data().name || 'Unknown Program';
                }
            } catch (e) {
                console.error(`Failed to fetch program ${level.programId}`, e)
                level.programName = 'Unknown Program';
            }
        }
        
        return level;
    }));
    return levelsList;
  } catch (error) {
    console.error("Error fetching levels: ", error);
    // Fallback mock data
    return [
      { id: '1', programId: '1', programName: 'Software Engineering', level: 1, students_count: 300, promotion_rate: 1.00 },
      { id: '2', programId: '1', programName: 'Software Engineering', level: 2, students_count: 0, promotion_rate: 1.00 },
      { id: '3', programId: '1', programName: 'Software Engineering', level: 3, students_count: 0, promotion_rate: 1.00 },
    ];
  }
}

export default async function LevelsPage() {
  const levels = await getLevels();

  return (
    <div className="flex flex-col h-full">
      <Header title="Levels" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Levels</CardTitle>
              <CardDescription>Manage your program's academic levels.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2" />
              Add Level
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Student Count</TableHead>
                  <TableHead>Promotion Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-medium">{level.programName}</TableCell>
                    <TableCell>{level.level}00</TableCell>
                    <TableCell>{level.students_count}</TableCell>
                    <TableCell>{(level.promotion_rate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
