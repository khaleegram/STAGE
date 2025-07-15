import React from 'react';

export default function DataCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
        {/* The h1 and other shared layout components can go here if needed in the future */}
        {children}
    </div>
  );
}
