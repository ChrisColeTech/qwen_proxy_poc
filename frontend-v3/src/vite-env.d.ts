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
  history: {
    read: () => Promise<any>;
    add: (entry: any) => Promise<any>;
    clear: () => Promise<any>;
  };
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
