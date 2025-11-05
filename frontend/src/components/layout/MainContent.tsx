import { type ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div className="main-content">
      {children}
    </div>
  );
}
