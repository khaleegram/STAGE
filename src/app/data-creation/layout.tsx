import React from 'react';

export default function DataCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
        {/* The h1 and other shared layout components can go here if needed in the future */}
        {children}
    </div>
  );
}
