
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
    if (loading) return; // Wait until loading is finished

    if (!user && !isPublicPath) {
      // If not logged in and on a protected page, redirect to login
      router.push('/login');
    }

    if (user && isPublicPath) {
      // If logged in and on a public page (like login), redirect to dashboard
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

  if (!user && isPublicPath) {
    // User is not logged in and on a public path, show the public page (login/signup)
    return <>{children}</>;
  }

  if (user && !isPublicPath) {
     // User is logged in and on a protected path, show the main app layout
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

  // This will cover the case where the user is logged in and on a public path,
  // showing a loader while the useEffect redirects them. Also covers the case
  // where the user is logged out and on a protected path.
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
    );
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
