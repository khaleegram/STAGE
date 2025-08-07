
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyzedEntity } from '@/lib/types/ai-importer';

interface EditEntityModalProps {
    entity: AnalyzedEntity;
    onClose: () => void;
    onSave: (entity: AnalyzedEntity) => void;
}

const entityTypes = ['College', 'Department', 'Program', 'Level', 'Course'];

export function EditEntityModal({ entity, onClose, onSave }: EditEntityModalProps) {
    const [editedEntity, setEditedEntity] = useState<AnalyzedEntity>(entity);

    useEffect(() => {
        setEditedEntity(entity);
    }, [entity]);

    const handlePropertyChange = (prop: string, value: string | number) => {
        setEditedEntity(prev => ({
            ...prev,
            properties: {
                ...prev.properties,
                [prop]: value,
            }
        }));
    };
    
    const handleSave = () => {
        onSave(editedEntity);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit: {entity.name}</DialogTitle>
                    <DialogDescription>
                        Modify the details for this entity before saving to the database.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="entity-type">Entity Type</Label>
                        <Select
                            value={editedEntity.type}
                            onValueChange={(value: AnalyzedEntity['type']) => setEditedEntity(prev => ({ ...prev, type: value }))}
                        >
                            <SelectTrigger id="entity-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {entityTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="entity-name">Name</Label>
                        <Input
                            id="entity-name"
                            value={editedEntity.name}
                            onChange={(e) => setEditedEntity(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>
                    
                    {Object.keys(editedEntity.properties).map(key => (
                        <div key={key}>
                            <Label htmlFor={`prop-${key}`} className="capitalize">{key.replace(/_/g, ' ')}</Label>
                            <Input
                                id={`prop-${key}`}
                                value={editedEntity.properties[key] as any}
                                onChange={(e) => handlePropertyChange(key, e.target.value)}
                            />
                        </div>
                    ))}
                    
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
