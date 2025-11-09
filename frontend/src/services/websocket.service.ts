import { io, Socket } from 'socket.io-client';
import type {
  ProxyStatusEvent,
  CredentialsUpdatedEvent,
  ProvidersUpdatedEvent,
  ModelsUpdatedEvent,
  LifecycleUpdateEvent,
  WebSocketConnectionStatus,
} from '@/types';

type EventCallback<T> = (data: T) => void;

interface WebSocketCallbacks {
  onProxyStatus?: EventCallback<ProxyStatusEvent>;
  onCredentialsUpdated?: EventCallback<CredentialsUpdatedEvent>;
  onProvidersUpdated?: EventCallback<ProvidersUpdatedEvent>;
  onModelsUpdated?: EventCallback<ModelsUpdatedEvent>;
  onLifecycleUpdate?: EventCallback<LifecycleUpdateEvent>;
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private status: WebSocketConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    // Service is initialized but not connected
  }

  connect(url: string = 'http://localhost:3002', callbacks: WebSocketCallbacks = {}): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to:', url);
    this.callbacks = callbacks;

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log('[WebSocket] Reconnection attempt:', attempt);
      this.reconnectAttempts = attempt;
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      this.updateStatus('disconnected');
    });

    // Business events
    this.socket.on('proxy:status', (data: ProxyStatusEvent) => {
      console.log('[WebSocket] proxy:status', data);
      this.callbacks.onProxyStatus?.(data);
    });

    this.socket.on('credentials:updated', (data: CredentialsUpdatedEvent) => {
      console.log('[WebSocket] credentials:updated', data);
      this.callbacks.onCredentialsUpdated?.(data);
    });

    this.socket.on('providers:updated', (data: ProvidersUpdatedEvent) => {
      console.log('[WebSocket] providers:updated', data);
      this.callbacks.onProvidersUpdated?.(data);
    });

    this.socket.on('models:updated', (data: ModelsUpdatedEvent) => {
      console.log('[WebSocket] models:updated', data);
      this.callbacks.onModelsUpdated?.(data);
    });

    this.socket.on('lifecycle:update', (data: LifecycleUpdateEvent) => {
      console.log('[WebSocket] lifecycle:update', data);
      this.callbacks.onLifecycleUpdate?.(data);
    });
  }

  private updateStatus(status: WebSocketConnectionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.updateStatus('disconnected');
    }
  }

  getStatus(): WebSocketConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
