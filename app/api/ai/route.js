// app/api/ai/route.js
import { NextResponse } from 'next/server';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';

// Helper: Index board for quick lookups
function indexBoard(board) {
  const byId = new Map();
  const all = [];
  for (const col of board.columns) {
    for (const card of col.cards) {
      byId.set(card.id, { card, col: col.id });
      all.push({ ...card, columnId: col.id });
    }
  }
  return { byId, all };
}

// Helper: Parse query string like "title:foo label:bug assignee:RJ"
function parseQuery(s) {
  if (!s) return {};
  const matches = [...s.matchAll(/(\w+):"([^"]+)"|(\w+):(\S+)/g)];
  const kv = {};
  for (const m of matches) {
    const key = (m[1] || m[3]).toLowerCase();
    const value = (m[2] || m[4]).toLowerCase();
    kv[key] = value;
  }
  return kv;
}

// Helper: Resolve cardQuery to card IDs
function resolveTargets(action, idx) {
  // Direct ID takes precedence
  if (action.id && idx.byId.has(action.id)) {
    return [action.id];
  }
  
  // Parse query string
  if (!action.cardQuery) return [];
  const q = parseQuery(action.cardQuery);
  
  // Filter cards
  const matches = idx.all.filter(card => {
    if (q.id && card.id !== q.id) return false;
    if (q.title && !card.title.toLowerCase().includes(q.title)) return false;
    if (q.label && (!card.labels || !card.labels.some(l => l.toLowerCase().includes(q.label)))) return false;
    if (q.assignee && (!card.assignees || !card.assignees.some(a => a.toLowerCase().includes(q.assignee)))) return false;
    if (q.status && card.columnId.toLowerCase() !== q.status && card.status?.toLowerCase() !== q.status) return false;
    if (q.priority) {
      const p = card.priority || 'm';
      const pMap = { h: 'high', m: 'medium', l: 'low' };
      if (pMap[p] !== q.priority && p !== q.priority[0]) return false;
    }
    return true;
  });
  
  // Apply limit if specified
  if (action.first || action.limit === 1) {
    return matches.slice(0, 1).map(c => c.id);
  }
  
  return matches.map(c => c.id);
}

// Helper: Summarize operations for human readability
function summarize(ops) {
  const counts = {};
  for (const op of ops) {
    counts[op.op] = (counts[op.op] || 0) + 1;
  }
  
  const parts = [];
  if (counts.create_card) parts.push(`✅ Created ${counts.create_card} card(s)`);
  if (counts.update_card) parts.push(`✏️ Updated ${counts.update_card} card(s)`);
  if (counts.move_card) parts.push(`➡️ Moved ${counts.move_card} card(s)`);
  if (counts.delete_card) parts.push(`🗑️ Deleted ${counts.delete_card} card(s)`);
  if (counts.comment) parts.push(`💬 Added ${counts.comment} comment(s)`);
  if (counts.create_column) parts.push(`📋 Created ${counts.create_column} column(s)`);
  
  return parts.join(' · ') || '✅ Done';
}

