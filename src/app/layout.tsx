
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
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const publicPaths = ['/login', '/signup'];

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  
  const isPublicPath = publicPaths.includes(pathname);

  // If we are on a public path (like login) and there's a user, 
  // it means the login page's redirect hasn't happened yet. 
  // We can show a loader or nothing while we wait for the redirect.
  // Or, if loading auth state on a protected path, show a loader.
  if ((isPublicPath && user) || (loading && !isPublicPath)) {
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
  
  // If it's a public path and we're not logged in, render the public page (login/signup)
  if (isPublicPath && !user) {
    return <>{children}</>;
  }
  
  // If it's a protected path and we have a user, render the main app layout
  if (!isPublicPath && user) {
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

  // Fallback case: Should not happen often.
  // This can occur if you land on a protected page, are not logged in, and loading is finished.
  // The login page's redirect effect will handle pushing you to the correct page.
  // Returning null here prevents a flash of incorrect content.
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
