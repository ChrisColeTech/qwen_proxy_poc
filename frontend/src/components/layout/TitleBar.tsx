import { Moon, Sun } from 'lucide-react';
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from 'react-icons/vsc';
import { useUIStore } from '@/stores/useUIStore';

export function TitleBar() {
  const theme = useUIStore((state) => state.uiState.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.window.close();
    }
  };

  return (
    <div
      className="h-10 bg-background border-b border-border flex items-center justify-between"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-4">
        <span className="text-sm font-semibold">Qwen Proxy</span>
      </div>

      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          className="h-full w-12 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>

        <button
          className="h-full w-12 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={handleMinimize}
          title="Minimize window"
        >
          <VscChromeMinimize className="h-4 w-4" />
        </button>

        <button
          className="h-full w-12 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={handleMaximize}
          title="Maximize window"
        >
          <VscChromeMaximize className="h-4 w-4" />
        </button>

        <button
          className="h-full w-12 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={handleClose}
          title="Close window"
        >
          <VscChromeClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
