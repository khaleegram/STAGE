
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const publicPaths = ['/login', '/signup'];

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const scrollDirection = useScrollDirection();
  
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading to prevent premature redirects
    }

    // If not authenticated and trying to access a protected page, redirect to login
    if (!user && !isPublicPath) {
      router.push('/login');
    }

    // If authenticated and trying to access a public page (e.g., login), redirect to dashboard
    if (user && isPublicPath) {
      router.push('/');
    }
  }, [user, loading, isPublicPath, pathname, router]);


  if (loading) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    )
  }

  // If user is logged in, render the full app layout.
  // The useEffect handles redirecting away from public paths.
  if (user) {
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

  // If no user is logged in, only render public pages.
  // The useEffect handles redirecting from protected paths.
  return isPublicPath ? <>{children}</> : null;
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
