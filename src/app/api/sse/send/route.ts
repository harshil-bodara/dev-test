
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sseService } from "@/features/sse";
import { authOptions } from "@/features/auth/config/next-auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const body = await request.json();
    const { type, data, target } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type and data" },
        { status: 400 }
      );
    }

    let sentCount = 0;

    // Send based on target type
    switch (target?.type) {
      case "user":
        if (target.userId) {
          sentCount = sseService.sendToUser(target.userId, { type, data });
        }
        break;
      case "connection":
        if (target.connectionId) {
          const success = sseService.sendToConnection(target.connectionId, { type, data });
          sentCount = success ? 1 : 0;
        }
        break;
      case "broadcast":
      default:
        sentCount = sseService.broadcast({ type, data });
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Event sent to ${sentCount} connection(s)`,
      sentCount,
      connectionCount: sseService.getConnectionCount(),
    });
  } catch (error) {
    console.error("Error sending SSE event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
