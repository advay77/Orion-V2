import { NextResponse } from 'next/server';

/**
 * Health-check / status endpoint.
 * 
 * Note: With the SSE streaming architecture, real-time plan state is delivered
 * via the /api/orion/execute SSE stream. This endpoint now serves as a simple
 * health-check to verify the API is reachable.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: 'ORION AI API is running. Use POST /api/orion/execute for plan execution.',
  });
}
