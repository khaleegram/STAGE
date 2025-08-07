
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
    
    // Map from client-side AI-generated ID to the new Firestore document ID
    const idMap = new Map<string, string>(); 
    // Store the type of each new Firestore document
    const typeMap = new Map<string, AnalyzedEntity['type']>();

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
                    let parentDocId: string | null | undefined = item.parentId ? idMap.get(item.parentId) : null;
                    let docRef;

                    if (item.type === 'College') {
                        const formattedName = item.name.toUpperCase();
                        const existing = existingColleges.find(c => c.normalizedName === normalize(formattedName));
                        if (existing) {
                            idMap.set(item.id, existing.id);
                            typeMap.set(existing.id, 'College');
                        } else {
                            docRef = doc(collection(db, 'colleges'));
                            const code = item.properties.code || createFallbackCode(formattedName);
                            batch.set(docRef, { name: formattedName, code, createdAt: serverTimestamp() });
                            idMap.set(item.id, docRef.id);
                            typeMap.set(docRef.id, 'College');
                            existingColleges.push({ id: docRef.id, name: formattedName, code, normalizedName: normalize(formattedName) });
                            createdCount++;
                        }
                    } else if (item.type === 'Department') {
                         const formattedName = toTitleCase(item.name);
                         let parentIsCollege = parentDocId ? typeMap.get(parentDocId) === 'College' : false;

                         if (!parentDocId || !parentIsCollege) {
                            const collegeName = `COLLEGE OF ${formattedName}`;
                            let collegeId = existingColleges.find(c => c.normalizedName === normalize(collegeName))?.id;
                            if (!collegeId) {
                                const collegeRef = doc(collection(db, 'colleges'));
                                const code = createFallbackCode(collegeName);
                                batch.set(collegeRef, { name: collegeName, code, createdAt: serverTimestamp() });
                                collegeId = collegeRef.id;
                                existingColleges.push({ id: collegeId, name: collegeName, code, normalizedName: normalize(collegeName) });
                                createdCount++;
                            }
                            parentDocId = collegeId;
                         }

                         const existing = existingDepartments.find(d => d.normalizedName === normalize(formattedName) && d.collegeId === parentDocId);
                         if (existing) {
                             idMap.set(item.id, existing.id);
                             typeMap.set(existing.id, 'Department');
                         } else {
                            docRef = doc(collection(db, 'departments'));
                            batch.set(docRef, { name: formattedName, collegeId: parentDocId, createdAt: serverTimestamp() });
                            idMap.set(item.id, docRef.id);
                            typeMap.set(docRef.id, 'Department');
                            existingDepartments.push({ id: docRef.id, name: formattedName, collegeId: parentDocId, normalizedName: normalize(formattedName) });
                            createdCount++;
                         }
                    } else if (item.type === 'Program') {
                        let parentIsDepartment = parentDocId ? typeMap.get(parentDocId) === 'Department' : false;

                        if (!parentDocId || !parentIsDepartment) {
                            const deptName = `Department of ${toTitleCase(item.name)}`;
                            let departmentInfo = existingDepartments.find(d => d.normalizedName === normalize(deptName));

                            if (!departmentInfo) {
                                // Create a default college for this new department
                                const collegeName = `COLLEGE OF ${toTitleCase(item.name)}`;
                                let collegeId = existingColleges.find(c => c.normalizedName === normalize(collegeName))?.id;
                                if (!collegeId) {
                                    const collegeRef = doc(collection(db, 'colleges'));
                                    batch.set(collegeRef, { name: collegeName, code: createFallbackCode(collegeName), createdAt: serverTimestamp() });
                                    collegeId = collegeRef.id;
                                    existingColleges.push({ id: collegeId, name: collegeName, code: createFallbackCode(collegeName), normalizedName: normalize(collegeName) });
                                    createdCount++;
                                }

                                const deptRef = doc(collection(db, 'departments'));
                                batch.set(deptRef, { name: deptName, collegeId: collegeId, createdAt: serverTimestamp() });
                                const newDeptId = deptRef.id;
                                existingDepartments.push({ id: newDeptId, name: deptName, collegeId: collegeId, normalizedName: normalize(deptName) });
                                createdCount++;
                                parentDocId = newDeptId;
                            } else {
                                parentDocId = departmentInfo.id;
                            }
                        }
                        
                        docRef = doc(collection(db, 'programs'));
                        batch.set(docRef, { 
                            name: toTitleCase(item.name), 
                            departmentId: parentDocId, 
                            max_level: item.properties.max_level || 4,
                            createdAt: serverTimestamp() 
                        });
                        idMap.set(item.id, docRef.id);
                        typeMap.set(docRef.id, 'Program');
                        createdCount++;
                    } else if (item.type === 'Level') {
                         if (!parentDocId || typeMap.get(parentDocId) !== 'Program') throw new Error(`Level "${item.name}" is missing a Program parent.`);
                        docRef = doc(collection(db, 'levels'));
                        batch.set(docRef, { 
                            programId: parentDocId, 
                            level: parseInt(item.name.match(/\d+/)?.[0] || '1'),
                            students_count: item.properties.students_count || 0,
                            createdAt: serverTimestamp()
                        });
                        idMap.set(item.id, docRef.id);
                        typeMap.set(docRef.id, 'Level');
                        createdCount++;
                    } else if (item.type === 'Course') {
                         if (!parentDocId || typeMap.get(parentDocId) !== 'Level') throw new Error(`Course "${item.name}" is missing a Level parent.`);
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
                        typeMap.set(docRef.id, 'Course');
                        createdCount++;
                    }

                } catch (e: any) {
                    errorCount++;
                    errors.push(e.message);
                }
            }
        }

        if (errorCount > 0) {
            // Do not commit if there were errors.
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
