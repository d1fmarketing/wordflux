import { NextResponse } from "next/server";
import { getBoard, putBoard } from "../../../lib/board.js";
import { boardOps } from "../../../lib/schemas.js";
import { sanitizeCard, sanitizeColumn, sanitizeComment } from "../../../lib/sanitize.js";
import { getCachedRequest, cacheRequest } from "../../../lib/idempotency.js";
import { withErrorHandling } from "../../../lib/api-utils.js";

// Helper functions for cleaner responses
function ok(json){ return NextResponse.json(json); }
function bad(msg, code=400, details=null){ 
  const response = { error: msg };
  if (details) response.details = details;
  return NextResponse.json(response, { status: code }); 
}

// Generate simple IDs
function genId(prefix = 'item') {
  return `${prefix}_${Math.random().toString(36).slice(2,8)}`;
}

// Find card in any column
function findCard(board, cardId) {
  for (const col of board.columns) {
    const idx = col.cards.findIndex(c => c.id === cardId);
    if (idx !== -1) return { col, idx, card: col.cards[idx] };
  }
  return null;
}

// Remove card from any column
function removeFromColumn(board, cardId) {
  for (const col of board.columns) {
    const idx = col.cards.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      return col.cards.splice(idx, 1)[0];
    }
  }
  return null;
}

// Check if operation will exceed WIP limit
function willExceedWip(board, columnId, delta = 1) {
  const limit = board.wipLimits?.[columnId];
  if (!limit || limit <= 0) return false;
  const col = board.columns.find(c => c.id === columnId);
  if (!col) return false;
  return (col.cards.length + delta) > limit;
}

