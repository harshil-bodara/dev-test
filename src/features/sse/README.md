
# Server-Sent Events (SSE) Feature

This feature provides a reusable, abstracted Server-Sent Events layer for real-time, server-to-client notifications.

## Features

- ✅ Centralized SSE connection management
- ✅ Named events with JSON payloads
- ✅ User-specific and broadcast messaging
- ✅ Automatic heartbeat/ping to keep connections alive
- ✅ Proper connection cleanup and error handling
- ✅ React hooks for client-side integration
- ✅ Backend utility functions for easy integration

## Architecture

### Server Components

- **SSEService**: Core service managing connections and event dispatching
- **API Routes**: 
  - `GET /api/sse` - Establish SSE connection
  - `POST /api/sse/send` - Send test messages
- **Types**: TypeScript interfaces for type safety

### Client Components

- **useSSE Hook**: React hook for SSE connections
- **SSETestComponent**: UI component for testing SSE functionality

## Usage

### Backend Integration

```typescript
import { sseService, notifyUser, notifyAll } from "@/features/sse";

// Send notification to specific user
notifyUser("user123", "Your order has been processed!", "notification");

// Broadcast to all connected clients
notifyAll("System maintenance in 5 minutes", "alert");

// Send custom event
sseService.sendToUser("user123", {
  type: "order_update",
  data: { orderId: "123", status: "shipped" }
});
```

### Client Integration

```tsx
import { useSSE } from "@/features/sse";

function MyComponent() {
  const { messages, connectionStatus, connectionId } = useSSE('/api/sse');
  
  return (
    <div>
      <p>Status: {connectionStatus}</p>
      {messages.map((msg, i) => (
        <div key={i}>
          <strong>{msg.type}:</strong> {JSON.stringify(msg.data)}
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### SSEService Methods

- `createConnection(userId?, sessionId?)` - Create new SSE connection
- `sendToConnection(connectionId, event)` - Send to specific connection
- `sendToUser(userId, event)` - Send to all user connections
- `broadcast(event)` - Send to all connections
- `getConnectionCount()` - Get total connection count

### Utility Functions

- `notifyUser(userId, message, type?, data?)` - Send notification to user
- `notifyAll(message, type?, data?)` - Broadcast notification
- `sendUpdate(userId, updateType, payload)` - Send update notification
- `sendAlert(userId, message, severity?)` - Send alert notification

## Testing

Visit `/sse-test` to access the test interface where you can:
- Monitor connection status
- Send test messages
- View received events in real-time

## Configuration

The SSE service accepts configuration options:

```typescript
const sseService = new SSEService({
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 60000, // 60 seconds
});
```

## Error Handling

- Automatic reconnection with exponential backoff
- Connection cleanup on errors or disconnects
- Comprehensive error logging
- Graceful handling of malformed messages

## Security Considerations

- User authentication through Next.js sessions
- Connection filtering by user ID
- Rate limiting (can be added via middleware)
- CORS headers configured for cross-origin requests
