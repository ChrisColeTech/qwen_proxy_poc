/**
 * UI Component Type Definitions
 * Contains all interfaces and types for UI components
 */

export type StatusType = 'idle' | 'checking' | 'ready' | 'error';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
}

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}
