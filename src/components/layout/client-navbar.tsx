'use client';

import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/use-mobile';
import Navbar from '@/components/layout/navbar';

const ClientNavbar = () => {
    const isMobile = useIsMobile();

    if (isMobile === undefined) {
        return <div className="h-16" />; // Placeholder to prevent layout shift
    }

    // On mobile, the header is part of the main page flow.
    // On desktop, the navbar is fixed and positioned independently, so we don't render it here.
    return isMobile ? <Navbar mobile /> : null;
};

export default ClientNavbar;
