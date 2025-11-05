# Document 46: Global Error Handling Implementation Plan

**Created:** 2025-11-05
**Status:** Planning
**Purpose:** Implement comprehensive global error handling architecture for the frontend application

---

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | P0 | Pending | Error Types and Interfaces |
| Phase 2 | P0 | Pending | Error Store (Zustand) |
| Phase 3 | P0 | Pending | Error Service and Utilities |
| Phase 4 | P0 | Pending | Toast/Notification Service |
| Phase 5 | P0 | Pending | Circuit Breaker and Polling Coordinator |
| Phase 6 | P1 | Pending | Error Boundary Component |
| Phase 7 | P1 | Pending | Toast Notification UI Components |
| Phase 8 | P1 | Pending | Error Display Components |
| Phase 9 | P2 | Pending | Wire Error Handling to Existing Hooks |
| Phase 10 | P2 | Pending | Update API Service with Interceptors |
| Phase 11 | P2 | Pending | Add Error Boundaries to App Layout |
| Phase 12 | P2 | Pending | Migrate Polling Hooks to Coordinator |

---

## Project Structure

```
frontend/src/
├── types/
│   ├── error.types.ts                    ← NEW (Phase 1)
│   └── notification.types.ts             ← NEW (Phase 1)
│
├── stores/
│   ├── errorStore.ts                     ← NEW (Phase 2)
│   └── notificationStore.ts              ← NEW (Phase 2)
│
├── services/
│   ├── error.service.ts                  ← NEW (Phase 3)
│   ├── notification.service.ts           ← NEW (Phase 4)
│   └── api.service.ts                    ← MODIFIED (Phase 10)
│
├── utils/
│   ├── circuit-breaker.ts                ← NEW (Phase 5)
│   ├── polling-coordinator.ts            ← NEW (Phase 5)
│   └── error-handler.ts                  ← NEW (Phase 3)
│
├── components/
│   ├── error/
│   │   ├── ErrorBoundary.tsx             ← NEW (Phase 6)
│   │   ├── ErrorDisplay.tsx              ← NEW (Phase 8)
│   │   └── ErrorFallback.tsx             ← NEW (Phase 8)
│   │
│   └── notifications/
│       ├── Toast.tsx                     ← NEW (Phase 7)
│       ├── ToastContainer.tsx            ← NEW (Phase 7)
│       └── ToastProvider.tsx             ← NEW (Phase 7)
│
├── hooks/
│   ├── useErrorHandler.ts                ← NEW (Phase 3)
│   ├── useToast.ts                       ← NEW (Phase 4)
│   ├── usePolling.ts                     ← NEW (Phase 5)
│   ├── useCredentials.ts                 ← MODIFIED (Phase 9, 12)
│   ├── useProxyStatus.ts                 ← MODIFIED (Phase 12)
│   └── useStatistics.ts                  ← MODIFIED (Phase 12)
│
├── App.tsx                               ← MODIFIED (Phase 11)
└── main.tsx                              ← MODIFIED (Phase 11)
```

---

## Phase 1: Error Types and Interfaces (Foundation)

**Priority:** P0
**Goal:** Define TypeScript types and interfaces for error handling system

### Files to Create

#### `/frontend/src/types/error.types.ts`
```typescript
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

export interface AppError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: number;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  stack?: string;
  context?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
  retryable?: boolean;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}
```

#### `/frontend/src/types/notification.types.ts`
```typescript
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationOptions {
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Files Modified
None

### Integration Points
- Will be imported by all error-handling services and components

---

## Phase 2: Error Store (Foundation)

**Priority:** P0
**Goal:** Create centralized error state management using Zustand

### Files to Create

#### `/frontend/src/stores/errorStore.ts`
```typescript
import { create } from 'zustand';
import type { AppError } from '@/types/error.types';

interface ErrorStore {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  getErrorsByCategory: (category: string) => AppError[];
  hasErrors: () => boolean;
}

