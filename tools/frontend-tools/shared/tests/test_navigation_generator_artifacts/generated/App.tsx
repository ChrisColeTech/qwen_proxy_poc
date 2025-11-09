import { useEffect } from "react";
import { AppLayout } from "./components/layout";
import { useGlobalUIAudio } from "./hooks/audio/useGlobalUIAudio";

import { DragProvider, useDrag } from "./providers/DragProvider";
import { InstructionsProvider } from "./contexts/InstructionsContext";
import DraggedPiece from "./components/chess/DraggedPiece";
import SplashModal from "./components/splash/SplashModal";
import { useSelectedTab, useAppStore } from "./stores/appStore";
import { useChessAudio } from "./services/audio/audioService";
import { useAuthStatus } from "./hooks";
import AuthRouter from "./components/auth/AuthRouter";
import { TestSectionPage } from "./pages/testsection/TestSectionPage";
import { GamingPage } from "./pages/gaming/GamingPage";

/*
 * To add a new route/page:
 *
 * 1. Create your page component in ./pages/YourPage.tsx
 * 2. Export it from ./pages/index.ts
 * 3. Add the new tab ID to TabId type in ./components/layout/types.ts
 * 4. Add the tab configuration to the tabs array in ./components/layout/TabBar.tsx
 * 5. Import your page component above
 * 6. Add routing condition below in the AppContent component
 * 7. Optionally update the default currentPage state if needed
 */

function AppContent() {
  const selectedTab = useSelectedTab();
  const setSelectedTab = useAppStore((state) => state.setSelectedTab);
  const coinBalance = useAppStore((state) => state.coinBalance);
  const { draggedPiece, cursorPosition, draggedPieceSize } = useDrag();
  const { preloadSounds, playGameStart } = useChessAudio();
  const { isAuthenticated, isLoading: authLoading } = useAuthStatus();

  // Initialize Global UI Audio System
  useGlobalUIAudio({
    autoInitialize: true,
    initialConfig: {
      enabled: true,
      autoDetection: true,
      excludeSelectors: [
        '[data-no-sound]',
        '.no-sound',
        '.chess-piece',
        '.chess-square',
        '.chess-board',
        '[disabled]',
        '.disabled',
        '[data-headlessui-state]', // Exclude HeadlessUI elements (action sheets, menus, etc.)
        '[data-action-item]', // Exclude action sheet items that have explicit hover handlers
        '.action-sheet-item' // Exclude action sheet items by class
      ]
    }
  });


  // Initialize audio system on first user interaction (application-wide)
  useEffect(() => {
    const handleFirstInteraction = () => {
      preloadSounds();
      playGameStart(); // Welcome sound

      // Remove listeners after first interaction
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    // Listen for first user interaction to enable audio
    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("keydown", handleFirstInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []); // Empty dependency array - run only on mount

  // Show auth pages if not authenticated (and not loading)
  if (!authLoading && !isAuthenticated) {
    return <AuthRouter />;
  }

  return (
    <AppLayout
      currentTab={selectedTab}
      onTabChange={setSelectedTab}
      coinBalance={coinBalance}
    >
                  {/* Page routing */}
      {selectedTab === "testsection" && <TestSectionPage />}
      {selectedTab === "gaming" && <GamingPage />}

      {/* Global drag overlay */}
      {draggedPiece && (
        <DraggedPiece
          piece={draggedPiece}
          position={cursorPosition}
          size={draggedPieceSize}
        />
      )}
    </AppLayout>
  );
}

function App() {
  return (
    <InstructionsProvider>
      <DragProvider>
        <AppContent />
        {/* Global splash modal overlay - outside AppLayout for proper positioning */}
        <SplashModal />
      </DragProvider>
    </InstructionsProvider>
  );
}

export default App;
