export interface QwenCredentials {
  token: string;
  cookies: string;
  expiresAt: number;
}

export interface CredentialStatus {
  hasCredentials: boolean;
  isValid: boolean;
  expiresAt?: number;
}
