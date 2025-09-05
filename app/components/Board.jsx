'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import CardInspector from './CardInspector';
import LoadingSkeleton from './LoadingSkeleton';
import { useUndo } from '../lib/useUndo';
// import { useCSRF } from '../lib/useCSRF'; // Temporarily disabled

const fetcher = async (...args) => {
  const res = await fetch(...args);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export default function Board({ filters, onBoardUpdate }) {
  // const { csrfToken, withCSRF } = useCSRF(); // Temporarily disabled
  const withCSRF = (options) => options; // Pass through without CSRF
  const { data, error, mutate, isLoading } = useSWR('/api/board/get', fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });
  
  // Expose mutate for external updates and legacy hooks
  React.useEffect(() => {
    if (onBoardUpdate) {
      onBoardUpdate(mutate);
    }
    // Also expose globally for legacy compatibility
    const fn = () => mutate();
    window.__WF_BOARD_MUTATE = fn;
    return () => { 
      if (window.__WF_BOARD_MUTATE === fn) {
        delete window.__WF_BOARD_MUTATE;
      }
    };
  }, [onBoardUpdate, mutate]);
  
  // Selection and inspector state
  const [selected, setSelected] = useState(new Set());
  const [inspecting, setInspecting] = useState(null); // { card, column }
  const { pushUndo, createDeleteInverse, createMoveInverse, createBulkDeleteInverse, cleanup } = useUndo();
  
  // Cleanup undo timeouts on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  const board = useMemo(()=> data?.board ?? data, [data]);
  
  // Selection handlers
  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);
  
  // Bulk operations
  const bulkMove = useCallback(async (toColumnId) => {
    const ids = Array.from(selected);
    if (!ids.length || !toColumnId) return;
    
    // Generate idempotency key
    const requestId = `bulk-move-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    try {
      const res = await fetch('/api/board/apply', withCSRF({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ops: ids.map(cardId => ({ 
            op: 'move_card', 
            args: { cardId, toColumnId } 
          })),
          ifVersion: board?.version,
          requestId
        })
      }));
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Bulk move failed' }));
        if (j.error === 'version_conflict') {
          toast.info('Syncing board state...');
          await mutate();
        } else if (j.error === 'wip_limit_exceeded') {
          toast.error(`WIP limit exceeded in ${j.columnId} (limit: ${j.limit})`);
        } else {
          toast.error(j.error || 'Bulk move failed');
        }
        return;
      }
      
      toast.success(`Moved ${ids.length} ${ids.length > 1 ? 'cards' : 'card'}`);
      clearSelection();
      mutate();
    } catch (err) {
      toast.error('Bulk move failed');
    }
  }, [selected, board, mutate, clearSelection]);
  
  const bulkDelete = useCallback(async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    
    if (!confirm(`Delete ${ids.length} ${ids.length > 1 ? 'cards' : 'card'}?`)) return;
    
    // Generate idempotency key
    const requestId = `bulk-delete-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    try {
      const res = await fetch('/api/board/apply', withCSRF({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ops: ids.map(id => ({ 
            op: 'delete_card', 
            args: { id } 
          })),
          ifVersion: board?.version,
          requestId
        })
      }));
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Bulk delete failed' }));
        toast.error(j.error || 'Bulk delete failed');
        return;
      }
      
      // Collect card data for undo
      const deletedCards = [];
      for (const id of ids) {
        for (const col of board.columns) {
          const card = col.cards.find(c => c.id === id);
          if (card) {
            deletedCards.push({ card, columnId: col.id });
            break;
          }
        }
      }
      
      // Push undo operation
      if (deletedCards.length > 0) {
        pushUndo(createBulkDeleteInverse(deletedCards));
      }
      
      clearSelection();
      mutate();
    } catch (err) {
      toast.error('Bulk delete failed');
    }
  }, [selected, board, mutate, clearSelection]);
  
  const filtered = useMemo(()=>{
    if(!board) return null;
    const q = (filters?.q || '').toLowerCase();
    const wantPrio = new Set(filters?.priority || []);
    const wantOwner = new Set(filters?.owner || []);
    const match = (card)=>{
      if(q){
        const hay = `${card.title||''} ${card.desc||''}`.toLowerCase();
        if(!hay.includes(q)) return false;
      }
      if(wantPrio.size && !wantPrio.has(card.priority)) return false;
      if(wantOwner.size && !wantOwner.has(card.owner)) return false;
      return true;
    };
    return {
      ...board,
      columns: board.columns.map(c=>({
        ...c,
        cards: (c.cards||[]).filter(match)
      }))
    };
  }, [board, filters]);
  
  // Keyboard shortcuts for selection
  useEffect(() => {
    function onKey(e) {
      // Escape - clear selection
      if (e.key === 'Escape') {
        clearSelection();
        setInspecting(null);
        return;
      }
      
      // Cmd/Ctrl+A - select all
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (!board) return;
        const allIds = [];
        for (const col of board.columns) {
          for (const card of (col.cards || [])) {
            allIds.push(card.id);
          }
        }
        setSelected(new Set(allIds));
      }
      
      // Delete - delete selected
      if (e.key === 'Delete' && selected.size > 0) {
        e.preventDefault();
        bulkDelete();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [board, clearSelection, selected, bulkDelete]);

  async function handleMove(cardId, from, to) {
    if (!cardId || !from || !to) {
      console.error('Invalid move parameters:', { cardId, from, to });
      toast.error('Invalid move operation');
      return;
    }
    
    // Use filtered state for consistency with UI
    const sourceData = filtered || board;
    
    // Deep clone for optimistic update
    const newBoard = JSON.parse(JSON.stringify(board));
    const fromCol = newBoard.columns.find(c => c.id === from);
    const toCol = newBoard.columns.find(c => c.id === to);
    
    if (!fromCol || !toCol) {
      toast.error('Invalid columns');
      return;
    }
    
    // Validate card exists in filtered view
    const filteredFromCol = sourceData.columns.find(c => c.id === from);
    if (filteredFromCol && !filteredFromCol.cards.some(c => c.id === cardId)) {
      console.warn(`Card ${cardId} not visible in filtered view, refreshing...`);
      mutate();
      return;
    }
    
    // Find and move the card
    const cardIndex = fromCol.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      toast.error('Card not found');
      return;
    }
    
    const [card] = fromCol.cards.splice(cardIndex, 1);
    card.status = to;
    toCol.cards.unshift(card);
    
    // Update UI immediately
    mutate({ board: newBoard }, false);
    
    // Store undo operation
    pushUndo(createMoveInverse(cardId, from, to));
    
    // Generate idempotency key for drag operation
    const requestId = `drag-${cardId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    try {
      const res = await fetch('/api/board/apply', withCSRF({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'move_card',
          args: { cardId, fromColumnId: from, toColumnId: to },
          ifVersion: board.version, // Include version for conflict detection
          requestId
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }));
      
      if (res.ok) {
        // Sync with server
        const result = await res.json();
        if (result.board) {
          mutate({ board: result.board }, false);
        } else {
          mutate();
        }
        toast.success('✨ Moved!', { duration: 2000 });
      } else {
        const j = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Move failed:', j);
        
        if (j.error === 'version_conflict') {
          // Retry once with fresh data
          toast.info('Syncing board state...');
          await mutate();
          
          // Get fresh board data and retry
          const freshData = await fetch('/api/board/get').then(r => r.json());
          if (freshData.board) {
            const retryRes = await fetch('/api/board/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                op: 'move_card',
                args: { cardId, fromColumnId: from, toColumnId: to },
                ifVersion: freshData.board.version
              })
            });
            
            if (retryRes.ok) {
              toast.success('✨ Moved after sync!');
              mutate();
            } else {
              toast.error('Move failed after retry');
              mutate();
            }
          }
        } else {
          toast.error(j.error || 'Move failed');
          mutate(); // Revert on error
        }
      }
    } catch(err) {
      console.error('Move failed:', err);
      if (err.name === 'AbortError') {
        toast.error('Move timed out. Please try again.');
      } else {
        toast.error('Failed to move card');
      }
      mutate(); // Revert on error
    }
  }
  
  async function handleAddColumn() {
    // Use safe prompt from validation utils
    const name = window.prompt ? window.prompt('New column name') : null;
    if(!name || name.trim().length === 0) return;
    
    const sanitizedName = name.trim().substring(0, 50);
    
    try {
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          op: 'create_column', 
          args: { name: sanitizedName },
          ifVersion: board?.version,
          requestId: `addcol-${Date.now()}-${Math.random().toString(36).slice(2)}`
        })
      });
      
      if(res.ok) {
        mutate();
        toast.success('Column created');
      } else {
        const j = await res.json().catch(() => ({ error: 'Unknown error' }));
        if (j.error === 'version_conflict') {
          toast.info('Syncing board state...');
          await mutate();
        } else {
          toast.error(j.error || 'Failed to create column');
        }
      }
    } catch(err) {
      console.error('Create column error:', err);
      toast.error('Failed to create column');
    }
  }

  const selectVisible = useCallback(() => {
    if (!filtered) return;
    const ids = [];
    for (const col of filtered.columns) {
      for (const card of col.cards) ids.push(card.id);
    }
    setSelected(new Set(ids));
    if (ids.length > 0) {
      toast.success(`Selected ${ids.length} ${ids.length === 1 ? 'card' : 'cards'}`);
    }
  }, [filtered]);

  async function handleWipEdit(columnId) {
    const limit = window.prompt ? window.prompt('Set WIP limit (0 for no limit):', filtered.wipLimits?.[columnId] || '0') : null;
    if (limit === null) return;
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 0 || num > 100) {
      toast.error('Please enter a valid number between 0 and 100');
      return;
    }
    
    try {
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'set_wip_limit',
          args: { columnId, limit: num || null },
          ifVersion: board?.version,
          requestId: `wip-${columnId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
        })
      });
      
      if (res.ok) {
        mutate();
        toast.success('WIP limit updated');
      } else {
        const j = await res.json().catch(() => ({ error: 'Failed to set WIP' }));
        if (j.error === 'version_conflict') {
          toast.info('Syncing board state...');
          await mutate();
        } else {
          toast.error(j.error || 'Failed to set WIP');
        }
      }
    } catch (err) {
      console.error('WIP edit failed:', err);
      toast.error('Failed to set WIP');
    }
  }

  // Helper to check if a card matches current filters
  function matchesFilters(card) {
    const q = (filters?.q || '').toLowerCase();
    const prios = new Set(filters?.priority || []);
    const owners = new Set(filters?.owner || []);
    
    if (q) {
      const hay = `${card.title || ''} ${card.desc || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (prios.size && !prios.has(card.priority)) return false;
    if (owners.size && !owners.has(card.owner)) return false;
    return true;
  }

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination || !board) return;
    
    const hasActiveFilters = Boolean(
      (filters?.q && filters.q.trim().length > 0) ||
      (filters?.priority && filters.priority.length > 0) ||
      (filters?.owner && filters.owner.length > 0)
    );
    
    // If same column and filters active, disallow reordering
    if (hasActiveFilters && source.droppableId === destination.droppableId) {
      toast.info('Cannot reorder within column while filters are active');
      return;
    }
    
    const newBoard = JSON.parse(JSON.stringify(board));
    const sourceCol = newBoard.columns.find(c => c.id === source.droppableId);
    const destCol = newBoard.columns.find(c => c.id === destination.droppableId);
    
    if (!sourceCol || !destCol) return;
    
    // Find card by ID (not by index)
    const cardIndex = sourceCol.cards.findIndex(c => c.id === draggableId);
    if (cardIndex === -1) return;
    
    // Remove from source
    const [movedCard] = sourceCol.cards.splice(cardIndex, 1);
    
    // Calculate actual destination index
    let actualDestIndex = destination.index;
    
    if (hasActiveFilters) {
      // Map filtered index to unfiltered index
      const visibleCards = destCol.cards.filter(c => matchesFilters(c));
      
      if (destination.index >= visibleCards.length) {
        // Add to end
        actualDestIndex = destCol.cards.length;
      } else {
        // Find the card at the filtered destination index
        const targetCard = visibleCards[destination.index];
        // Find its position in the unfiltered array
        actualDestIndex = destCol.cards.findIndex(c => c.id === targetCard.id);
      }
    }
    
    // Add to destination
    destCol.cards.splice(actualDestIndex, 0, movedCard);
    
    // Update board and version
    const updatedBoard = { ...newBoard, version: board.version + 1 };
    mutate({ board: updatedBoard }, false);
    
    // Store undo operation
    pushUndo(createMoveInverse(movedCard.id, source.droppableId, destination.droppableId));
    
    // Save to backend
    try {
      const response = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'move_card',
          args: {
            cardId: movedCard.id,
            fromColumnId: source.droppableId,
            toColumnId: destination.droppableId,
            position: actualDestIndex
          },
          ifVersion: board.version,
          requestId: `dragend-${draggableId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to move card:', error);
        // Revert on error
        mutate();
        toast.error(error.error || 'Failed to move card');
      } else {
        const data = await response.json();
        mutate({ board: data.board }, false);
      }
    } catch (error) {
      console.error('Error moving card:', error);
      mutate();
      toast.error('Failed to move card');
    }
  }

  if(isLoading || !filtered){
    return <LoadingSkeleton />;
  }

  if(error){
    return (
      <div className="flex items-center justify-center min-h-[280px] flex-col gap-4">
        <h2 className="m-0 text-center text-[var(--wf-soft)]">Failed to load board</h2>
        <small className="text-center text-[var(--wf-soft)]/60">{error.message}</small>
      </div>
    );
  }

  // Check if all columns are empty due to filtering
  const hasCards = filtered.columns.some(c => c.cards.length > 0);
  const hasFilters = filters?.q || filters?.priority?.length || filters?.owner?.length;

  if(!hasCards && hasFilters){
    return (
      <div className="flex items-center justify-center min-h-[280px] flex-col gap-4">
        <h2 className="m-0 text-center text-[var(--wf-soft)]">No cards match filters</h2>
        <small className="text-center text-[var(--wf-soft)]/60">Try adjusting your search criteria</small>
      </div>
    );
  }

  return (
    <>
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="wf-bulkbar sticky top-0 z-20 flex justify-between items-center p-3 mb-4 bg-[var(--wf-navy)]/95 backdrop-blur border border-[var(--border)] rounded-lg shadow-lg">
          <div className="text-[var(--wf-soft)]">
            <strong>{selected.size}</strong> {selected.size === 1 ? 'card' : 'cards'} selected
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-[var(--wf-soft)]/60">Move to:</label>
            <select 
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)] cursor-pointer text-sm"
              onChange={(e) => {
                if (e.target.value) {
                  bulkMove(e.target.value);
                  e.target.value = '';
                }
              }} 
              defaultValue=""
            >
              <option value="" disabled>Choose column</option>
              {filtered.columns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button 
              className="wf-btn wf-btn-outline text-red-400 border-red-400 hover:bg-red-400/10"
              onClick={bulkDelete}
            >
              Delete
            </button>
            <button 
              className="wf-btn wf-btn-outline"
              onClick={clearSelection}
            >
              Clear
            </button>
          </div>
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="mb-4 flex items-center gap-2">
          <button 
            className="wf-btn wf-btn-outline flex items-center gap-1"
            onClick={handleAddColumn}
          >
            + Column
          </button>
          <button
            className="wf-btn wf-btn-outline"
            onClick={selectVisible}
            title="Select all cards matching current filters"
          >
            Select visible
          </button>
        </div>
        
        <div className="wf-board grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.columns.map((col, index) => {
            const limit = filtered.wipLimits?.[col.id];
            
            return (
              <Column
                key={col.id}
                column={col}
                index={index}
                limit={limit}
                boardVersion={board?.version}
                onMove={handleMove}
                onWipEdit={handleWipEdit}
                onRefresh={() => mutate()}
                // Pass selection props
                selection={selected}
                onToggleSelect={toggleSelect}
                onOpenInspector={(card) => setInspecting({ card, column: col })}
              />
            );
          })}
        </div>
      </DragDropContext>
      
      {/* Card Inspector */}
      <CardInspector
        open={!!inspecting}
        card={inspecting?.card}
        column={inspecting?.column}
        boardVersion={board?.version}
        onClose={() => setInspecting(null)}
        onSaved={() => {
          setInspecting(null);
          mutate();
        }}
      />
    </>
  );
}