export const useErrorStore = create<ErrorStore>((set, get) => ({
  errors: [],

  addError: (error) =>
    set((state) => ({
      errors: [...state.errors, error],
    })),

  removeError: (id) =>
    set((state) => ({
      errors: state.errors.filter((err) => err.id !== id),
    })),

  clearErrors: () => set({ errors: [] }),

  getErrorsByCategory: (category) =>
    get().errors.filter((err) => err.category === category),

  hasErrors: () => get().errors.length > 0,
}));
```

#### `/frontend/src/stores/notificationStore.ts`
```typescript
import { create } from 'zustand';
import type { Toast } from '@/types/notification.types';

interface NotificationStore {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, toast],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));
```

### Files Modified
None

### Integration Points
- `package.json` - Ensure zustand is installed as dependency

---

## Phase 3: Error Service and Utilities (Foundation)

**Priority:** P0
**Goal:** Create error handling service with utility functions

### Files to Create

#### `/frontend/src/services/error.service.ts`
```typescript
import { useErrorStore } from '@/stores/errorStore';
import { notificationService } from './notification.service';
import type { AppError, ErrorCategory, ErrorSeverity, ErrorHandlerOptions } from '@/types/error.types';

class ErrorService {
  private static instance: ErrorService;

  private constructor() {}

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  handleError(error: unknown, options: ErrorHandlerOptions = {}): AppError {
    const appError = this.normalizeError(error);

    // Add to error store
    useErrorStore.getState().addError(appError);

    // Show toast notification
    if (options.showToast !== false) {
      notificationService.error(appError.message);
    }

    // Log to console in development
    if (options.logToConsole !== false && import.meta.env.DEV) {
      console.error('[ErrorService]', appError);
    }

    // TODO: Log to server for critical errors
    if (options.logToServer && appError.severity === 'critical') {
      this.logToServer(appError);
    }

    return appError;
  }

  private normalizeError(error: unknown): AppError {
    // Axios error
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Standard Error
    if (error instanceof Error) {
      return this.createAppError({
        message: error.message,
        stack: error.stack,
        category: 'client',
        severity: 'error',
      });
    }

    // Unknown error
    return this.createAppError({
      message: typeof error === 'string' ? error : 'An unknown error occurred',
      category: 'unknown',
      severity: 'error',
    });
  }

  private handleAxiosError(error: any): AppError {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message || error.message;

    let category: ErrorCategory = 'network';
    let severity: ErrorSeverity = 'error';

    if (statusCode === 401) {
      category = 'authentication';
    } else if (statusCode === 403) {
      category = 'authorization';
    } else if (statusCode >= 400 && statusCode < 500) {
      category = 'client';
    } else if (statusCode >= 500) {
      category = 'server';
      severity = 'critical';
    }

    return this.createAppError({
      message,
      category,
      severity,
      statusCode,
      code: error.code,
      details: error.response?.data,
    });
  }

  private createAppError(params: Partial<AppError>): AppError {
    return {
      id: crypto.randomUUID(),
      message: params.message || 'An error occurred',
      category: params.category || 'unknown',
      severity: params.severity || 'error',
      timestamp: Date.now(),
      code: params.code,
      statusCode: params.statusCode,
      details: params.details,
      stack: params.stack,
      context: params.context,
    };
  }

  private isAxiosError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      (error as any).isAxiosError === true
    );
  }

  private logToServer(error: AppError): void {
    // TODO: Implement server-side error logging
    console.log('[ErrorService] Would log to server:', error);
  }
}

export const errorService = ErrorService.getInstance();
```

#### `/frontend/src/utils/error-handler.ts`
```typescript
import { errorService } from '@/services/error.service';
import type { ErrorHandlerOptions } from '@/types/error.types';

export function handleError(error: unknown, options?: ErrorHandlerOptions) {
  return errorService.handleError(error, options);
}

export function createErrorHandler(defaultOptions?: ErrorHandlerOptions) {
  return (error: unknown, options?: ErrorHandlerOptions) => {
    return errorService.handleError(error, { ...defaultOptions, ...options });
  };
}
```

#### `/frontend/src/hooks/useErrorHandler.ts`
```typescript
import { useCallback } from 'react';
import { errorService } from '@/services/error.service';
import type { ErrorHandlerOptions } from '@/types/error.types';

