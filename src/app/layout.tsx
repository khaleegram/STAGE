import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/layout/theme-provider';
import ClientNavbar from '@/components/layout/client-navbar';
import { AppSidebar } from '@/components/layout/sidebar';
import MainContent from '@/components/layout/main-content';

export const metadata: Metadata = {
  title: 'Al-Qalam Scheduler',
  description: 'AI-Powered Timetable Generation for Al-Qalam University',
};

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
      </head>
      <body className="font-body antialiased">
        <ThemeProvider storageKey="al-qalam-theme">
          <SidebarProvider>
            <div className="min-h-screen bg-light dark:bg-dark bg-cover bg-center bg-no-repeat bg-fixed overflow-x-hidden">
              <AppSidebar />
              <ClientNavbar />
              <MainContent>
                {children}
              </MainContent>
            </div>
          </SidebarProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
