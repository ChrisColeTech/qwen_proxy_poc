# Phase 4: Electron IPC Service Layer

**Priority:** P0 (Foundation)
**Dependencies:** Phase 1
**Blocks:** Phase 7, Phase 9

## Files to Create

```
frontend/src/services/
└── electron-ipc.service.ts    # Electron IPC wrapper
```

## Content

**frontend/src/services/electron-ipc.service.ts**
```typescript
import type { QwenCredentials } from '@/types';

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

  // Window controls
  minimizeWindow(): void {
    this.api.window.minimize();
  }

  maximizeWindow(): void {
    this.api.window.maximize();
  }

  closeWindow(): void {
    this.api.window.close();
  }

  // Clipboard operations
  async copyToClipboard(text: string): Promise<void> {
    await this.api.clipboard.writeText(text);
  }

  async readFromClipboard(): Promise<string> {
    return await this.api.clipboard.readText();
  }

  // App lifecycle
  quitApp(): void {
    this.api.app.quit();
  }

  // Qwen authentication (to be implemented in Phase 17)
  async openQwenLogin(): Promise<void> {
    // Will be implemented when Electron handlers are added
    throw new Error('Not implemented yet');
  }

  async extractQwenCredentials(): Promise<QwenCredentials> {
    // Will be implemented when Electron handlers are added
    throw new Error('Not implemented yet');
  }
}

export const electronIPCService = new ElectronIPCService();
```

## Files to Modify

- `frontend/src/types/electron.types.ts` - Add Qwen authentication methods to ElectronAPI interface (Phase 17)

## Integration Points

- `frontend/src/types/electron.types.ts` (existing)
- `window.electronAPI` from preload script

## Structure After Phase 4

```
frontend/src/
├── services/
│   ├── api.service.ts           # ✅ From Phase 3
│   └── electron-ipc.service.ts  # 🆕 New
├── types/
│   └── ...                      # ✅ From Phase 1
```

## Validation

- [ ] Service detects Electron environment correctly
- [ ] Window controls work in Electron
- [ ] Clipboard operations work in Electron
- [ ] Graceful degradation in browser (throws error)
