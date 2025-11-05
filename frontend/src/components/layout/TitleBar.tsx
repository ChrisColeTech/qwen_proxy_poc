import { Moon, Sun, PanelLeft, PanelRight } from 'lucide-react';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose } from 'react-icons/vsc';
import { useUIStore } from '@/stores/useUIStore';
import { useState, useEffect } from 'react';

export function TitleBar() {
  const theme = useUIStore((state) => state.uiState.theme);
  const sidebarSide = useUIStore((state) => state.uiState.sidebarSide);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const toggleSidebarSide = useUIStore((state) => state.toggleSidebarSide);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Listen for maximize/unmaximize events from Electron
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);

    // Check initial state
    if (window.electronAPI?.window.isMaximized) {
      window.electronAPI.window.isMaximized().then(setIsMaximized);
    }

    // Listen for events
    if (window.electronAPI?.window.onMaximize) {
      window.electronAPI.window.onMaximize(handleMaximize);
    }
    if (window.electronAPI?.window.onUnmaximize) {
      window.electronAPI.window.onUnmaximize(handleUnmaximize);
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.window.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.window.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.window.close();
  };

  return (
    <div
      className="titlebar"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App icon and title */}
      <div className="titlebar-left">
        <img src="/qwen-icon.svg" alt="Qwen Proxy" className="titlebar-icon" />
        <span className="titlebar-title">Qwen Proxy</span>
      </div>

      {/* Right: Sidebar side toggle, theme toggle and window controls */}
      <div className="titlebar-right" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={toggleSidebarSide}
          className="titlebar-button"
          title={sidebarSide === 'left' ? 'Move sidebar to right' : 'Move sidebar to left'}
        >
          {sidebarSide === 'left' ? (
            <PanelLeft className="titlebar-icon-sm" />
          ) : (
            <PanelRight className="titlebar-icon-sm" />
          )}
        </button>

        <button
          onClick={toggleTheme}
          className="titlebar-button"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="titlebar-icon-sm" />
          ) : (
            <Moon className="titlebar-icon-sm" />
          )}
        </button>

        <button
          onClick={handleMinimize}
          className="titlebar-button-wide"
          title="Minimize"
        >
          <VscChromeMinimize size={16} />
        </button>

        <button
          onClick={handleMaximize}
          className="titlebar-button-wide"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <VscChromeRestore size={16} /> : <VscChromeMaximize size={16} />}
        </button>

        <button
          onClick={handleClose}
          className="titlebar-button-close"
          title="Close"
        >
          <VscChromeClose size={16} />
        </button>
      </div>
    </div>
  );
}
