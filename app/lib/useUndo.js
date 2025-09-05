'use client';
import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export function useUndo() {
  const [undoStack, setUndoStack] = useState([]);
  const undoTimeouts = useRef(new Map());
  
  // Store an undoable action
  const pushUndo = useCallback((operation, duration = 5000) => {
    const undoId = `undo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Add to stack
    setUndoStack(prev => [...prev, { id: undoId, operation }]);
    
    // Show undo toast
    const toastId = toast((t) => (
      <div className="flex items-center gap-2">
        <span>{operation.message || 'Action completed'}</span>
        <button
          onClick={() => {
            executeUndo(undoId);
            toast.dismiss(t.id);
          }}
          className="ml-2 px-2 py-1 bg-[var(--wf-magenta)] text-white rounded hover:opacity-80"
        >
          Undo
        </button>
      </div>
    ), {
      duration,
      position: 'bottom-center',
      style: {
        background: 'var(--wf-navy)',
        color: 'var(--wf-soft)',
        border: '1px solid var(--border)',
      },
    });
    
    // Auto-remove from stack after duration
    const timeout = setTimeout(() => {
      setUndoStack(prev => prev.filter(item => item.id !== undoId));
      undoTimeouts.current.delete(undoId);
    }, duration);
    
    undoTimeouts.current.set(undoId, { timeout, toastId });
    
    return undoId;
  }, []);
  
  // Execute an undo operation
  const executeUndo = useCallback(async (undoId) => {
    const item = undoStack.find(u => u.id === undoId);
    if (!item) return;
    
    // Clear timeout
    const timeoutInfo = undoTimeouts.current.get(undoId);
    if (timeoutInfo) {
      clearTimeout(timeoutInfo.timeout);
      undoTimeouts.current.delete(undoId);
    }
    
    // Remove from stack
    setUndoStack(prev => prev.filter(u => u.id !== undoId));
    
    // Execute the inverse operation
    if (item.operation.execute) {
      try {
        await item.operation.execute();
        toast.success('Undone!', { duration: 2000 });
      } catch (error) {
        console.error('Undo failed:', error);
        toast.error('Undo failed');
      }
    }
  }, [undoStack]);
  
  // Create inverse operation for card deletion
  const createDeleteInverse = useCallback((card, columnId) => ({
    message: `Deleted "${card.title}"`,
    execute: async () => {
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ops: [{
            op: 'create_card',
            args: {
              columnId: columnId || card.status || 'Backlog',
              title: card.title,
              description: card.desc || card.description,
              priority: card.priority,
              labels: card.labels,
              assignees: card.assignees,
              dueDate: card.dueDate,
              points: card.points,
              owner: card.owner
            }
          }],
          requestId: `undo-create-${Date.now()}`
        })
      });
      
      if (!res.ok) throw new Error('Failed to restore card');
      // Trigger board refresh
      if (window.__WF_BOARD_MUTATE) window.__WF_BOARD_MUTATE();
    }
  }), []);
  
  // Create inverse operation for card move
  const createMoveInverse = useCallback((cardId, fromColumn, toColumn) => ({
    message: 'Card moved',
    execute: async () => {
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'move_card',
          args: {
            cardId,
            toColumnId: fromColumn,
            position: 0
          },
          requestId: `undo-move-${Date.now()}`
        })
      });
      
      if (!res.ok) throw new Error('Failed to move card back');
      if (window.__WF_BOARD_MUTATE) window.__WF_BOARD_MUTATE();
    }
  }), []);
  
  // Create inverse for bulk delete
  const createBulkDeleteInverse = useCallback((cards) => ({
    message: `Deleted ${cards.length} cards`,
    execute: async () => {
      const ops = cards.map(({ card, columnId }) => ({
        op: 'create_card',
        args: {
          columnId: columnId || card.status || 'Backlog',
          title: card.title,
          description: card.desc || card.description,
          priority: card.priority,
          labels: card.labels,
          assignees: card.assignees,
          owner: card.owner
        }
      }));
      
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ops,
          requestId: `undo-bulk-${Date.now()}`
        })
      });
      
      if (!res.ok) throw new Error('Failed to restore cards');
      if (window.__WF_BOARD_MUTATE) window.__WF_BOARD_MUTATE();
    }
  }), []);
  
  // Cleanup on unmount
  const cleanup = useCallback(() => {
    undoTimeouts.current.forEach(({ timeout }) => clearTimeout(timeout));
    undoTimeouts.current.clear();
  }, []);
  
  return {
    pushUndo,
    executeUndo,
    createDeleteInverse,
    createMoveInverse,
    createBulkDeleteInverse,
    cleanup,
    hasUndo: undoStack.length > 0
  };
}