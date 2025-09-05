'use client';
import React, { useState, memo } from 'react';
import { toast } from 'react-hot-toast';
import { Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
// import { useCSRF } from '../lib/useCSRF'; // Temporarily disabled

function AddCardInline({ columnId, boardVersion, onCreated, onRefresh }) {
  // const { withCSRF } = useCSRF(); // Temporarily disabled
  const withCSRF = (options) => options; // Pass through without CSRF
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function submit() {
    const t = title.trim(); 
    if(!t || t.length > 100) {
      toast.error('Title must be 1-100 characters');
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/board/apply', withCSRF({
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          op: 'create_card', 
          args: { columnId, title: t },
          ifVersion: boardVersion,
          requestId: `create-${Date.now()}-${Math.random().toString(36).slice(2)}`
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }));
      const j = await res.json();
      
      if(res.ok) { 
        onCreated?.(j.board); 
        setTitle(''); 
        setOpen(false);
        toast.success('Card created');
      } else {
        if (j.error === 'version_conflict') {
          toast.info('Syncing board state...');
          onRefresh?.(); // This calls mutate()
          return;
        }
        toast.error(j.error || 'Failed to create');
      }
    } catch(err) {
      console.error('Create card error:', err);
      if (err.name === 'AbortError') {
        toast.error('Request timed out');
      } else {
        toast.error('Failed to create card');
      }
    } finally {
      setIsSubmitting(false);
    }
  }
  
  function handleKeyDown(e) {
    if(e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }
  
  if(!open) {
    return (
      <button 
        className="wf-btn wf-btn-outline w-full mt-2 opacity-60 hover:opacity-100"
        onClick={() => setOpen(true)}
      >
        + Add card
      </button>
    );
  }
  
  return (
    <div className="mt-2">
      <input 
        className="wf-input w-full" 
        placeholder="Card title…" 
        value={title} 
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="flex gap-2 mt-2">
        <button 
          className="wf-btn wf-btn-gradient flex-1" 
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
        <button className="wf-btn wf-btn-outline flex-1" onClick={() => { setOpen(false); setTitle(''); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const Column = memo(function Column({ column, index = 0, limit, boardVersion, onMove, onWipEdit, onRename, onDelete, onRefresh, selection, onToggleSelect, onOpenInspector }) {
  // const { withCSRF } = useCSRF(); // Temporarily disabled
  const withCSRF = (options) => options; // Pass through without CSRF
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(column.name);
  const [collapsed, setCollapsed] = useState(() => {
    // Persist collapsed state in localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`column-collapsed-${column.id}`);
      return saved === 'true';
    }
    return false;
  });
  const isOverLimit = limit && column.cards.length > limit;
  const atWipLimit = limit && column.cards.length === limit;
  
  // Save collapsed state to localStorage
  const handleToggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`column-collapsed-${column.id}`, String(newState));
    }
  };
  
  async function handleRename() {
    if(newName.trim() && newName !== column.name) {
      try {
        const res = await fetch('/api/board/apply', withCSRF({
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            op: 'rename_column', 
            args: { columnId: column.id, newName: newName.trim() },
            ifVersion: boardVersion,
            requestId: `rename-${column.id}-${Date.now()}`
          })
        }));
        
        if(res.ok) {
          onRefresh?.();
          toast.success('Column renamed');
        } else {
          const j = await res.json();
          if (j.error === 'version_conflict') {
            toast.info('Syncing board state...');
            onRefresh?.();
            return;
          }
          toast.error(j.error || 'Failed to rename');
        }
      } catch(err) {
        toast.error('Failed to rename column');
      }
    }
    setRenaming(false);
  }
  
  async function handleDelete() {
    if(confirm(`Delete column "${column.name}"? All cards will be lost.`)) {
      try {
        const res = await fetch('/api/board/apply', withCSRF({
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            op: 'delete_column', 
            args: { columnId: column.id },
            ifVersion: boardVersion,
            requestId: `delcol-${column.id}-${Date.now()}`
          })
        }));
        
        if(res.ok) {
          onRefresh?.();
          toast.success('Column deleted');
        } else {
          const j = await res.json();
          if (j.error === 'version_conflict') {
            toast.info('Syncing board state...');
            onRefresh?.();
            return;
          }
          toast.error(j.error || 'Failed to delete');
        }
      } catch(err) {
        toast.error('Failed to delete column');
      }
    }
  }
  
  return (
    <motion.div 
      data-column-id={column.id}
      data-testid={`column-${column.id}`}
      className="w-full bg-[var(--wf-soft)]/[0.05] border border-[var(--border)] rounded-xl p-4 min-h-[50vh] shadow-sm flex flex-col backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        boxShadow: '0 8px 32px rgba(229, 12, 120, 0.1)',
        borderColor: 'rgba(229, 12, 120, 0.2)',
        transition: { duration: 0.2 }
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={handleToggleCollapse}
            className="text-[var(--wf-soft)]/40 hover:text-[var(--wf-soft)]/60 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg className="w-4 h-4 transition-transform" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {renaming ? (
            <input
              className="wf-input flex-1 mr-2"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          ) : (
            <h3 
              data-testid={`column-header-${column.id}`}
              className={`text-lg font-semibold cursor-pointer hover:opacity-80 ${
                column.id === 'Done' ? 'text-[#4ade80]' : 'text-[var(--wf-soft)]'
              }`}
              onDoubleClick={() => setRenaming(true)}
              title="Double-click to rename"
            >
              {column.name}
            </h3>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            data-testid={`wip-badge-${column.id}`}
            data-state={isOverLimit ? 'over-limit' : 'within-limit'}
            className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-all ${
              isOverLimit 
                ? 'bg-[var(--wf-magenta)]/20 text-[var(--wf-magenta)] border border-[var(--wf-magenta)] animate-pulse shadow-lg shadow-[var(--wf-magenta)]/25' 
                : atWipLimit
                ? 'bg-[var(--wf-orange)]/20 text-[var(--wf-orange)] border border-[var(--wf-orange)]/50'
                : 'bg-[var(--wf-soft)]/10 text-[var(--wf-soft)]/75 hover:bg-[var(--wf-soft)]/20'
            }`}
            onClick={() => onWipEdit?.(column.id)}
            title={limit ? `WIP Limit: ${limit}` : 'Set WIP limit'}
          >
            {limit ? `${column.cards.length}/${limit}` : column.cards.length}
          </button>
          
          {column.id !== 'Backlog' && column.id !== 'Doing' && column.id !== 'Done' && (
            <button
              className="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100"
              onClick={handleDelete}
              title="Delete column"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Cards area - collapsible */}
      {!collapsed && (
        <div className="mt-4">
          <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <motion.div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            role="list"
            aria-label={`Column ${column.name}`}
            aria-describedby={limit ? `wip-${column.id}` : undefined}
            className={`space-y-3 flex-1 min-h-[100px] transition-all duration-300 ${
              snapshot.isDraggingOver 
                ? 'bg-gradient-to-b from-[var(--wf-magenta)]/10 to-transparent border-2 border-dashed border-[var(--wf-magenta)]/30 rounded-lg p-2' 
                : ''
            }`}
            data-droppable={column.id}
            animate={{
              backgroundColor: snapshot.isDraggingOver ? 'rgba(229, 12, 120, 0.05)' : 'transparent',
              scale: snapshot.isDraggingOver ? 1.01 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            {column.cards.length === 0 && !snapshot.isDraggingOver && (
              <motion.div 
                className="text-center text-[var(--wf-soft)]/30 py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Drop cards here or add new
              </motion.div>
            )}
            
            {/* Empty state */}
            {column.cards.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-[var(--wf-soft)]/40"
              >
                <div className="mb-2">📋</div>
                <div className="text-sm">No cards yet</div>
                <div className="text-xs mt-1">Drop cards here or add new ones</div>
              </motion.div>
            )}
            
            <AnimatePresence>
              {/* WIP descriptor for a11y */}
              {limit != null && (
                <span id={`wip-${column.id}`} className="sr-only">
                  {`WIP ${column.cards.length}/${limit}`}
                </span>
              )}
              {column.cards.map((card, index) => (
                <Card
                  key={card.id}
                  card={card}
                  column={column}
                  index={index}
                  onMove={onMove}
                  onUpdate={onRefresh}
                  onDelete={onRefresh}
                  selected={selection?.has(card.id)}
                  onSelectToggle={onToggleSelect}
                  onOpen={onOpenInspector}
                />
              ))}
            </AnimatePresence>
            {provided.placeholder}
          </motion.div>
        )}
      </Droppable>
      
      {/* Add card inline */}
      <AddCardInline columnId={column.id} boardVersion={boardVersion} onCreated={onRefresh} onRefresh={onRefresh} />
        </div>
      )}
    </motion.div>
  );
});

export default Column;