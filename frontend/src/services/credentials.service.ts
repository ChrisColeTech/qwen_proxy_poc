import { apiService } from './api.service';
import type { CredentialStatus, QwenCredentials } from '@/types/credentials.types';

interface BackendCredentialStatus {
  hasCredentials: boolean;
  expiresAt: number | null;
  isValid: boolean;
  createdAt?: number;
  updatedAt?: number;
}

class CredentialsService {
  async getCredentialStatus(): Promise<CredentialStatus> {
    const response = await apiService.get<BackendCredentialStatus>('/api/qwen/credentials');
    return {
      hasCredentials: response.hasCredentials,
      isValid: response.isValid,
      expiresAt: response.expiresAt ? response.expiresAt * 1000 : undefined,
    };
  }

  async saveCredentials(credentials: QwenCredentials): Promise<{ success: boolean }> {
    // Backend expects expiresAt in seconds (Unix timestamp), but frontend uses milliseconds
    const backendCredentials = {
      ...credentials,
      expiresAt: Math.floor(credentials.expiresAt / 1000),
    };
    return apiService.post<{ success: boolean }>('/api/qwen/credentials', backendCredentials);
  }

  async deleteCredentials(): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>('/api/qwen/credentials');
  }
}

export const credentialsService = new CredentialsService();
