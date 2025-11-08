import type { CredentialStatus } from '@/types/credentials.types';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:3002';

class CredentialsService {
  async getStatus(): Promise<CredentialStatus> {
    const response = await fetch(`${API_URL}/api/qwen/credentials`);
    if (response.ok) {
      const data = await response.json();
      // Transform backend format to frontend format
      return {
        valid: data.isValid || false,
        expiresAt: data.expiresAt ? data.expiresAt * 1000 : null, // Convert seconds to milliseconds
      };
    } else if (response.status === 404) {
      return { valid: false, expiresAt: null };
    }
    throw new Error('Failed to fetch credentials status');
  }

  async deleteCredentials(): Promise<void> {
    const response = await fetch(`${API_URL}/api/qwen/credentials`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Failed to delete credentials');
    }
  }

  getStatusInfo(status: CredentialStatus) {
    if (!status.expiresAt) {
      return {
        icon: XCircle,
        label: 'NOT LOGGED IN',
        variant: 'secondary' as const,
        color: 'credentials-status-inactive',
      };
    }

    const now = Date.now();
    const isExpired = status.expiresAt < now;

    if (isExpired) {
      return {
        icon: AlertCircle,
        label: 'EXPIRED',
        variant: 'destructive' as const,
        color: 'credentials-status-expired',
      };
    }

    return {
      icon: CheckCircle,
      label: 'LOGGED IN',
      variant: 'default' as const,
      color: 'credentials-status-valid',
    };
  }

  formatExpiration(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  getTimeRemaining(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return 'Less than 1 hour';
  }
}

export const credentialsService = new CredentialsService();
