
'use client';

import { AnalyzedEntity } from "@/ai/flows/analyze-academic-data";
import { Badge } from "@/components/ui/badge";
import { Building2, Library, GraduationCap, Layers, BookOpen, AlertTriangle, CheckCircle, HelpCircle, CircleDot } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

const typeInfo = {
    College: { icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100' },
    Department: { icon: Library, color: 'text-blue-600', bg: 'bg-blue-100' },
    Program: { icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-100' },
    Level: { icon: Layers, color: 'text-orange-600', bg: 'bg-orange-100' },
    Course: { icon: BookOpen, color: 'text-red-600', bg: 'bg-red-100' },
};

const statusInfo = {
    new: { icon: CircleDot, color: 'text-blue-500', label: 'New' },
    matched: { icon: CheckCircle, color: 'text-green-500', label: 'Matched' },
    ambiguous: { icon: HelpCircle, color: 'text-amber-500', label: 'Ambiguous' },
    error: { icon: AlertTriangle, color: 'text-destructive', label: 'Error' },
};


export const EntityCard = ({ entity }: { entity: AnalyzedEntity }) => {
    const Icon = typeInfo[entity.type].icon;
    const iconColor = typeInfo[entity.type].color;
    const bgColor = typeInfo[entity.type].bg;

    const StatusIcon = statusInfo[entity.status].icon;
    const statusColor = statusInfo[entity.status].color;

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors border">
            <div className={`p-2 rounded-md ${bgColor}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{entity.name}</h4>
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                             <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Status: <span className="font-semibold capitalize">{entity.status}</span></p>
                        </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                </div>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="w-full">
                                <Progress value={entity.confidence * 100} className="h-2" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>AI Confidence: {(entity.confidence * 100).toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">{entity.reasoning}</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
                {Object.keys(entity.properties).length > 0 && (
                     <div className="flex flex-wrap gap-1 pt-1">
                        {Object.entries(entity.properties).map(([key, value]) => (
                             <Badge variant="secondary" key={key}>
                                <span className="font-normal text-muted-foreground mr-1">{key.replace(/_/g, ' ')}:</span>
                                <span>{value}</span>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
