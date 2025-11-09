import { TabCard } from '@/components/ui/tab-card';
import { useSettingsPage } from '@/hooks/useSettingsPage';
import { AppearanceTab } from '@/components/features/settings/AppearanceTab';
import { ProxyTab } from '@/components/features/settings/ProxyTab';
import { DebugTab } from '@/components/features/settings/DebugTab';
import {
  SETTINGS_TABS,
  SETTINGS_TITLE,
  SETTINGS_ICON
} from '@/constants/settings.constants';

export function SettingsPage() {
  const {
    uiState,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
    handleStatusBarChange,
  } = useSettingsPage();

  const tabs = [
    {
      ...SETTINGS_TABS.APPEARANCE,
      content: (
        <AppearanceTab
          theme={uiState.theme}
          sidebarPosition={uiState.sidebarPosition}
          showStatusMessages={uiState.showStatusMessages}
          showStatusBar={uiState.showStatusBar}
          handleThemeChange={handleThemeChange}
          handleSidebarPositionChange={handleSidebarPositionChange}
          handleStatusMessagesChange={handleStatusMessagesChange}
          handleStatusBarChange={handleStatusBarChange}
        />
      )
    },
    {
      ...SETTINGS_TABS.PROXY,
      content: <ProxyTab />
    },
    {
      ...SETTINGS_TABS.DEBUG,
      content: <DebugTab />
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={SETTINGS_TITLE}
        icon={SETTINGS_ICON}
        tabs={tabs}
        defaultTab={SETTINGS_TABS.APPEARANCE.value}
      />
    </div>
  );
}