export const POST = withErrorHandling(async (req) => {
    const body = await req.json();
    
    // Check for idempotency key
    const requestId = body.requestId;
    if (requestId) {
      const cached = getCachedRequest(requestId);
      if (cached) {
        // Return cached response for duplicate request
        return NextResponse.json(cached, { 
          status: 200,
          headers: { 'X-Idempotent-Replay': 'true' }
        });
      }
    }
    
    // Support both single operation (backward compat) and array of ops
    const isSingleOp = body.op && body.args;
    const ops = isSingleOp ? [{ op: body.op, args: body.args }] : body.ops || [];
    const ifVersion = body.ifVersion;
    
    const board = await getBoard(true);
    
    // Initialize version if not present
    if (typeof board.version !== 'number') {
      board.version = 1;
    }
    
    // Check version conflict
    if (typeof ifVersion === 'number' && ifVersion !== board.version) {
      console.log(`Version conflict: expected ${ifVersion}, got ${board.version}`);
      return NextResponse.json({ 
        error: 'version_conflict', 
        currentVersion: board.version,
        expectedVersion: ifVersion
      }, { status: 409 });
    }
    
    const now = new Date().toISOString();
    const results = [];
    
    // Process each operation
    for (const { op, args } of ops) {
      // Validate operation exists
      const schema = boardOps[op];
      if (!schema) {
        return bad(`Unknown operation: ${op}`, 400, { available: Object.keys(boardOps) });
      }
      
      // Validate arguments
      let validated;
      try {
        validated = schema.parse(args);
      } catch (validationError) {
        const message = validationError.issues?.[0]?.message || 'Invalid arguments';
        return bad(message, 400, { op, errors: validationError.issues });
      }
      
      // Execute operation
      if (op === 'set_wip_limit') {
        const { columnId, limit } = validated;
        board.wipLimits = board.wipLimits || {};
        board.wipLimits[columnId] = limit;
        
      } else if (op === 'move_card') {
        const { fromColumnId, toColumnId, cardId, position } = validated;
        // Try both patterns: explicit from/to or just cardId + toColumn
        let from, to, card;
        
        if (fromColumnId) {
          from = board.columns.find(c => c.id === fromColumnId);
          to = board.columns.find(c => c.id === toColumnId);
          if (!from) throw new Error(`Source column not found: ${fromColumnId}`);
          if (!to) throw new Error(`Target column not found: ${toColumnId}`);
          const idx = from.cards.findIndex(c => c.id === cardId);
          if (idx < 0) throw new Error(`Card ${cardId} not found in column ${fromColumnId}`);
          [card] = from.cards.splice(idx, 1);
        } else {
          // Find card in any column
          card = removeFromColumn(board, cardId);
          if (!card) throw new Error(`Card not found: ${cardId}`);
          to = board.columns.find(c => c.id === toColumnId);
          if (!to) throw new Error(`Invalid target column: ${toColumnId}`);
        }
        
        // Check WIP limit for destination column
        if (willExceedWip(board, to.id, 1)) {
          return NextResponse.json({ 
            error: 'wip_limit_exceeded', 
            columnId: to.id,
            limit: board.wipLimits[to.id] 
          }, { status: 409 });
        }
        
        // Update card status to match new column
        card.status = to.id;
        card.updatedAt = now;
        
        // Insert at position
        if (position != null && position >= 0 && position <= to.cards.length) {
          to.cards.splice(position, 0, card);
        } else {
          to.cards.push(card);
        }
        
        results.push({ moved: cardId, from: fromColumnId || 'auto', to: toColumnId });
        
      } else if (op === 'merge_columns') {
        const { sourceId, targetId, newName } = validated;
        const srcIdx = board.columns.findIndex(c => c.id === sourceId);
        const tgtIdx = board.columns.findIndex(c => c.id === targetId);
        if (srcIdx < 0 || tgtIdx < 0) throw new Error('Invalid column(s)');
        const src = board.columns[srcIdx];
        const tgt = board.columns[tgtIdx];
        tgt.cards = [...src.cards, ...tgt.cards];
        if (newName) {
          // Sanitize new column name
          const sanitized = sanitizeColumn({ name: newName });
          if (sanitized.name && sanitized.name.trim().length > 0) {
            tgt.name = sanitized.name;
            tgt.id = sanitized.name;
          }
        }
        board.columns.splice(srcIdx, 1);
        if (board.wipLimits) { delete board.wipLimits[sourceId]; }
        
      } else if (op === 'create_card') {
        const { columnId, title, description, owner, priority, labels, assignees, dueDate, points } = validated;
        const col = board.columns.find(c => c.id === columnId);
        if (!col) return bad('Column not found', 400, { columnId });
        
        // Sanitize input data
        const sanitized = sanitizeCard({
          title,
          description,
          owner,
          labels,
          assignees
        });
        
        // Ensure title is not empty after sanitization
        if (!sanitized.title || sanitized.title.trim().length === 0) {
          return bad('Title is required and cannot be empty', 400);
        }
        
        // Check WIP limit
        if (willExceedWip(board, col.id, 1)) {
          return NextResponse.json({ 
            error: 'wip_limit_exceeded', 
            columnId: col.id,
            limit: board.wipLimits[col.id] 
          }, { status: 409 });
        }
        
        const card = {
          id: genId('card'),
          title: sanitized.title,
          desc: sanitized.desc || sanitized.description || '',
          owner: sanitized.owner || '',
          priority: priority || 'm',
          // New fields
          labels: sanitized.labels || [],
          assignees: sanitized.assignees || [],
          dueDate: dueDate || null,
          points: points || null,
          checklist: [],
          status: col.id,
          createdAt: now,
          updatedAt: now,
          comments: []
        };
        
        col.cards.unshift(card);
        results.push({ created: card });
        
      } else if (op === 'update_card') {
        const { columnId, cardId, id, set, ...directFields } = validated;
        
        // Find card (support both columnId+cardId or just id)
        let location;
        if (columnId && cardId) {
          const col = board.columns.find(c => c.id === columnId);
          if (!col) throw new Error('Invalid column');
          const idx = col.cards.findIndex(c => c.id === cardId);
          if (idx < 0) throw new Error('Card not found');
          location = { col, idx };
        } else if (id || cardId) {
          location = findCard(board, id || cardId);
          if (!location) throw new Error('Card not found');
        } else {
          throw new Error('Card ID required');
        }
        
        const card = location.col.cards[location.idx];
        const updates = set || directFields;
        
        // Sanitize updates
        const sanitized = sanitizeCard(updates);
        
        // Apply sanitized updates
        if (sanitized.title != null) {
          // Ensure title is not empty after sanitization
          if (sanitized.title.trim().length === 0) {
            throw new Error('Title cannot be empty');
          }
          card.title = sanitized.title;
        }
        if (sanitized.desc != null || sanitized.description != null) {
          card.desc = sanitized.desc || sanitized.description;
        }
        if (sanitized.owner != null) card.owner = sanitized.owner;
        if (updates.priority != null) card.priority = updates.priority;
        if (sanitized.labels != null) card.labels = sanitized.labels;
        if (sanitized.assignees != null) card.assignees = sanitized.assignees;
        if (updates.dueDate != null) card.dueDate = updates.dueDate;
        if (updates.points != null) card.points = updates.points;
        if (updates.checklist != null) card.checklist = updates.checklist;
        
        card.updatedAt = now;
        
        // Handle status change (move to different column)
        if (updates.status && updates.status !== location.col.id) {
          location.col.cards.splice(location.idx, 1);
          const dest = board.columns.find(c => c.id === updates.status);
          if (!dest) throw new Error('Invalid status/column');
          card.status = dest.id;
          dest.cards.unshift(card);
        }
        
      } else if (op === 'create_column') {
        const { name, wipLimit } = validated;
        
        // Sanitize column name
        const sanitized = sanitizeColumn({ name });
        if (!sanitized.name || sanitized.name.trim().length === 0) {
          return bad('Column name is required and cannot be empty', 400);
        }
        
        const id = genId('col');
        board.columns.push({ id, name: sanitized.name, cards: [] });
        if (wipLimit) {
          board.wipLimits = board.wipLimits || {};
          board.wipLimits[id] = wipLimit;
        }
        results.push({ created: id });
        
      } else if (op === 'rename_column') {
        const { columnId, newName } = validated;
        const col = board.columns.find(c => c.id === columnId);
        if (!col) throw new Error('Invalid column');
        
        // Sanitize new column name
        const sanitized = sanitizeColumn({ newName });
        if (!sanitized.newName || sanitized.newName.trim().length === 0) {
          throw new Error('Column name cannot be empty');
        }
        col.name = sanitized.newName;
        
      } else if (op === 'delete_column') {
        const { columnId } = validated;
        const idx = board.columns.findIndex(c => c.id === columnId);
        if (idx < 0) throw new Error('Invalid column');
        board.columns.splice(idx, 1);
        if (board.wipLimits) { delete board.wipLimits[columnId]; }
        
      } else if (op === 'delete_card') {
        const { columnId, cardId, id } = validated;
        const targetId = id || cardId;
        
        // Debug: help diagnose "Card not found" reports
        // (logs removed)

        if (columnId) {
          // Old pattern: columnId + cardId
          const col = board.columns.find(c => c.id === columnId);
          if (!col) throw new Error('Invalid column');
          const idx = col.cards.findIndex(c => c.id === targetId);
          if (idx < 0) throw new Error('Card not found');
          col.cards.splice(idx, 1);
        } else {
          // New pattern: just card id
          const removed = removeFromColumn(board, targetId);
          if (!removed) throw new Error('Card not found');
        }
        
      } else if (op === 'duplicate_card') {
        const { columnId, cardId } = validated;
        const col = board.columns.find(c => c.id === columnId);
        if (!col) throw new Error('Invalid column');
        const card = col.cards.find(c => c.id === cardId);
        if (!card) throw new Error('Card not found');
        
        // Create copy with sanitized title
        const copyTitle = `${card.title} (copy)`;
        const sanitized = sanitizeCard({ title: copyTitle });
        
        const copy = { 
          ...card, 
          id: genId('card'), 
          title: sanitized.title || copyTitle,
          createdAt: now,
          updatedAt: now,
          comments: []
        };
        col.cards.push(copy);
        results.push({ created: copy });
        
      } else if (op === 'move_column') {
        const { fromIndex, toIndex } = validated;
        if (fromIndex == null || toIndex == null) throw new Error('Invalid indices');
        if (fromIndex < 0 || fromIndex >= board.columns.length) throw new Error('Invalid fromIndex');
        if (toIndex < 0 || toIndex >= board.columns.length) throw new Error('Invalid toIndex');
        const [moved] = board.columns.splice(fromIndex, 1);
        board.columns.splice(toIndex, 0, moved);
        
      } else if (op === 'comment') {
        // New operation: add comment to card
        const { id, cardId, text, author } = validated;
        const targetId = id || cardId;
        const location = findCard(board, targetId);
        if (!location) throw new Error('Card not found');
        
        // Sanitize comment text and author
        const sanitized = sanitizeComment({ text, author });
        if (!sanitized.text || sanitized.text.trim().length === 0) {
          throw new Error('Comment text cannot be empty');
        }
        
        if (!location.card.comments) location.card.comments = [];
        location.card.comments.push({
          id: genId('com'),
          author: sanitized.author || 'System',
          text: sanitized.text,
          createdAt: now
        });
        location.card.updatedAt = now;
        
      } else {
        throw new Error('Unknown op');
      }
    }
    
    // Increment version and save
    board.version = (board.version || 0) + 1;
    
    try {
      // Save board with conditional write if version specified
      await putBoard(board, ifVersion);
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException' || err.code === 'version_conflict') {
        console.log('Conditional write failed - version conflict');
        // Re-fetch board to get current version
        const currentBoard = await getBoard(false);
        return NextResponse.json({ 
          error: 'version_conflict',
          message: 'Board was updated by another user',
          currentVersion: currentBoard.version,
          expectedVersion: ifVersion
        }, { status: 409 });
      }
      console.error('Failed to save board:', err);
      throw err;
    }
    
    // Prepare response
    const response = isSingleOp && results.length > 0
      ? { board, ...results[0] }
      : { 
          ok: true, 
          board, 
          version: board.version,
          results: results.length > 0 ? results : undefined
        };
    
    // Cache successful response if requestId provided
    if (requestId) {
      cacheRequest(requestId, response);
    }
    
    return ok(response);
});
