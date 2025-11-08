/// <reference types="vite/client" />

interface ElectronAPI {
  qwen: {
    openLogin: () => Promise<void>;
    extractCredentials: () => Promise<{ token: string; cookies: string; expiresAt: number }>;
  };
  clipboard: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
  };
  app: {
    quit: () => void;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximize: (callback: () => void) => void;
    onUnmaximize: (callback: () => void) => void;
  };
  settings: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  history: {
    read: () => Promise<unknown>;
    add: (entry: unknown) => Promise<unknown>;
    clear: () => Promise<unknown>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
