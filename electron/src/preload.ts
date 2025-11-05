import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose Electron API to renderer process
 * Based on doc 48 - Renderer Process - IPC Service
 */
contextBridge.exposeInMainWorld('electronAPI', {
  qwen: {
    /**
     * Open Qwen login browser window
     * @returns {Promise<void>}
     */
    openLogin: async (): Promise<void> => {
      return await ipcRenderer.invoke('qwen:open-login');
    },

    /**
     * Extract Qwen credentials from browser session
     * @returns {Promise<{token: string, cookies: string, expiresAt: number}>}
     */
    extractCredentials: async (): Promise<{ token: string; cookies: string; expiresAt: number }> => {
      return await ipcRenderer.invoke('qwen:extract-credentials');
    },
  },

  clipboard: {
    /**
     * Read text from clipboard
     * @returns {Promise<string>}
     */
    readText: async (): Promise<string> => {
      return await ipcRenderer.invoke('clipboard:read');
    },

    /**
     * Write text to clipboard
     * @param {string} text - Text to write to clipboard
     * @returns {Promise<void>}
     */
    writeText: async (text: string): Promise<void> => {
      return await ipcRenderer.invoke('clipboard:write', text);
    },
  },

  app: {
    /**
     * Quit the application
     */
    quit: (): void => {
      ipcRenderer.send('app:quit');
    },
  },

  window: {
    /**
     * Minimize the window
     */
    minimize: (): void => {
      ipcRenderer.send('window:minimize');
    },

    /**
     * Maximize/restore the window
     */
    maximize: (): void => {
      ipcRenderer.send('window:maximize');
    },

    /**
     * Close the window
     */
    close: (): void => {
      ipcRenderer.send('window:close');
    },

    /**
     * Check if window is maximized
     * @returns {Promise<boolean>}
     */
    isMaximized: async (): Promise<boolean> => {
      return await ipcRenderer.invoke('window:is-maximized');
    },

    /**
     * Listen for maximize event
     * @param {Function} callback - Callback to invoke when window is maximized
     */
    onMaximize: (callback: () => void): void => {
      ipcRenderer.on('window:maximized', callback);
    },

    /**
     * Listen for unmaximize event
     * @param {Function} callback - Callback to invoke when window is unmaximized
     */
    onUnmaximize: (callback: () => void): void => {
      ipcRenderer.on('window:unmaximized', callback);
    },
  },

  history: {
    /**
     * Read path history
     * @returns {Promise<any>}
     */
    read: async (): Promise<any> => {
      return await ipcRenderer.invoke('history:read');
    },

    /**
     * Add path to history
     * @param {any} entry - History entry to add
     * @returns {Promise<any>}
     */
    add: async (entry: any): Promise<any> => {
      return await ipcRenderer.invoke('history:add', entry);
    },

    /**
     * Clear path history
     * @returns {Promise<any>}
     */
    clear: async (): Promise<any> => {
      return await ipcRenderer.invoke('history:clear');
    },
  },
});

console.log('[Preload] Electron API exposed to renderer');
