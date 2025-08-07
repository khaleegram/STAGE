import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Library, GraduationCap, Layers, BookOpen, BookCopy, BookUser, MapPin, Clock, Wand2 } from 'lucide-react';

const dataLinks = [
    { href: '/data-creation/sessions', title: 'Sessions & Semesters', description: 'Manage academic years and terms', icon: <Clock className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/colleges', title: 'Colleges', description: 'Manage university colleges', icon: <Building2 className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/departments', title: 'Departments', description: 'Manage academic departments', icon: <Library className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/programs', title: 'Programs', description: 'Manage academic programs', icon: <GraduationCap className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/levels', title: 'Levels', description: 'Manage program levels and student counts', icon: <Layers className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/courses', title: 'Courses', description: 'Manage individual courses', icon: <BookOpen className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/combined-courses', title: 'Combined Courses', description: 'Manage courses shared across programs', icon: <BookCopy className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/staff', title: 'Staff', description: 'Manage staff members for invigilation', icon: <BookUser className="w-8 h-8 text-primary" /> },
    { href: '/data-creation/venues', title: 'Venues', description: 'Manage examination venues', icon: <MapPin className="w-8 h-8 text-primary" /> },
];

export default function DataCreationPage() {
    return (
        <div className="space-y-6">
            <Link href="/data-creation/ai-importer">
                <Card className="bg-primary/10 border-primary/40 hover:bg-primary/20 transition-colors">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Wand2 className="w-10 h-10 text-primary" />
                        <div>
                            <CardTitle className="text-xl">AI Smart Importer</CardTitle>
                            <CardDescription>
                                Upload a PDF, image, or CSV to automatically detect and import all your academic data at once.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {dataLinks.map(link => (
                    <Link href={link.href} key={link.href}>
                        <Card className="h-full hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center gap-4">
                                {link.icon}
                                <div>
                                    <CardTitle>{link.title}</CardTitle>
                                    <CardDescription>{link.description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
