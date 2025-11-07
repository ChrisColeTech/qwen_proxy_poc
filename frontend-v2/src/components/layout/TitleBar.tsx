import { Moon, Sun, PanelLeft, PanelRight } from 'lucide-react';
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from 'react-icons/vsc';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';

export function TitleBar() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const sidebarPosition = useUIStore((state) => state.sidebarPosition);
  const toggleSidebarPosition = useUIStore((state) => state.toggleSidebarPosition);

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
      className="h-12 bg-background border-b border-border flex items-center justify-between px-4"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold">Qwen Proxy</h1>
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarPosition}
          title={`Move sidebar to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
        >
          {sidebarPosition === 'left' ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button variant="ghost" size="icon" onClick={handleMinimize} title="Minimize">
          <VscChromeMinimize className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleMaximize} title="Maximize">
          <VscChromeMaximize className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-destructive" title="Close">
          <VscChromeClose className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
