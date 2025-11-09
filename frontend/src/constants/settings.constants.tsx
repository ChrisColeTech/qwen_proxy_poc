import { Settings } from 'lucide-react';

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
