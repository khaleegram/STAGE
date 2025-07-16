import React from 'react';

export default function DataCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen space-y-8">
        <h1 className="text-4xl font-bold text-center text-foreground">Data Creation</h1>
        {children}
    </div>
  );
}
