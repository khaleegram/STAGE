
'use client';

import { AnalyzedEntity } from "@/lib/types/ai-importer";
import { useMemo } from "react";
import { EntityCard } from "./entity-card";

interface TreeNode extends AnalyzedEntity {
    children: TreeNode[];
}

interface EntityTreeProps {
    entities: AnalyzedEntity[];
}

export const EntityTree = ({ entities }: EntityTreeProps) => {

    const entityTree = useMemo(() => {
        const entityMap = new Map<string, TreeNode>();
        const roots: TreeNode[] = [];

        entities.forEach(entity => {
            entityMap.set(entity.id, { ...entity, children: [] });
        });

        entities.forEach(entity => {
            const node = entityMap.get(entity.id);
            if (!node) return;

            if (entity.parentId && entityMap.has(entity.parentId)) {
                const parent = entityMap.get(entity.parentId);
                parent?.children.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;

    }, [entities]);

    const renderTree = (nodes: TreeNode[]) => {
        return (
            <div className="space-y-2">
                {nodes.map(node => (
                    <div key={node.id}>
                        <EntityCard entity={node} />
                        {node.children && node.children.length > 0 && (
                            <div className="pl-6 border-l-2 border-dashed ml-4 mt-2">
                                {renderTree(node.children)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }
    
    if (entityTree.length === 0) {
        return <p className="text-muted-foreground text-center p-4">No hierarchical data could be parsed.</p>
    }

    return renderTree(entityTree);
};
