import { Moon, Sun, PanelLeft, PanelRight } from 'lucide-react';
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from 'react-icons/vsc';
import { useUIStore } from '@/stores/useUIStore';

export function TitleBar() {
  const theme = useUIStore((state) => state.uiState.theme);
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const toggleSidebarPosition = useUIStore((state) => state.toggleSidebarPosition);

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
      className="titlebar"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="titlebar-left">
        <span className="titlebar-title">Qwen Proxy</span>
      </div>

      <div className="titlebar-right" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          className="titlebar-button"
          onClick={toggleSidebarPosition}
          title={sidebarPosition === 'left' ? 'Move sidebar to right' : 'Move sidebar to left'}
        >
          {sidebarPosition === 'left' ? (
            <PanelRight className="titlebar-button-icon" />
          ) : (
            <PanelLeft className="titlebar-button-icon" />
          )}
        </button>

        <button
          className="titlebar-button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="titlebar-button-icon" />
          ) : (
            <Sun className="titlebar-button-icon" />
          )}
        </button>

        <button
          className="titlebar-button"
          onClick={handleMinimize}
          title="Minimize window"
        >
          <VscChromeMinimize className="titlebar-button-icon" />
        </button>

        <button
          className="titlebar-button"
          onClick={handleMaximize}
          title="Maximize window"
        >
          <VscChromeMaximize className="titlebar-button-icon" />
        </button>

        <button
          className="titlebar-button-close"
          onClick={handleClose}
          title="Close window"
        >
          <VscChromeClose className="titlebar-button-icon" />
        </button>
      </div>
    </div>
  );
}
