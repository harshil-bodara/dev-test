
export interface SSEConnection {
  id: string;
  userId?: string;
  sessionId?: string;
  controller: ReadableStreamDefaultController;
  lastPing: number;
}

export interface SSEEvent {
  type: string;
  data: any;
  id?: string;
}

export interface SSEClientFilter {
  userId?: string;
  sessionId?: string;
  connectionId?: string;
}

export interface SSEManagerConfig {
  heartbeatInterval: number;
  connectionTimeout: number;
}