export function useErrorHandler(defaultOptions?: ErrorHandlerOptions) {
  const handleError = useCallback(
    (error: unknown, options?: ErrorHandlerOptions) => {
      return errorService.handleError(error, { ...defaultOptions, ...options });
    },
    [defaultOptions]
  );

  return handleError;
}
```

### Files Modified
None

### Integration Points
- `notificationService` (will be created in Phase 4)
- `errorStore` (created in Phase 2)
- `error.types.ts` (created in Phase 1)

---

## Phase 4: Toast/Notification Service (Foundation)

**Priority:** P0
**Goal:** Create notification service for user feedback

### Files to Create

#### `/frontend/src/services/notification.service.ts`
```typescript
import { useNotificationStore } from '@/stores/notificationStore';
import type { Toast, ToastType, NotificationOptions } from '@/types/notification.types';

class NotificationService {
  private static instance: NotificationService;
  private defaultDuration = 5000;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private createToast(
    type: ToastType,
    message: string,
    description?: string,
    options?: NotificationOptions
  ): Toast {
    return {
      id: crypto.randomUUID(),
      type,
      message,
      description,
      duration: options?.duration ?? this.defaultDuration,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    };
  }

  success(message: string, description?: string, options?: NotificationOptions): void {
    const toast = this.createToast('success', message, description, options);
    useNotificationStore.getState().addToast(toast);
  }

  error(message: string, description?: string, options?: NotificationOptions): void {
    const toast = this.createToast('error', message, description, options);
    useNotificationStore.getState().addToast(toast);
  }

  warning(message: string, description?: string, options?: NotificationOptions): void {
    const toast = this.createToast('warning', message, description, options);
    useNotificationStore.getState().addToast(toast);
  }

  info(message: string, description?: string, options?: NotificationOptions): void {
    const toast = this.createToast('info', message, description, options);
    useNotificationStore.getState().addToast(toast);
  }

  dismiss(id: string): void {
    useNotificationStore.getState().removeToast(id);
  }

  dismissAll(): void {
    useNotificationStore.getState().clearToasts();
  }
}

export const notificationService = NotificationService.getInstance();
```

#### `/frontend/src/hooks/useToast.ts`
```typescript
import { useCallback } from 'react';
import { notificationService } from '@/services/notification.service';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationOptions } from '@/types/notification.types';

export function useToast() {
  const toasts = useNotificationStore((state) => state.toasts);

  const success = useCallback(
    (message: string, description?: string, options?: NotificationOptions) => {
      notificationService.success(message, description, options);
    },
    []
  );

  const error = useCallback(
    (message: string, description?: string, options?: NotificationOptions) => {
      notificationService.error(message, description, options);
    },
    []
  );

  const warning = useCallback(
    (message: string, description?: string, options?: NotificationOptions) => {
      notificationService.warning(message, description, options);
    },
    []
  );

  const info = useCallback(
    (message: string, description?: string, options?: NotificationOptions) => {
      notificationService.info(message, description, options);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    notificationService.dismiss(id);
  }, []);

  const dismissAll = useCallback(() => {
    notificationService.dismissAll();
  }, []);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  };
}
```

### Files Modified
None

### Integration Points
- `notificationStore` (created in Phase 2)
- `notification.types.ts` (created in Phase 1)

---

## Phase 5: Circuit Breaker and Polling Coordinator (Foundation)

**Priority:** P0
**Goal:** Implement circuit breaker pattern and coordinated polling with exponential backoff

### Files to Create

#### `/frontend/src/utils/circuit-breaker.ts`
```typescript
import type { CircuitBreakerState } from '@/types/error.types';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxAttempts: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
  };

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      if (Date.now() - this.state.lastFailure > this.config.resetTimeout) {
        this.state.state = 'half-open';
        this.state.failures = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.failures = 0;
    this.state.state = 'closed';
  }

  private onFailure(): void {
    this.state.failures += 1;
    this.state.lastFailure = Date.now();

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'open';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    };
  }
}
```

#### `/frontend/src/utils/polling-coordinator.ts`
```typescript
import { CircuitBreaker } from './circuit-breaker';

