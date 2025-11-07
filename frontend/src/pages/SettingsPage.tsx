import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useUIStore } from '@/stores/useUIStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Monitor, Palette, PanelLeft, PanelRight } from 'lucide-react';

export function SettingsPage() {
  useProxyStatus();
  const { uiState, toggleTheme, toggleSidebarPosition } = useUIStore();

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleSidebarToggle = () => {
    toggleSidebarPosition();
  };

  return (
    <div className="page-container">
      <Card>
        <CardHeader>
          <CardTitle className="card-title-with-icon">
            <Palette className="icon-sm" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="vspace-md">
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">Dark Mode</div>
              <div className="text-setting-description">
                Toggle between light and dark theme
              </div>
            </div>
            <div className="flex-row">
              <Monitor className="icon-sm-muted" />
              <Switch
                checked={uiState.theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </div>

          <div className="divider-horizontal" />

          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">Sidebar Position</div>
              <div className="text-setting-description">
                Choose where the sidebar appears
              </div>
            </div>
            <div className="flex-row">
              <Button
                onClick={handleSidebarToggle}
                variant="outline"
                size="sm"
                className="flex-row-gap-sm"
              >
                {uiState.sidebarPosition === 'left' ? (
                  <>
                    <PanelLeft className="icon-sm" />
                    Left
                  </>
                ) : (
                  <>
                    <PanelRight className="icon-sm" />
                    Right
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
