import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/layout/theme-provider';
import Navbar from '@/components/layout/navbar';

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
      <body className="font-body antialiased bg-light dark:bg-dark bg-cover bg-fixed">
        <ThemeProvider storageKey="al-qalam-theme">
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <div className="flex flex-col h-full">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                  {children}
                </main>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
