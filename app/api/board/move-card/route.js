import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { fromColumnId, toColumnId, cardId, position, ifVersion } = body || {};
    
    if (!toColumnId || !cardId) {
      return NextResponse.json({ 
        error: 'Missing required fields: toColumnId, cardId' 
      }, { status: 400 });
    }
    
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/board/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'move_card',
        args: { fromColumnId, toColumnId, cardId, position },
        ifVersion
      }),
      signal: AbortSignal.timeout(10000)
    });

    const json = await res.json().catch(() => ({ error: 'Unknown error' }));
    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    console.error('move-card delegation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}