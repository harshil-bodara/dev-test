
import { NextRequest, NextResponse } from "next/server";
import { notifyUser, notifyAll } from "@/features/sse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Example webhook payload processing
    const { event, userId, data } = body;
    
    switch (event) {
      case "user.updated":
        if (userId) {
          notifyUser(userId, "Your profile has been updated", "update", data);
        }
        break;
        
      case "system.maintenance":
        notifyAll("System maintenance scheduled", "alert", {
          severity: "warning",
          scheduledTime: data.scheduledTime,
        });
        break;
        
      case "order.status_changed":
        if (userId) {
          notifyUser(userId, `Order ${data.orderId} is now ${data.status}`, "notification", {
            orderId: data.orderId,
            status: data.status,
          });
        }
        break;
        
      default:
        console.log(`Unknown webhook event: ${event}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
