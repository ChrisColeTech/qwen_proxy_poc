// Types for CredentialsPage and related components

export interface CredentialStatus {
  valid: boolean;
  expiresAt: number | null;
}

export interface StatusInfo {
  icon: any;
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
  color: string;
}
