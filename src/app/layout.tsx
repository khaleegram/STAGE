'use client';

import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/layout/theme-provider';
import Navbar from '@/components/layout/navbar';
import { AppSidebar } from '@/components/layout/sidebar';
import MainContent from '@/components/layout/main-content';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardReloadBar } from '@/components/layout/dashboard-reload-bar';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { cn } from '@/lib/utils';
import ClientNavbar from '@/components/layout/client-navbar';

// Metadata cannot be exported from a client component. 
// We can define it here, but it won't be used by Next.js in this file.
// For static metadata, this should be moved to a parent layout or page if possible.
// export const metadata: Metadata = {
//   title: 'Al-Qalam Scheduler',
//   description: 'AI-Powered Timetable Generation for Al-Qalam University',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const scrollDirection = useScrollDirection();

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
          <SidebarProvider>
            <TooltipProvider delayDuration={0}>
              <div className="flex min-h-screen bg-light dark:bg-dark bg-cover bg-center bg-no-repeat overflow-x-hidden">
                <AppSidebar />
                <div
                  className={cn(
                    'fixed top-0 z-50 w-full transition-transform duration-300',
                    scrollDirection === 'down' ? '-translate-y-24' : 'translate-y-0'
                  )}
                >
                    <DashboardReloadBar />
                    <Navbar />
                 </div>
                <div className="flex-1 flex flex-col">
                  <MainContent>
                    {children}
                  </MainContent>
                </div>
              </div>
            </TooltipProvider>
          </SidebarProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
