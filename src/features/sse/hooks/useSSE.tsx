
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SSEMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseSSEOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const {
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        const message: SSEMessage = {
          type: event.type || 'message',
          data: eventData,
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    // Handle custom events
    const handleCustomEvent = (event: MessageEvent) => {
      try {
        const eventData = JSON.parse(event.data);
        const message: SSEMessage = {
          type: event.type,
          data: eventData,
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, message]);
        
        // Handle connection event to get connection ID
        if (event.type === 'connection' && eventData.connectionId) {
          setConnectionId(eventData.connectionId);
        }
      } catch (error) {
        console.error('Error parsing custom SSE event:', error);
      }
    };

    // Listen for custom events
    eventSource.addEventListener('connection', handleCustomEvent);
    eventSource.addEventListener('notification', handleCustomEvent);
    eventSource.addEventListener('ping', handleCustomEvent);

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setConnectionStatus('error');
      
      if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          connect();
        }, reconnectInterval);
      } else {
        setConnectionStatus('disconnected');
      }
    };
  }, [url, reconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    setConnectionId(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    messages,
    connectionStatus,
    connectionId,
    connect,
    disconnect,
    clearMessages,
  };
}
