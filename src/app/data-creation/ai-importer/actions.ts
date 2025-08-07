
'use server';

import { AnalyzedEntity } from '@/lib/types/ai-importer';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, query, where, getDocs, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';


// Helper function to normalize names for comparison
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

// Helper to create a fallback code from a name
const createFallbackCode = (name: string) => {
    return name
        .toUpperCase()
        .replace("COLLEGE OF", "")
        .trim()
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 5);
}

// Helper function to Title Case strings
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


export async function saveAnalyzedData(
    entities: AnalyzedEntity[]
): Promise<{ success: boolean; message: string }> {
    if (!entities || entities.length === 0) {
        return { success: false, message: 'No entities to save.' };
    }

    const batch = writeBatch(db);
    let createdCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const idMap = new Map<string, string>(); 

    try {
        const existingCollegesSnap = await getDocs(query(collection(db, 'colleges')));
        const existingColleges = existingCollegesSnap.docs.map(d => ({ id: d.id, ...d.data(), normalizedName: normalize(d.data().name) }));

        const existingDepartmentsSnap = await getDocs(query(collection(db, 'departments')));
        const existingDepartments = existingDepartmentsSnap.docs.map(d => ({ id: d.id, ...d.data(), normalizedName: normalize(d.data().name) }));
        
        const entityTypes = ['College', 'Department', 'Program', 'Level', 'Course'];

        for (const type of entityTypes) {
            const itemsToProcess = entities.filter(e => e.type === type);

            for (const item of itemsToProcess) {
                try {
                    let parentDocId = item.parentId ? idMap.get(item.parentId) : null;
                    let docRef;

                    if (item.type === 'College') {
                        const formattedName = item.name.toUpperCase();
                        const existing = existingColleges.find(c => c.normalizedName === normalize(formattedName));
                        if (existing) {
                            idMap.set(item.id, existing.id);
                        } else {
                            docRef = doc(collection(db, 'colleges'));
                            const code = item.properties.code || createFallbackCode(formattedName);
                            batch.set(docRef, { name: formattedName, code, createdAt: serverTimestamp() });
                            idMap.set(item.id, docRef.id);
                            existingColleges.push({ id: docRef.id, name: formattedName, normalizedName: normalize(formattedName) });
                            createdCount++;
                        }
                    } else if (item.type === 'Department') {
                         if (!parentDocId) {
                            // Create a default College for this orphan department
                            const collegeName = `COLLEGE OF ${toTitleCase(item.name)}`;
                            let collegeId = existingColleges.find(c => c.normalizedName === normalize(collegeName))?.id;

                            if (!collegeId) {
                                const collegeRef = doc(collection(db, 'colleges'));
                                const code = createFallbackCode(collegeName);
                                batch.set(collegeRef, { name: collegeName, code, createdAt: serverTimestamp() });
                                collegeId = collegeRef.id;
                                existingColleges.push({ id: collegeId, name: collegeName, normalizedName: normalize(collegeName) });
                                createdCount++;
                            }
                            parentDocId = collegeId;
                         }

                         const formattedName = toTitleCase(item.name);
                         const existing = existingDepartments.find(d => d.normalizedName === normalize(formattedName) && d.collegeId === parentDocId);
                         if (existing) {
                             idMap.set(item.id, existing.id);
                         } else {
                            docRef = doc(collection(db, 'departments'));
                            batch.set(docRef, { name: formattedName, collegeId: parentDocId, createdAt: serverTimestamp() });
                            idMap.set(item.id, docRef.id);
                            existingDepartments.push({ id: docRef.id, name: formattedName, collegeId: parentDocId, normalizedName: normalize(formattedName) });
                            createdCount++;
                         }
                    } else if (item.type === 'Program') {
                        if (!parentDocId) {
                            // Create default College and Department for this orphan program
                            const collegeName = `COLLEGE OF ${toTitleCase(item.name)}`;
                            let collegeId = existingColleges.find(c => c.normalizedName === normalize(collegeName))?.id;
                            if (!collegeId) {
                                const collegeRef = doc(collection(db, 'colleges'));
                                batch.set(collegeRef, { name: collegeName, code: createFallbackCode(collegeName), createdAt: serverTimestamp() });
                                collegeId = collegeRef.id;
                                existingColleges.push({ id: collegeId, name: collegeName, normalizedName: normalize(collegeName) });
                                createdCount++;
                            }
                            
                            const deptName = `Department of ${toTitleCase(item.name)}`;
                            let departmentId = existingDepartments.find(d => d.normalizedName === normalize(deptName) && d.collegeId === collegeId)?.id;
                            if (!departmentId) {
                                const deptRef = doc(collection(db, 'departments'));
                                batch.set(deptRef, { name: deptName, collegeId, createdAt: serverTimestamp() });
                                departmentId = deptRef.id;
                                existingDepartments.push({ id: departmentId, name: deptName, collegeId, normalizedName: normalize(deptName) });
                                createdCount++;
                            }
                            parentDocId = departmentId;
                        }
                        
                        docRef = doc(collection(db, 'programs'));
                        batch.set(docRef, { 
                            name: toTitleCase(item.name), 
                            departmentId: parentDocId, 
                            max_level: item.properties.max_level || 4,
                            createdAt: serverTimestamp() 
                        });
                        idMap.set(item.id, docRef.id);
                        createdCount++;
                    } else if (item.type === 'Level') {
                         if (!parentDocId) throw new Error(`Level "${item.name}" is missing a Program parent.`);
                        docRef = doc(collection(db, 'levels'));
                        batch.set(docRef, { 
                            programId: parentDocId, 
                            level: parseInt(item.name.match(/\d+/)?.[0] || '1'),
                            students_count: item.properties.students_count || 0,
                            createdAt: serverTimestamp()
                        });
                        idMap.set(item.id, docRef.id);
                        createdCount++;
                    } else if (item.type === 'Course') {
                         if (!parentDocId) throw new Error(`Course "${item.name}" is missing a Level parent.`);
                        docRef = doc(collection(db, 'courses'));
                        batch.set(docRef, { 
                            levelId: parentDocId, 
                            course_code: (item.properties.course_code || 'N/A').toUpperCase(),
                            course_name: toTitleCase(item.name),
                            credit_unit: item.properties.credit_unit || 3,
                            exam_type: item.properties.exam_type || 'Written',
                            createdAt: serverTimestamp() 
                        });
                        idMap.set(item.id, docRef.id);
                        createdCount++;
                    }

                } catch (e: any) {
                    errorCount++;
                    errors.push(e.message);
                }
            }
        }

        if (errorCount > 0) {
            return { success: false, message: `Save failed. ${errorCount} errors occurred. First error: ${errors[0]}` };
        }
        
        await batch.commit();

        revalidatePath('/data-creation', 'layout');

        return { success: true, message: `Successfully created ${createdCount} new records.` };

    } catch (error: any) {
        console.error('Error saving analyzed data:', error);
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
}
