
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { sseService } from "@/features/sse";
import { authOptions } from "@/features/auth/config/next-auth";

export async function GET(request: NextRequest) {
  try {
    // Get session to identify user
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Get session ID from headers or generate one
    const sessionId = request.headers.get("x-session-id") || undefined;

    // Create SSE connection
    const { stream, connectionId } = sseService.createConnection(userId, sessionId);

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
        "X-Connection-ID": connectionId,
      },
    });
  } catch (error) {
    console.error("Error creating SSE connection:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-session-id",
    },
  });
}
