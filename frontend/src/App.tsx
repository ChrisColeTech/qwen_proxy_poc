import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { ExtensionInstallPage } from '@/pages/ExtensionInstallPage';
import { useUIStore, useThemeSync } from '@/stores/useUIStore';

export function App() {
  // Sync theme with document element
  useThemeSync();

  // Get current screen from UI store
  const currentScreen = useUIStore((state) => state.uiState.currentScreen);

  // Render appropriate screen based on state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <AppLayout>
            <HomePage />
          </AppLayout>
        );
      case 'extension-install':
        return <ExtensionInstallPage />;
      default:
        return (
          <AppLayout>
            <HomePage />
          </AppLayout>
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <Toaster position="bottom-right" />
    </>
  );
}
