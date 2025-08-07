import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    PYTHON_AGENT_SERVICE_URL: process.env.PYTHON_AGENT_SERVICE_URL || 'not_set',
    NODE_ENV: process.env.NODE_ENV || 'not_set',
    timestamp: new Date().toISOString()
  });
}
