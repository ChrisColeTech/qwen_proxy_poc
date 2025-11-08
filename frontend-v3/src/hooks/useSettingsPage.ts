import { useUIStore } from '@/stores/useUIStore';

export function useSettingsPage() {
  const { uiState, toggleTheme, toggleSidebarPosition, toggleShowStatusMessages } = useUIStore();

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

  return {
    uiState,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
  };
}
