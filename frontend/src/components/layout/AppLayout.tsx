import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <TitleBar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <StatusBar />
    </div>
  );
}
