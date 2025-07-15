import React from 'react';

// This layout file is not strictly necessary if it's empty, 
// but it's good practice for Next.js App Router structure.
export default function CombinedCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
