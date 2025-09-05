'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Check, Calendar, Users, Tag, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CardEditModal({ card, column, onClose, onSave, onDelete, onUndo }) {
  const [title, setTitle] = useState(card?.title || '');
  const [desc, setDesc] = useState(card?.desc || '');
  const [priority, setPriority] = useState(card?.priority || 'm');
  const [labels, setLabels] = useState(card?.labels || []);
  const [assignees, setAssignees] = useState(card?.assignees || []);
  const [dueDate, setDueDate] = useState(card?.dueDate || '');
  const [points, setPoints] = useState(card?.points || '');
  const [checklist, setChecklist] = useState(card?.checklist || []);
  const [comments, setComments] = useState(card?.comments || []);
  const [newLabel, setNewLabel] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  
  const titleRef = useRef(null);
  
  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.metaKey && e.key === 'Enter') {
        handleSave();
      } else if (e.metaKey && e.key === 'Delete') {
        handleDelete();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [title, desc, priority, labels, assignees, dueDate, points, checklist]);
  
  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setSaving(true);
    try {
      const updates = {
        title,
        description: desc,
        priority,
        labels,
        assignees,
        dueDate: dueDate || null,
        points: points ? Number(points) : null,
        checklist
      };
      
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'update_card',
          args: {
            id: card.id,
            set: updates
          }
        })
      });
      
      if (res.ok) {
        toast.success('Card updated');
        onSave?.();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update card');
      }
    } catch (err) {
      toast.error('Failed to update card');
    } finally {
      setSaving(false);
    }
  }
  
  async function handleDelete() {
    if (!confirm('Delete this card?')) return;
    
    try {
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'delete_card',
          args: { id: card.id }
        })
      });
      
      if (res.ok) {
        // Create undo operation if handler provided
        if (onUndo) {
          onUndo({
            message: `Deleted "${card.title}"`,
            execute: async () => {
              const restoreRes = await fetch('/api/board/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ops: [{
                    op: 'create_card',
                    args: {
                      columnId: column?.id || card.status || 'Backlog',
                      title: card.title,
                      description: card.desc,
                      priority: card.priority,
                      labels: card.labels,
                      assignees: card.assignees,
                      owner: card.owner
                    }
                  }],
                  requestId: `undo-delete-${Date.now()}`
                })
              });
              if (!restoreRes.ok) throw new Error('Failed to restore');
              if (window.__WF_BOARD_MUTATE) window.__WF_BOARD_MUTATE();
            }
          });
        }
        onDelete?.();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete card');
      }
    } catch (err) {
      toast.error('Failed to delete card');
    }
  }
  
  async function handleAddComment() {
    if (!newComment.trim()) return;
    
    try {
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'comment',
          args: {
            id: card.id,
            text: newComment,
            author: 'User'
          }
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, {
          id: Date.now().toString(),
          text: newComment,
          author: 'User',
          createdAt: new Date().toISOString()
        }]);
        setNewComment('');
        toast.success('Comment added');
      }
    } catch (err) {
      toast.error('Failed to add comment');
    }
  }
  
  function addLabel() {
    if (newLabel && !labels.includes(newLabel)) {
      setLabels([...labels, newLabel]);
      setNewLabel('');
    }
  }
  
  function removeLabel(label) {
    setLabels(labels.filter(l => l !== label));
  }
  
  function addAssignee() {
    if (newAssignee && !assignees.includes(newAssignee)) {
      setAssignees([...assignees, newAssignee]);
      setNewAssignee('');
    }
  }
  
  function removeAssignee(assignee) {
    setAssignees(assignees.filter(a => a !== assignee));
  }
  
  function addChecklistItem() {
    if (newChecklistItem) {
      setChecklist([...checklist, {
        id: Date.now().toString(),
        text: newChecklistItem,
        done: false
      }]);
      setNewChecklistItem('');
    }
  }
  
  function toggleChecklistItem(id) {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    ));
  }
  
  function removeChecklistItem(id) {
    setChecklist(checklist.filter(item => item.id !== id));
  }
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--wf-navy)] border border-[var(--border)] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="text-xs px-2 py-1 rounded bg-[var(--surface-alt)] text-[var(--wf-soft)]/60">
              {column?.name || 'Unknown'}
            </div>
            <div className="text-xs text-[var(--wf-soft)]/40">
              ID: {card.id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">Title</label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] placeholder-[var(--wf-soft)]/40"
                placeholder="Card title"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] placeholder-[var(--wf-soft)]/40 min-h-[100px] resize-y"
                placeholder="Add a description..."
              />
            </div>
            
            {/* Priority & Points */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)]"
                >
                  <option value="l">Low</option>
                  <option value="m">Medium</option>
                  <option value="h">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">
                  <Hash className="inline w-3 h-3 mr-1" />
                  Story Points
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)]"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            
            {/* Due Date */}
            <div>
              <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">
                <Calendar className="inline w-3 h-3 mr-1" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)]"
              />
            </div>
            
            {/* Labels */}
            <div>
              <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">
                <Tag className="inline w-3 h-3 mr-1" />
                Labels
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {labels.map(label => (
                  <span
                    key={label}
                    className="px-2 py-1 bg-[var(--wf-magenta)]/20 text-[var(--wf-magenta)] rounded-full text-xs flex items-center gap-1"
                  >
                    {label}
                    <button
                      onClick={() => removeLabel(label)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                  className="flex-1 px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] text-sm"
                  placeholder="Add label..."
                />
                <button
                  onClick={addLabel}
                  className="px-3 py-2 bg-[var(--wf-magenta)]/20 hover:bg-[var(--wf-magenta)]/30 text-[var(--wf-magenta)] rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Assignees */}
            <div>
              <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">
                <Users className="inline w-3 h-3 mr-1" />
                Assignees
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {assignees.map(assignee => (
                  <span
                    key={assignee}
                    className="px-2 py-1 bg-[var(--wf-orange)]/20 text-[var(--wf-orange)] rounded-full text-xs flex items-center gap-1"
                  >
                    {assignee}
                    <button
                      onClick={() => removeAssignee(assignee)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAssignee())}
                  className="flex-1 px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] text-sm"
                  placeholder="Add assignee..."
                />
                <button
                  onClick={addAssignee}
                  className="px-3 py-2 bg-[var(--wf-orange)]/20 hover:bg-[var(--wf-orange)]/30 text-[var(--wf-orange)] rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Checklist */}
            <div>
              <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">
                <Check className="inline w-3 h-3 mr-1" />
                Checklist
              </label>
              <div className="space-y-2 mb-2">
                {checklist.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-[var(--surface-alt)] rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="rounded border-[var(--border)]"
                    />
                    <span className={`flex-1 text-sm ${item.done ? 'line-through opacity-60' : ''}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeChecklistItem(item.id)}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  className="flex-1 px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] text-sm"
                  placeholder="Add checklist item..."
                />
                <button
                  onClick={addChecklistItem}
                  className="px-3 py-2 bg-[var(--surface-alt)] hover:bg-[var(--surface-alt)]/80 text-[var(--wf-soft)] rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Comments */}
            <div>
              <label className="block text-xs text-[var(--wf-soft)]/60 mb-2">Comments</label>
              <div className="space-y-2 mb-2">
                {comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-[var(--surface-alt)] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--wf-soft)]/80">
                        {comment.author}
                      </span>
                      <span className="text-xs text-[var(--wf-soft)]/40">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--wf-soft)]">{comment.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg text-[var(--wf-soft)] text-sm min-h-[60px] resize-y"
                  placeholder="Add a comment..."
                />
                <button
                  onClick={handleAddComment}
                  className="px-3 py-2 bg-[var(--wf-magenta)] hover:bg-[var(--wf-magenta)]/90 text-white rounded-lg transition-colors self-end"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
          >
            Delete Card
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--surface-alt)] hover:bg-[var(--surface-alt)]/80 text-[var(--wf-soft)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}