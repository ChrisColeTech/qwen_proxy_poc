import { Palette } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ContentCard } from '@/components/ui/content-card';

interface AppearanceTabProps {
  theme: string;
  sidebarPosition: string;
  showStatusMessages: boolean;
  showStatusBar: boolean;
  handleThemeChange: (value: string) => void;
  handleSidebarPositionChange: (value: string) => void;
  handleStatusMessagesChange: (value: string) => void;
  handleStatusBarChange: (value: string) => void;
}

const buildSettingRow = (
  label: string,
  description: string,
  control: React.ReactNode
) => (
  <div className="flex-row-between">
    <div className="vspace-tight">
      <div className="text-setting-label">{label}</div>
      <div className="text-setting-description">{description}</div>
    </div>
    {control}
  </div>
);

export function AppearanceTab({
  theme,
  sidebarPosition,
  showStatusMessages,
  showStatusBar,
  handleThemeChange,
  handleSidebarPositionChange,
  handleStatusMessagesChange,
  handleStatusBarChange,
}: AppearanceTabProps) {
  return (
    <ContentCard icon={Palette} title="Appearance Settings">
      <div className="vspace-md p-4">
        {buildSettingRow(
          'Theme',
          'Choose your preferred color theme',
          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={handleThemeChange}
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        )}

        <div className="divider-horizontal" />

        {buildSettingRow(
          'Sidebar Position',
          'Choose where the sidebar appears',
          <ToggleGroup
            type="single"
            value={sidebarPosition}
            onValueChange={handleSidebarPositionChange}
          >
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        )}

        <div className="divider-horizontal" />

        {buildSettingRow(
          'Status Bar',
          'Show or hide the status bar',
          <ToggleGroup
            type="single"
            value={showStatusBar ? 'show' : 'hide'}
            onValueChange={handleStatusBarChange}
          >
            <ToggleGroupItem value="show">Show</ToggleGroupItem>
            <ToggleGroupItem value="hide">Hide</ToggleGroupItem>
          </ToggleGroup>
        )}

        <div className="divider-horizontal" />

        {buildSettingRow(
          'Status Bar Messages',
          'Show all status information in the status bar',
          <ToggleGroup
            type="single"
            value={showStatusMessages ? 'show' : 'hide'}
            onValueChange={handleStatusMessagesChange}
            disabled={!showStatusBar}
          >
            <ToggleGroupItem value="show">Show</ToggleGroupItem>
            <ToggleGroupItem value="hide">Hide</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
    </ContentCard>
  );
}
