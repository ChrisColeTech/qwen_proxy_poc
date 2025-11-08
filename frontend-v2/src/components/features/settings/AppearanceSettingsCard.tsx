import { useUIStore } from '@/stores/useUIStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Palette } from 'lucide-react';

export function AppearanceSettingsCard() {
  const { uiState, toggleTheme, toggleSidebarPosition } = useUIStore();

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
      </CardContent>
    </Card>
  );
}
