
'use client';

import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/layout/theme-provider';
import Navbar from '@/components/layout/navbar';
import { AppSidebar } from '@/components/layout/sidebar';
import MainContent from '@/components/layout/main-content';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const publicPaths = ['/login', '/signup'];

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Show a loading skeleton for protected routes while auth state is loading
  if (loading && !publicPaths.includes(pathname)) {
    return (
        <div className="flex min-h-screen bg-light dark:bg-dark bg-cover bg-center bg-no-repeat overflow-x-hidden">
            <div className="w-20 sm:w-64 h-screen"><Skeleton className="h-full w-full bg-muted" /></div>
            <div className="flex-1 p-6">
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
  }
  
  // If on a public path, or we have a user, render the appropriate layout
  if (publicPaths.includes(pathname) || user) {
     if (publicPaths.includes(pathname)) {
        return <>{children}</>;
     }

    return (
      <div className="flex min-h-screen bg-light dark:bg-dark bg-cover bg-center bg-no-repeat overflow-x-hidden">
        <AppSidebar />
        <div className={cn(
          'fixed top-0 z-50 w-full transition-transform duration-300',
          scrollDirection === 'down' ? '-translate-y-24' : 'translate-y-0'
        )}>
          <Navbar />
        </div>
        <div className="flex-1 flex flex-col">
          <MainContent>{children}</MainContent>
        </div>
      </div>
    );
  }

  // If on a protected path and loading is done but there's no user, return null
  // The useEffect above will have already initiated the redirect.
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>Al-Qalam Scheduler</title>
        <meta name="description" content="AI-Powered Timetable Generation for Al-Qalam University" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider storageKey="al-qalam-theme">
          <AuthProvider>
            <SidebarProvider>
              <TooltipProvider delayDuration={0}>
                <ProtectedLayout>{children}</ProtectedLayout>
              </TooltipProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
