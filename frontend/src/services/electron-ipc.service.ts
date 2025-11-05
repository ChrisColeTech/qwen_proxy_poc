import type { QwenCredentials } from '@/types/credentials.types';

class ElectronIPCService {
  private get api() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI;
  }

  get isAvailable(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  async openQwenLogin(): Promise<void> {
    await this.api.qwen.openLogin();
  }

  async extractQwenCredentials(): Promise<QwenCredentials> {
    return await this.api.qwen.extractCredentials();
  }
}

export const electronIPCService = new ElectronIPCService();
