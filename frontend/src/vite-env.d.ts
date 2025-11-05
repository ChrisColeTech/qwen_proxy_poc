/// <reference types="vite/client" />

import type { QwenCredentials } from './types/credentials.types';

interface ElectronAPI {
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximize: (callback: () => void) => void;
    onUnmaximize: (callback: () => void) => void;
  };
  qwen: {
    openLogin: () => Promise<void>;
    extractCredentials: () => Promise<QwenCredentials>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
