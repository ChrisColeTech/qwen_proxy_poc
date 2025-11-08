import { useUIStore } from '@/stores/useUIStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Palette } from 'lucide-react';

export function AppearanceSettingsCard() {
  const { uiState, toggleTheme, toggleSidebarPosition, toggleShowStatusMessages } = useUIStore();

  return (
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
            <div className="text-setting-label">Theme</div>
            <div className="text-setting-description">
              Choose your preferred color theme
            </div>
          </div>
          <ToggleGroup
            type="single"
            value={uiState.theme}
            onValueChange={(value) => {
              if (value) toggleTheme();
            }}
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="divider-horizontal" />

        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">Sidebar Position</div>
            <div className="text-setting-description">
              Choose where the sidebar appears
            </div>
          </div>
          <ToggleGroup
            type="single"
            value={uiState.sidebarPosition}
            onValueChange={(value) => {
              if (value) toggleSidebarPosition();
            }}
          >
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="divider-horizontal" />

        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">Status Bar Messages</div>
            <div className="text-setting-description">
              Show all status information in the status bar
            </div>
          </div>
          <ToggleGroup
            type="single"
            value={uiState.showStatusMessages ? 'show' : 'hide'}
            onValueChange={(value) => {
              if (!value) return;
              const shouldShow = value === 'show';
              if (shouldShow !== uiState.showStatusMessages) {
                toggleShowStatusMessages();
              }
            }}
          >
            <ToggleGroupItem value="show">Show</ToggleGroupItem>
            <ToggleGroupItem value="hide">Hide</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
}
