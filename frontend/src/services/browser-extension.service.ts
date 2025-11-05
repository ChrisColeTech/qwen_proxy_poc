class BrowserExtensionService {
  async isExtensionInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);

      window.postMessage({ type: 'QWEN_PING' }, '*');

      const handler = (e: MessageEvent) => {
        if (e.data?.type === 'QWEN_PONG') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(true);
        }
      };

      window.addEventListener('message', handler);
    });
  }

  async openQwenLogin(): Promise<void> {
    window.postMessage({ type: 'QWEN_OPEN' }, '*');
  }

  openInstallInstructions(): void {
    // Modal is now shown by AuthenticationCard when extension is not installed
    // This method kept for compatibility but does nothing
  }
}

export const browserExtensionService = new BrowserExtensionService();
