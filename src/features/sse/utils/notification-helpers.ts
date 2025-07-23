
import { sseService } from "../services/sse-service";
import type { SSEEvent } from "../types";

/**
 * Send notification to a specific user
 */
export function notifyUser(userId: string, message: string, type: string = 'notification', data?: any) {
  const event: SSEEvent = {
    type,
    data: {
      message,
      timestamp: new Date().toISOString(),
      ...data,
    },
  };

  return sseService.sendToUser(userId, event);
}

/**
 * Send notification to all connected clients
 */
export function notifyAll(message: string, type: string = 'notification', data?: any) {
  const event: SSEEvent = {
    type,
    data: {
      message,
      timestamp: new Date().toISOString(),
      ...data,
    },
  };

  return sseService.broadcast(event);
}

/**
 * Send custom event to specific connection
 */
export function sendCustomEvent(connectionId: string, type: string, data: any) {
  return sseService.sendToConnection(connectionId, { type, data });
}

/**
 * Send real-time update notification
 */
export function sendUpdate(userId: string, updateType: string, payload: any) {
  return notifyUser(userId, `Update: ${updateType}`, 'update', {
    updateType,
    payload,
  });
}

/**
 * Send alert notification
 */
export function sendAlert(userId: string, alertMessage: string, severity: 'info' | 'warning' | 'error' = 'info') {
  return notifyUser(userId, alertMessage, 'alert', {
    severity,
  });
}
