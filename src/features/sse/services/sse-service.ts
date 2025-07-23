
import { randomUUID } from "crypto";
import type { SSEConnection, SSEEvent, SSEClientFilter, SSEManagerConfig } from "../types";
import { createErrorHandler } from "@/utils/error-handlers";

const handleError = createErrorHandler("SSEService");

export class SSEService {
  private connections = new Map<string, SSEConnection>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private config: SSEManagerConfig;

  constructor(config: Partial<SSEManagerConfig> = {}) {
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
      connectionTimeout: config.connectionTimeout || 60000, // 60 seconds
    };
    this.startHeartbeat();
  }

  /**
   * Create a new SSE connection
   */
  createConnection(userId?: string, sessionId?: string): { stream: ReadableStream; connectionId: string } {
    const connectionId = randomUUID();
    
    const stream = new ReadableStream({
      start: (controller) => {
        const connection: SSEConnection = {
          id: connectionId,
          userId,
          sessionId,
          controller,
          lastPing: Date.now(),
        };

        this.connections.set(connectionId, connection);
        
        // Send initial connection event
        this.sendToConnection(connectionId, {
          type: "connection",
          data: { message: "Connected", connectionId },
        });

        console.log(`SSE connection established: ${connectionId}, userId: ${userId}, sessionId: ${sessionId}`);
      },
      cancel: () => {
        this.removeConnection(connectionId);
      },
    });

    return { stream, connectionId };
  }

  /**
   * Send event to a specific connection
   */
  sendToConnection(connectionId: string, event: SSEEvent): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.warn(`SSE connection not found: ${connectionId}`);
      return false;
    }

    try {
      const eventData = this.formatSSEEvent(event);
      connection.controller.enqueue(new TextEncoder().encode(eventData));
      connection.lastPing = Date.now();
      return true;
    } catch (error) {
      handleError(`send event to connection ${connectionId}`, error);
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Send event to multiple connections based on filter
   */
  sendToClients(filter: SSEClientFilter, event: SSEEvent): number {
    let sentCount = 0;
    
    for (const [connectionId, connection] of this.connections) {
      let shouldSend = true;

      if (filter.connectionId && connection.id !== filter.connectionId) {
        shouldSend = false;
      }
      if (filter.userId && connection.userId !== filter.userId) {
        shouldSend = false;
      }
      if (filter.sessionId && connection.sessionId !== filter.sessionId) {
        shouldSend = false;
      }

      if (shouldSend && this.sendToConnection(connectionId, event)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Broadcast event to all connections
   */
  broadcast(event: SSEEvent): number {
    return this.sendToClients({}, event);
  }

  /**
   * Send event to all connections for a specific user
   */
  sendToUser(userId: string, event: SSEEvent): number {
    return this.sendToClients({ userId }, event);
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        connection.controller.close();
      } catch (error) {
        // Connection might already be closed
      }
      this.connections.delete(connectionId);
      console.log(`SSE connection removed: ${connectionId}`);
    }
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get connections for a user
   */
  getUserConnections(userId: string): SSEConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.userId === userId);
  }

  /**
   * Format SSE event according to SSE protocol
   */
  private formatSSEEvent(event: SSEEvent): string {
    let formatted = "";
    
    if (event.id) {
      formatted += `id: ${event.id}\n`;
    }
    
    formatted += `event: ${event.type}\n`;
    formatted += `data: ${JSON.stringify(event.data)}\n\n`;
    
    return formatted;
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const toRemove: string[] = [];

      for (const [connectionId, connection] of this.connections) {
        // Check if connection is stale
        if (now - connection.lastPing > this.config.connectionTimeout) {
          toRemove.push(connectionId);
          continue;
        }

        // Send ping
        const pingSuccess = this.sendToConnection(connectionId, {
          type: "ping",
          data: { timestamp: now },
        });

        if (!pingSuccess) {
          toRemove.push(connectionId);
        }
      }

      // Clean up stale connections
      toRemove.forEach(connectionId => this.removeConnection(connectionId));
      
      if (toRemove.length > 0) {
        console.log(`Cleaned up ${toRemove.length} stale SSE connections`);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Cleanup all connections and stop heartbeat
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const connectionId of this.connections.keys()) {
      this.removeConnection(connectionId);
    }
  }
}

// Global SSE service instance
export const sseService = new SSEService();
