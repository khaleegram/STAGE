'use server';

import { db } from '@/lib/firebase';
import { Program, Level } from '@/lib/types';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
  writeBatch,
} from 'firebase/firestore';

// This is a simplified promotion logic. A real-world scenario would be more complex,
// involving student records, grades, etc. This focuses on updating student counts per level.
export async function promoteStudents(): Promise<{ success: boolean; message: string }> {
  try {
    const programsCollection = collection(db, 'programs');
    const programSnapshot = await getDocs(programsCollection);

    if (programSnapshot.empty) {
      return { success: false, message: 'No programs found to process.' };
    }

    const batch = writeBatch(db);

    for (const programDoc of programSnapshot.docs) {
      const program = { id: programDoc.id, ...programDoc.data() } as Program;
      const levelsCollection = collection(db, 'levels');
      const q = query(levelsCollection, where('programId', '==', program.id));
      const levelsSnapshot = await getDocs(q);

      const levels: Level[] = levelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
      })) as Level[];

      // Sort levels in descending order to avoid overwriting counts before they are used.
      levels.sort((a, b) => b.level - a.level);
      
      let studentsForNextLevel = 0;

      for (const level of levels) {
          const currentStudents = level.students_count;
          const studentsToPromote = Math.floor(currentStudents * (level.promotion_rate || 1));
          
          const levelRef = doc(db, 'levels', level.id);

          if (level.level === program.max_level) {
              // These students graduate. In a real app, you'd move them to an 'alumni' collection.
              // For now, we just clear the count.
              batch.update(levelRef, { students_count: 0 });
          } else {
              // Update current level with students who did not get promoted
              batch.update(levelRef, { students_count: currentStudents - studentsToPromote });
              // The next level (which is the previous one in our descending loop) will receive these students.
              const nextLevelData = levels.find(l => l.level === level.level + 1);
              if (nextLevelData) {
                  const nextLevelRef = doc(db, 'levels', nextLevelData.id);
                  // We get the original count and add the promoted students
                  const originalNextLevelCount = nextLevelData.students_count || 0;
                  batch.update(nextLevelRef, { students_count: originalNextLevelCount + studentsToPromote });
              }
          }
      }
      
      // Handle new intake for 100 Level
      const firstLevel = levels.find(l => l.level === 1);
      if (firstLevel) {
          const firstLevelRef = doc(db, 'levels', firstLevel.id);
          // Here we are adding the expected intake to any existing students.
          // You might want to just set it to expected_intake instead.
          batch.update(firstLevelRef, { students_count: (firstLevel.students_count || 0) + (program.expected_intake || 0) });
      }
    }

    await batch.commit();

    return { success: true, message: 'Student promotion process completed successfully!' };
  } catch (error) {
    console.error('Error during student promotion:', error);
    if (error instanceof Error) {
        return { success: false, message: `An error occurred: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during promotion.' };
  }
}
