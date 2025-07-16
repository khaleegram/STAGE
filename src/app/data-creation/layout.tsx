import React from 'react';
import { BookCopy, Building2, GraduationCap, Layers, Library, BookOpen, BookUser, MapPin } from 'lucide-react';

export default function DataCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold tracking-tight text-center">Data Creation</h1>
       {children}
    </div>
  );
}
