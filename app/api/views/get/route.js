import { NextResponse } from 'next/server';

export async function GET() {
  // For now, use localStorage on client side
  // Later: implement with DynamoDB or user session
  const views = [
    { id: 'default', name: 'All Cards', filters: { q: '', priority: [], owner: [] } },
    // Placeholder for saved views from DB
  ];
  
  return NextResponse.json({ views });
}