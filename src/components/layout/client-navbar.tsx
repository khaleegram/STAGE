'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import Navbar from '@/components/layout/navbar';
import { useSidebar } from '../ui/sidebar';
import { Skeleton } from '../ui/skeleton';

const ClientNavbar = () => {
    const isMobile = useIsMobile();
    const { toggleSidebar } = useSidebar();

    if (isMobile === undefined) {
        // Return a placeholder to prevent layout shift during initial render
        return <div className="fixed top-4 right-4 h-12 w-32"><Skeleton className="h-full w-full" /></div>;
    }

    // Render the appropriate navbar based on screen size
    return isMobile 
        ? <Navbar mobile onToggleSidebar={toggleSidebar} /> 
        : <Navbar />;
};

export default ClientNavbar;
