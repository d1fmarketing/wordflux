import { NextResponse } from 'next/server';
import { z } from 'zod';
import { putBoard } from '../../../lib/board.js';

const CardSchema = z.object({
  id: z.string(),
  title: z.string(),
  desc: z.string().optional().default(''),
  owner: z.string().optional().default(''),
  priority: z.enum(['h', 'm', 'l']).optional().default('m')
});

const ColumnSchema = z.object({
  id: z.string(),
  name: z.string(),
  cards: z.array(CardSchema).default([])
});

const SeedSchema = z.object({
  columns: z.array(ColumnSchema),
  wipLimits: z.record(z.string(), z.number().int().positive()).optional().default({})
});

export async function POST(req) {
  // Only allow in test mode or when explicitly enabled
  if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_TEST_ENDPOINTS !== '1') {
    return NextResponse.json({ error: 'Test endpoint disabled' }, { status: 404 });
  }
  
  try {
    const data = await req.json();
    const parsed = SeedSchema.safeParse(data);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid seed data', 
        detail: parsed.error.flatten() 
      }, { status: 422 });
    }
    
    const board = {
      id: 'test',
      columns: parsed.data.columns,
      wipLimits: parsed.data.wipLimits || {}
    };
    
    await putBoard(board);
    return NextResponse.json({ ok: true, board });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to seed board', 
      detail: error.message 
    }, { status: 500 });
  }
}