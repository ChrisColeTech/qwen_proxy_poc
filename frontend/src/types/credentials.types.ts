// Types for credential management matching /api/qwen/credentials endpoints

export interface QwenCredentials {
  token: string;
  cookies: string;
  expiresAt: number | null;
  isExpired: boolean;
}

export interface SetCredentialsRequest {
  token: string;
  cookies: string;
  expiresAt: number;
}
