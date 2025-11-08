// Types for credential management matching /api/qwen/credentials endpoints

export interface QwenCredentials {
  hasCredentials: boolean;
  expiresAt: number | null;
  isValid: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SetCredentialsRequest {
  token: string;
  cookies: string;
  expiresAt: number;
}

export interface CredentialStatus {
  valid: boolean;
  expiresAt: number | null;
}
