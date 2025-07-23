
"use client";

import { useState } from "react";
import { useSSE } from "../hooks/useSSE";

export function SSETestComponent() {
  const { messages, connectionStatus, connectionId, clearMessages } = useSSE('/api/sse');
  const [testMessage, setTestMessage] = useState('');
  const [eventType, setEventType] = useState('notification');

  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;

    try {
      const response = await fetch('/api/sse/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: eventType,
          data: {
            message: testMessage,
            timestamp: new Date().toISOString(),
          },
          target: {
            type: 'broadcast',
          },
        }),
      });

      const result = await response.json();
      console.log('Message sent:', result);
      setTestMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">SSE Test Interface</h2>
        
        {/* Connection Status */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Status: <span className={`font-semibold ${getStatusColor()}`}>{connectionStatus}</span>
          </p>
          {connectionId && (
            <p className="text-sm text-gray-500">
              Connection ID: <code className="bg-gray-100 px-2 py-1 rounded">{connectionId}</code>
            </p>
          )}
        </div>

        {/* Send Test Message */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Send Test Message</h3>
          <div className="flex gap-2 mb-2">
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="notification">notification</option>
              <option value="alert">alert</option>
              <option value="update">update</option>
              <option value="custom">custom</option>
            </select>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
            />
            <button
              onClick={sendTestMessage}
              disabled={!testMessage.trim() || connectionStatus !== 'connected'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>

        {/* Messages Display */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-700">
              Received Messages ({messages.length})
            </h3>
            <button
              onClick={clearMessages}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
          
          <div className="bg-gray-50 border rounded-md p-4 h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages received yet...</p>
            ) : (
              <div className="space-y-2">
                {messages.slice().reverse().map((message, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded p-3 text-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-blue-600">
                        {message.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
