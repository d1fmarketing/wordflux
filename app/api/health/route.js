import { NextResponse } from "next/server";

export async function GET() {
  // Track server start time globally
  const startedAt = global.__STARTED_AT__ || (global.__STARTED_AT__ = Date.now());
  
  return NextResponse.json({
    ok: true,
    status: "healthy",
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    version: '0.3.3',
    features: [
      'cards',
      'columns', 
      'chat',
      'voice',
      'filters',
      'saved-views',
      'inline-creation',
      'column-management',
      'toast-notifications'
    ],
    timestamp: new Date().toISOString()
  });
}
