
import { SSETestComponent } from "@/features/sse/components/SSETestComponent";

export default function SSETestPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Server-Sent Events Test
        </h1>
        <SSETestComponent />
      </div>
    </div>
  );
}
