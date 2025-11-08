import { Settings, Network, Bug, Palette } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ContentCard } from '@/components/ui/content-card';

export const SETTINGS_TABS = {
  APPEARANCE: {
    value: 'appearance',
    label: 'Appearance',
    description: 'Customize the look and feel of the application'
  },
  PROXY: {
    value: 'proxy',
    label: 'Proxy Settings',
    description: 'Configure proxy server settings'
  },
  DEBUG: {
    value: 'debug',
    label: 'Debug Settings',
    description: 'Developer and debugging options'
  }
} as const;

export const SETTINGS_TITLE = 'Settings';
export const SETTINGS_ICON = Settings;

// Setting row builder helper
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

// Appearance Tab Builder
export const buildAppearanceContent = (params: {
  theme: string;
  sidebarPosition: string;
  showStatusMessages: boolean;
  handleThemeChange: (value: string) => void;
  handleSidebarPositionChange: (value: string) => void;
  handleStatusMessagesChange: (value: string) => void;
}) => {
  const {
    theme,
    sidebarPosition,
    showStatusMessages,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
  } = params;

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
          'Status Bar Messages',
          'Show all status information in the status bar',
          <ToggleGroup
            type="single"
            value={showStatusMessages ? 'show' : 'hide'}
            onValueChange={handleStatusMessagesChange}
          >
            <ToggleGroupItem value="show">Show</ToggleGroupItem>
            <ToggleGroupItem value="hide">Hide</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
    </ContentCard>
  );
};

// Proxy Settings Tab Builder
export const buildProxyContent = () => {
  return (
    <div className="vspace-md">
      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Network className="icon-primary" />
            <span className="demo-label-text">Proxy Configuration</span>
          </div>
        </div>
        <div className="provider-switch-list">
          <p className="text-muted-foreground text-center py-8">
            Proxy settings coming soon. Configure default port, timeout settings, and connection options.
          </p>
        </div>
      </div>
    </div>
  );
};

// Debug Settings Tab Builder
export const buildDebugContent = () => {
  return (
    <div className="vspace-md">
      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Bug className="icon-primary" />
            <span className="demo-label-text">Debug Options</span>
          </div>
        </div>
        <div className="provider-switch-list">
          <p className="text-muted-foreground text-center py-8">
            Debug settings coming soon. Enable verbose logging, request/response inspection, and developer tools.
          </p>
        </div>
      </div>
    </div>
  );
};
