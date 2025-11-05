# Phase 7: Credentials Service

**Priority:** P1 (Core Functionality)
**Dependencies:** Phase 3, Phase 4
**Blocks:** Phase 9

## Files to Create

```
frontend/src/services/
└── credentials.service.ts    # Hybrid credentials service
```

## Content

**frontend/src/services/credentials.service.ts**
```typescript
import { apiService } from './api.service';
import { electronIPCService } from './electron-ipc.service';
import type { QwenCredentials, CredentialStatus } from '@/types';

class CredentialsService {
  // Use Electron IPC to open login browser (Electron only)
  async openLogin(): Promise<void> {
    if (!electronIPCService.isAvailable) {
      throw new Error('Electron API not available. This feature requires the desktop app.');
    }
    await electronIPCService.openQwenLogin();
  }

  // Use Electron IPC to extract credentials from browser session (Electron only)
  async extractCredentials(): Promise<QwenCredentials> {
    if (!electronIPCService.isAvailable) {
      throw new Error('Electron API not available. This feature requires the desktop app.');
    }
    return await electronIPCService.extractQwenCredentials();
  }

  // Use HTTP API to save credentials to backend
  async saveCredentials(credentials: QwenCredentials): Promise<void> {
    const result = await apiService.saveCredentials(credentials);
    if (!result.success) {
      throw new Error(result.error || 'Failed to save credentials');
    }
  }

  // Use HTTP API to get stored credentials
  async getStoredCredentials(): Promise<QwenCredentials | null> {
    return await apiService.getCredentials();
  }

  // Use HTTP API to delete credentials
  async deleteCredentials(): Promise<void> {
    const result = await apiService.deleteCredentials();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete credentials');
    }
  }

  // Check if credentials exist and are valid
  async getCredentialStatus(): Promise<CredentialStatus> {
    try {
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        return { hasCredentials: false, isValid: false };
      }

      const isValid = credentials.expiresAt > Date.now();
      return {
        hasCredentials: true,
        isValid,
        expiresAt: credentials.expiresAt,
      };
    } catch (err) {
      console.error('Failed to get credential status:', err);
      return { hasCredentials: false, isValid: false };
    }
  }
}

export const credentialsService = new CredentialsService();
```

## Files to Modify

None

## Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/services/electron-ipc.service.ts` (Phase 4)
- `frontend/src/types/credentials.types.ts` (Phase 1)

## Structure After Phase 7

```
frontend/src/
├── services/
│   ├── api.service.ts           # ✅ From Phase 3
│   ├── electron-ipc.service.ts  # ✅ From Phase 4
│   └── credentials.service.ts   # 🆕 New
```

## Validation

- [ ] Service gracefully handles non-Electron environment
- [ ] Can save/retrieve credentials via HTTP
- [ ] Status check works correctly
- [ ] Error messages are clear