export interface PollingConfig {
  interval: number;
  maxInterval?: number;
  backoffMultiplier?: number;
  stopOnSuccess?: boolean;
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

export class PollingCoordinator {
  private intervalId: number | null = null;
  private currentInterval: number;
  private circuitBreaker: CircuitBreaker | null = null;
  private isPaused = false;

  constructor(private config: PollingConfig) {
    this.currentInterval = config.interval;

    if (config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker({
        failureThreshold: config.circuitBreaker.failureThreshold,
        resetTimeout: config.circuitBreaker.resetTimeout,
        halfOpenMaxAttempts: 1,
      });
    }
  }

  start(callback: () => Promise<void>): void {
    if (this.intervalId !== null) {
      return; // Already running
    }

    const poll = async () => {
      if (this.isPaused) {
        return;
      }

      try {
        if (this.circuitBreaker) {
          await this.circuitBreaker.execute(callback);
        } else {
          await callback();
        }

        // Success - reset interval
        this.currentInterval = this.config.interval;

        // Stop polling if configured
        if (this.config.stopOnSuccess) {
          this.stop();
        }
      } catch (error) {
        console.error('[PollingCoordinator] Poll failed:', error);

        // Apply exponential backoff
        if (this.config.backoffMultiplier && this.config.maxInterval) {
          this.currentInterval = Math.min(
            this.currentInterval * this.config.backoffMultiplier,
            this.config.maxInterval
          );
        }
      }
    };

    // Initial poll
    poll();

    // Start interval
    this.intervalId = window.setInterval(poll, this.currentInterval);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentInterval = this.config.interval;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  reset(): void {
    this.stop();
    this.circuitBreaker?.reset();
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
```

#### `/frontend/src/hooks/usePolling.ts`
```typescript
import { useEffect, useRef } from 'react';
import { PollingCoordinator, type PollingConfig } from '@/utils/polling-coordinator';

export function usePolling(
  callback: () => Promise<void>,
  config: PollingConfig,
  enabled = true
) {
  const coordinatorRef = useRef<PollingCoordinator | null>(null);

  useEffect(() => {
    if (!enabled) {
      coordinatorRef.current?.stop();
      return;
    }

    // Create coordinator if it doesn't exist
    if (!coordinatorRef.current) {
      coordinatorRef.current = new PollingCoordinator(config);
    }

    // Start polling
    coordinatorRef.current.start(callback);

    // Cleanup
    return () => {
      coordinatorRef.current?.stop();
    };
  }, [callback, config, enabled]);

  return {
    pause: () => coordinatorRef.current?.pause(),
    resume: () => coordinatorRef.current?.resume(),
    reset: () => coordinatorRef.current?.reset(),
    isRunning: () => coordinatorRef.current?.isRunning() ?? false,
  };
}
```

### Files Modified
None

### Integration Points
- `error.types.ts` (created in Phase 1)

---

## Phase 6: Error Boundary Component (Component Layer)

**Priority:** P1
**Goal:** Create React Error Boundary for catching component errors

### Files to Create

#### `/frontend/src/components/error/ErrorBoundary.tsx`
```typescript
import React, { Component, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { errorService } from '@/services/error.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to error service
    errorService.handleError(error, {
      showToast: false, // Don't show toast for boundary errors
      logToConsole: true,
      logToServer: true,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
```

#### `/frontend/src/components/error/ErrorFallback.tsx`
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try refreshing the page.
          </p>

          {isDevelopment && error && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs mt-2 overflow-x-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={resetError} variant="default" className="flex-1">
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `/frontend/src/components/error/ErrorDisplay.tsx`
```typescript
import { useErrorStore } from '@/stores/errorStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppError, ErrorSeverity } from '@/types/error.types';

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  critical: XCircle,
};

const severityVariants = {
  info: 'default',
  warning: 'default',
  error: 'destructive',
  critical: 'destructive',
} as const;

export function ErrorDisplay() {
  const errors = useErrorStore((state) => state.errors);
  const removeError = useErrorStore((state) => state.removeError);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 max-w-md z-50">
      {errors.map((error) => (
        <ErrorItem
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </div>
  );
}

interface ErrorItemProps {
  error: AppError;
  onDismiss: () => void;
}

function ErrorItem({ error, onDismiss }: ErrorItemProps) {
  const Icon = severityIcons[error.severity];
  const variant = severityVariants[error.severity];

  return (
    <Alert variant={variant} className="pr-12">
      <Icon className="h-4 w-4" />
      <AlertTitle className="capitalize">{error.category}</AlertTitle>
      <AlertDescription className="text-sm">{error.message}</AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={onDismiss}
      >
        ×
      </Button>
    </Alert>
  );
}
```

### Files Modified
None

### Integration Points
- `errorService` (created in Phase 3)
- `errorStore` (created in Phase 2)
- `error.types.ts` (created in Phase 1)
- UI components (`Button`, `Card`, `Alert` - existing)

---

## Phase 7: Toast Notification UI Components (Component Layer)

**Priority:** P1
**Goal:** Create toast notification UI components

### Files to Create

#### `/frontend/src/components/notifications/Toast.tsx`
```typescript
import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast as ToastType } from '@/types/notification.types';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
};

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const Icon = icons[toast.type];

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles[toast.type]} animate-in slide-in-from-right`}
      role="alert"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.message}</p>
        {toast.description && (
          <p className="text-sm mt-1 opacity-90">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-sm font-medium underline mt-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {toast.dismissible && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

#### `/frontend/src/components/notifications/ToastContainer.tsx`
```typescript
import { Toast } from './Toast';
import { useNotificationStore } from '@/stores/notificationStore';

export function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </div>
  );
}
```

#### `/frontend/src/components/notifications/ToastProvider.tsx`
```typescript
import { ReactNode } from 'react';
import { ToastContainer } from './ToastContainer';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
```

### Files Modified
None

### Integration Points
- `notificationStore` (created in Phase 2)
- `notification.types.ts` (created in Phase 1)
- Tailwind CSS for styling

---

## Phase 8: Error Display Components (Component Layer)

**Priority:** P1
**Goal:** Created in Phase 6 (ErrorDisplay.tsx)

This phase is completed as part of Phase 6.

---

## Phase 9: Wire Error Handling to Existing Hooks (Integration)

**Priority:** P2
**Goal:** Update existing hooks to use global error handling

### Files to Modify

#### `/frontend/src/hooks/useCredentials.ts`
**Changes:**
1. Import `useErrorHandler` hook
2. Replace local error handling with global handler
3. Keep local error state for component-specific display
4. Use toast notifications for user feedback

```typescript
import { useErrorHandler } from './useErrorHandler';
import { useToast } from './useToast';

export function useCredentials() {
  const handleError = useErrorHandler({ showToast: true });
  const { error: showErrorToast } = useToast();

  // ... existing code ...

  const loadStatus = async () => {
    try {
      const result = await credentialsService.getCredentialStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      handleError(err); // Global error handling
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // ... rest of the code ...
}
```

#### `/frontend/src/hooks/useProxyStatus.ts`
**Changes:**
1. Import and use global error handler
2. Add toast notifications

#### `/frontend/src/hooks/useProxyControl.ts`
**Changes:**
1. Import and use global error handler
2. Add success/error toast notifications

#### `/frontend/src/hooks/useStatistics.ts`
**Changes:**
1. Import and use global error handler
2. Silent error handling (no toast)

### Integration Points
- `useErrorHandler` (created in Phase 3)
- `useToast` (created in Phase 4)

---

## Phase 10: Update API Service with Interceptors (Integration)

**Priority:** P2
**Goal:** Add axios interceptors for global error handling

### Files to Modify

#### `/frontend/src/services/api.service.ts`
**Changes:**
1. Add response interceptor for error handling
2. Add request interceptor for auth/logging
3. Integrate with errorService

```typescript
import { errorService } from './error.service';
import { notificationService } from './notification.service';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Log request in development
        if (import.meta.env.DEV) {
          console.log('[API Request]', config.method?.toUpperCase(), config.url);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Handle global errors
        errorService.handleError(error, {
          showToast: true,
          logToConsole: true,
        });

        return Promise.reject(error);
      }
    );
  }

  // ... existing methods ...
}
```

### Integration Points
- `errorService` (created in Phase 3)
- `notificationService` (created in Phase 4)

---

## Phase 11: Add Error Boundaries to App Layout (Integration)

**Priority:** P2
**Goal:** Wrap application with error boundaries and toast provider

### Files to Modify

#### `/frontend/src/App.tsx`
**Changes:**
1. Wrap app with ErrorBoundary
2. Wrap app with ToastProvider

```typescript
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ToastProvider } from '@/components/notifications/ToastProvider';

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {/* Existing app content */}
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

#### `/frontend/src/main.tsx`
**Changes:**
1. Optionally add top-level error boundary for catastrophic errors

### Integration Points
- `ErrorBoundary` (created in Phase 6)
- `ToastProvider` (created in Phase 7)

---

## Phase 12: Migrate Polling Hooks to Coordinator (Integration)

**Priority:** P2
**Goal:** Update polling hooks to use PollingCoordinator with circuit breaker

### Files to Modify

#### `/frontend/src/hooks/useCredentials.ts`
**Changes:**
1. Replace manual polling with `usePolling` hook
2. Configure circuit breaker
3. Add exponential backoff

```typescript
import { usePolling } from './usePolling';

export function useCredentials() {
  // ... existing state ...

  // Replace manual polling
  usePolling(
    loadStatus,
    {
      interval: 5000,
      maxInterval: 30000,
      backoffMultiplier: 1.5,
      stopOnSuccess: true, // Stop when valid credentials found
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 60000,
      },
    },
    !status.hasCredentials || !status.isValid // Only poll when needed
  );

  // ... rest of the code ...
}
```

#### `/frontend/src/hooks/useProxyStatus.ts`
**Changes:**
1. Use coordinated polling with circuit breaker

#### `/frontend/src/hooks/useStatistics.ts`
**Changes:**
1. Use coordinated polling with circuit breaker

### Integration Points
- `usePolling` (created in Phase 5)
- `PollingCoordinator` (created in Phase 5)
- `CircuitBreaker` (created in Phase 5)

---

## Validation Criteria

### Phase 1-5 (Foundation)
- ✅ All types properly defined with no TypeScript errors
- ✅ Stores working with zustand
- ✅ Error service handles all error types correctly
- ✅ Notification service creates toasts
- ✅ Circuit breaker opens after threshold failures
- ✅ Polling coordinator applies exponential backoff

### Phase 6-8 (Components)
- ✅ Error boundary catches component errors
- ✅ Toast notifications display and auto-dismiss
- ✅ Error displays show with correct severity styling
- ✅ Components are accessible (ARIA labels)

### Phase 9-12 (Integration)
- ✅ All hooks use global error handler
- ✅ API interceptors catch all network errors
- ✅ Toast notifications show for user actions
- ✅ Polling stops when credentials valid
- ✅ Circuit breaker prevents excessive failed requests
- ✅ No console error spam

---

## Testing Plan

### Unit Tests
- Error service normalization functions
- Circuit breaker state transitions
- Polling coordinator backoff logic
- Toast auto-dismiss timers

### Integration Tests
- Error boundary with component errors
- API interceptor with failed requests
- Polling coordinator with failing endpoints
- Circuit breaker opening and half-open states

### Manual Testing
- Trigger network errors (offline mode)
- Trigger validation errors (invalid input)
- Trigger auth errors (401/403)
- Verify toast notifications appear
- Verify polling stops on success
- Verify circuit breaker opens after failures

---

## Dependencies

### New Dependencies
None - all functionality uses existing dependencies (zustand, axios, react)

### Existing Dependencies
- `zustand` - State management
- `axios` - HTTP client
- `react` - UI framework
- `lucide-react` - Icons

---

## Migration Notes

### Breaking Changes
None - this is purely additive functionality

### Backward Compatibility
All existing error handling will continue to work. This adds global error handling on top of existing local error handling.

### Rollout Strategy
1. Implement foundation phases (1-5) first
2. Test thoroughly in development
3. Implement component phases (6-8)
4. Integrate incrementally (phases 9-12)
5. Monitor error logs after deployment

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Next Review:** After Phase 5 completion
