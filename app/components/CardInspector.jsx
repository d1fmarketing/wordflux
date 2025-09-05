'use client';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { X, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useCSRF } from '../lib/useCSRF'; // Temporarily disabled

export default function CardInspector({ open, card, column, boardVersion, onClose, onSaved }) {
  // const { withCSRF } = useCSRF(); // Temporarily disabled
  const withCSRF = (options) => options; // Pass through without CSRF
  const [form, setForm] = useState({ 
    title: '', 
    desc: '', 
    owner: '', 
    priority: 'm',
    labels: [],
    assignees: [],
    dueDate: '',
    points: ''
  });
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef(null);

  // Load card data when card changes
  useEffect(() => {
    if (card) {
      setForm({
        title: card.title || '',
        desc: card.desc || '',
        owner: card.owner || '',
        priority: card.priority || 'm',
        labels: card.labels || [],
        assignees: card.assignees || [],
        dueDate: card.dueDate || '',
        points: card.points || ''
      });
      setIsDirty(false);
    }
  }, [card]);

  // Auto-save on blur (after delay)
  const saveTimeoutRef = useRef();
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleBlur = () => {
    if (isDirty && card) {
      // Debounce save
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        save();
      }, 500);
    }
  };

  async function save() {
    if (!card || !isDirty) return;
    
    try {
      setSaving(true);
      const res = await fetch('/api/board/apply', withCSRF({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'update_card',
          args: {
            id: card.id,
            set: {
              title: form.title.trim(),
              description: form.desc,
              owner: form.owner,
              priority: form.priority,
              labels: form.labels,
              assignees: form.assignees,
              dueDate: form.dueDate || null,
              points: form.points ? Number(form.points) : null
            }
          },
          ifVersion: boardVersion,
          requestId: `upd-${card.id}-${Date.now()}`
        })
      }));
      
      if (res.ok) {
        setIsDirty(false);
        onSaved?.();
      } else {
        const err = await res.json();
        if (err.error === 'version_conflict') {
          toast.info('Syncing board state...');
          onSaved?.(); // This triggers mutate() in Board.jsx
          return;
        }
        toast.error(err.error || 'Save failed');
      }
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!card) return;
    if (!confirm('Delete this card?')) return;
    
    try {
      const res = await fetch('/api/board/apply', withCSRF({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'delete_card',
          args: { id: card.id },
          ifVersion: boardVersion,
          requestId: `del-${card.id}-${Date.now()}`
        })
      }));
      
      if (res.ok) {
        toast.success('Card deleted');
        onClose();
        onSaved?.();
      } else {
        const err = await res.json();
        if (err.error === 'version_conflict') {
          toast.info('Syncing board state...');
          onSaved?.(); // This triggers mutate() in Board.jsx
          return;
        }
        toast.error(err.error || 'Delete failed');
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        // Clear any pending saves before closing
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        // Clear any pending saves and save immediately
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        save();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isDirty, card, form]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-inspector-title"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-96 bg-[var(--wf-navy)] border-l border-[var(--border)] shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <h3 id="card-inspector-title" className="font-semibold text-[var(--wf-soft)]">
                Quick Edit
              </h3>
              {column && (
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-alt)] text-[var(--wf-soft)]/60">
                  {column.name}
                </span>
              )}
              {saving && (
                <span className="text-xs text-[var(--wf-magenta)] animate-pulse">
                  Saving...
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4" ref={formRef}>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)]"
                  placeholder="Card title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                  Description
                </label>
                <textarea
                  value={form.desc}
                  onChange={(e) => handleFieldChange('desc', e.target.value)}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)] resize-y"
                  rows={4}
                  placeholder="Add description..."
                />
              </div>

              {/* Priority & Points row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)]"
                  >
                    <option value="h">High</option>
                    <option value="m">Medium</option>
                    <option value="l">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => handleFieldChange('points', e.target.value)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)]"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                  Owner
                </label>
                <input
                  type="text"
                  value={form.owner}
                  onChange={(e) => handleFieldChange('owner', e.target.value)}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)]"
                  placeholder="Assign owner..."
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)]"
                />
              </div>

              {/* Labels (simplified for quick edit) */}
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                  Labels (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.labels.join(', ')}
                  onChange={(e) => handleFieldChange('labels', e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)]"
                  placeholder="bug, feature, urgent..."
                />
              </div>

              {/* Assignees (simplified) */}
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-1">
                  Assignees (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.assignees.join(', ')}
                  onChange={(e) => handleFieldChange('assignees', e.target.value.split(',').map(a => a.trim()).filter(Boolean))}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)]"
                  placeholder="alice, bob..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
            
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-xs text-[var(--wf-soft)]/40">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={save}
                disabled={!isDirty || saving}
                className="px-3 py-1.5 text-sm bg-[var(--wf-magenta)] hover:bg-[var(--wf-magenta)]/90 text-white rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}