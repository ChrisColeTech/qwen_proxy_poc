import { useUIStore } from '@/stores/useUIStore';

export function useSettingsPage() {
  const { uiState, toggleTheme, toggleSidebarPosition, toggleShowStatusMessages, toggleShowStatusBar } = useUIStore();

  // Appearance handlers
  const handleThemeChange = (value: string) => {
    if (value) toggleTheme();
  };

  const handleSidebarPositionChange = (value: string) => {
    if (value) toggleSidebarPosition();
  };

  const handleStatusMessagesChange = (value: string) => {
    if (!value) return;
    const shouldShow = value === 'show';
    if (shouldShow !== uiState.showStatusMessages) {
      toggleShowStatusMessages();
    }
  };

  const handleStatusBarChange = (value: string) => {
    if (!value) return;
    const shouldShow = value === 'show';
    if (shouldShow !== uiState.showStatusBar) {
      toggleShowStatusBar();
    }
  };

  return {
    uiState,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
    handleStatusBarChange,
  };
}
