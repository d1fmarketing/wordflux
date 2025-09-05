import { NextResponse } from 'next/server';

export async function POST(req) {
  const { id, name, filters } = await req.json();
  
  // For now, return success
  // Later: implement with DynamoDB
  const saved = {
    id: id || 'view_' + Math.random().toString(36).slice(2,8),
    name,
    filters,
    createdAt: new Date().toISOString()
  };
  
  return NextResponse.json({ saved });
}