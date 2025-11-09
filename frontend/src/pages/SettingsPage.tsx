import { TabCard } from '@/components/ui/tab-card';
import { useSettingsPage } from '@/hooks/useSettingsPage';
import {
  buildAppearanceContent,
  buildProxyContent,
  buildDebugContent,
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
      content: buildAppearanceContent({
        theme: uiState.theme,
        sidebarPosition: uiState.sidebarPosition,
        showStatusMessages: uiState.showStatusMessages,
        showStatusBar: uiState.showStatusBar,
        handleThemeChange,
        handleSidebarPositionChange,
        handleStatusMessagesChange,
        handleStatusBarChange,
      })
    },
    {
      ...SETTINGS_TABS.PROXY,
      content: buildProxyContent()
    },
    {
      ...SETTINGS_TABS.DEBUG,
      content: buildDebugContent()
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