export async function POST(req) {
  try {
    // Validate API key early
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        reply: 'API key missing. Please configure OPENAI_API_KEY.'
      }, { status: 500 });
    }
    
    // Derive origin from request URL for internal API calls
    const origin = new URL(req.url).origin;
    
    const { message, board: providedBoard, mode = 'action' } = await req.json();
    
    // System prompt for Action DSL
    const SYSTEM = `You are WordFlux's board agent. Output ONLY valid JSON matching this schema:

{ "actions": [ ...Action ] }

Action types:
- create_card: { intent:"create_card", column:"Backlog"|"Doing"|"Done", title, description?, priority:"h"|"m"|"l"?, labels?, assignees?, dueDate?, points? }
- update_card: { intent:"update_card", cardQuery|id, set:{ title?, description?, priority?, labels?, assignees?, dueDate?, points?, status? } }
- move_card: { intent:"move_card", cardQuery|id, toColumn:"Backlog"|"Doing"|"Done", position? }
- delete_card: { intent:"delete_card", cardQuery|id }
- comment: { intent:"comment", cardQuery|id, text }

Card targeting:
- Use "id" for specific card ID
- Use "cardQuery" with search like: "title:foo label:bug assignee:RJ status:Backlog priority:high"
- If multiple cards match, action applies to all unless you add "first":true or "limit":1

Rules:
- Output ONLY JSON, no markdown or prose
- Use exact field names shown above
- Batch related actions in single response
- Priority: h=high, m=medium, l=low
- Status/column: Backlog, Doing, or Done only`;

    // Call OpenAI with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 1000,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: message }
        ]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI error:', error);
      return NextResponse.json({ 
        reply: 'Failed to process request',
        error: 'AI service error'
      }, { status: 500 });
    }

    const aiData = await openaiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json({ 
        reply: 'Invalid response format',
        error: 'Parse error'
      }, { status: 500 });
    }

    // Get current board state
    let board = providedBoard;
    
    if (!board) {
      try {
        const boardUrl = `http://localhost:3000/api/board/get`;
        const boardController = new AbortController();
        const boardTimeout = setTimeout(() => boardController.abort(), 10000); // 10s timeout
        
        const boardRes = await fetch(boardUrl, { signal: boardController.signal });
        clearTimeout(boardTimeout);
        
        if (!boardRes.ok) {
          throw new Error(`Failed to fetch board: ${boardRes.status}`);
        }
        const boardData = await boardRes.json();
        board = boardData.board;
      } catch (fetchError) {
        console.error('Failed to fetch board:', fetchError);
        return NextResponse.json({ 
          reply: 'Failed to fetch board state',
          error: fetchError.message
        }, { status: 500 });
      }
    }
    
    if (!board) {
      return NextResponse.json({ 
        reply: 'Board not available',
        error: 'No board found'
      }, { status: 500 });
    }

    const index = indexBoard(board);
    const ops = [];

    // Convert actions to operations
    for (const action of (parsed.actions || [])) {
      const ids = resolveTargets(action, index);
      
      switch (action.intent) {
        case 'create_card': {
          ops.push({
            op: 'create_card',
            args: {
              columnId: action.column || 'Backlog',
              title: action.title,
              description: action.description,
              priority: action.priority,
              labels: action.labels,
              assignees: action.assignees,
              dueDate: action.dueDate,
              points: action.points
            }
          });
          break;
        }
        
        case 'update_card': {
          for (const id of ids) {
            ops.push({
              op: 'update_card',
              args: {
                id,
                set: action.set
              }
            });
          }
          break;
        }
        
        case 'move_card': {
          for (const id of ids) {
            ops.push({
              op: 'move_card',
              args: {
                cardId: id,
                toColumnId: action.toColumn
              }
            });
          }
          break;
        }
        
        case 'delete_card': {
          for (const id of ids) {
            ops.push({
              op: 'delete_card',
              args: { id }
            });
          }
          break;
        }
        
        case 'comment': {
          for (const id of ids) {
            ops.push({
              op: 'comment',
              args: {
                id,
                text: action.text,
                author: 'ChatGPT'
              }
            });
          }
          break;
        }
      }
    }

    // Apply operations if any
    let updatedBoard = board;
    let applied = null;
    
    if (ops.length > 0) {
      try {
        const applyUrl = `http://localhost:3000/api/board/apply`;
        const applyController = new AbortController();
        const applyTimeout = setTimeout(() => applyController.abort(), 10000); // 10s timeout
        
        const applyRes = await fetch(applyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ops,
            ifVersion: board.version
          }),
          signal: applyController.signal
        });
        
        clearTimeout(applyTimeout);

        if (applyRes.ok) {
          applied = await applyRes.json();
          updatedBoard = applied.board;
        } else {
          const error = await applyRes.json();
          
          // Handle version conflict
          if (error.error === 'version_conflict') {
            return NextResponse.json({
              reply: 'Board was updated by someone else. Please try again.',
              error: 'version_conflict',
              retry: true
            });
          }
          
          return NextResponse.json({
            reply: `Failed: ${error.error}`,
            error: error.error
          }, { status: 500 });
        }
      } catch (applyError) {
        console.error('Failed to apply operations:', applyError);
        return NextResponse.json({
          reply: 'Failed to apply operations',
          error: applyError.message
        }, { status: 500 });
      }
    }

    // Return response
    const reply = ops.length > 0 ? summarize(ops) : 'No actions needed';
    
    return NextResponse.json({
      reply,
      actions: ops.length > 0 ? ops : undefined,
      board: updatedBoard,
      version: updatedBoard.version,
      rawActions: parsed.actions
    });

  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json({
      reply: 'An error occurred',
      error: error.message
    }, { status: 500 });
  }
}