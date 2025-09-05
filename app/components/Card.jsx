'use client';
import React, { useState, memo } from 'react';
import { toast } from 'react-hot-toast';
import { Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Hash, Users, Tag, CheckSquare, Zap, ArrowRight, Edit3 } from 'lucide-react';
import CardEditModal from './CardEditModal';
import { useUndo } from '../lib/useUndo';

const Card = memo(function Card({ card, column, index, onMove, onUpdate, onDelete, selected, onSelectToggle, onOpen }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const { pushUndo } = useUndo();
  
  // Calculate checklist completion
  const checklistTotal = card.checklist?.length || 0;
  const checklistDone = card.checklist?.filter(item => item.done).length || 0;
  
  // Open inspector or modal on card click (not on button/checkbox clicks)
  function handleCardClick(e) {
    // Don't open if clicking on buttons or checkbox
    if (e.target.closest('button') || e.target.closest('[data-role="selector"]') || e.target.closest('[data-role="drag-handle"]')) return;
    
    // Use inspector if available, otherwise modal
    if (onOpen) {
      onOpen(card);
    } else {
      setShowEditModal(true);
    }
  }
  
  // Quick move with animation
  async function handleQuickMove(targetColumn) {
    setIsMoving(true);
    await onMove?.(card.id, column.id, targetColumn);
    setTimeout(() => setIsMoving(false), 500);
  }
  
  // Keyboard navigation handler
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleCardClick(e);
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      onSelectToggle?.(card.id);
    } else if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      // Same logic as Quick Move button
      const targetColumn = column.id === 'Backlog' ? 'Doing' : 
                          column.id === 'Doing' ? 'Done' : 
                          'Backlog';
      handleQuickMove(targetColumn);
    }
  }
  
  // Format due date display
  const formatDueDate = (date) => {
    if (!date) return null;
    const due = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-500' };
    if (diffDays === 0) return { text: 'Today', color: 'text-[var(--wf-orange)]' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-[var(--wf-magenta)]' };
    if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-[var(--wf-soft)]/60' };
    return { text: due.toLocaleDateString(), color: 'text-[var(--wf-soft)]/60' };
  };
  
  const dueDateInfo = formatDueDate(card.dueDate);
  
  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <motion.div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            data-card-id={card.id}
            data-testid={`card-${card.id}`}
            role="listitem"
            tabIndex={0}
            aria-label={`Card: ${card.title || 'untitled'}`}
            onKeyDown={handleKeyDown}
            className={`relative bg-[var(--wf-soft)]/[0.15] border rounded-xl p-4 shadow-lg hover:shadow-2xl cursor-pointer backdrop-blur-sm ${
              snapshot.isDragging ? 'opacity-50 rotate-2 scale-105' : ''
            } ${isMoving ? 'scale-95 opacity-70' : ''} ${
              selected ? 'border-[var(--wf-magenta)] ring-2 ring-[var(--wf-magenta)]/30' : 'border-[var(--wf-soft)]/25'
            }`}
            onClick={handleCardClick}
            onMouseEnter={() => setShowQuickActions(true)}
            onMouseLeave={() => setShowQuickActions(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
        >
          {/* Selection checkbox */}
          <button
            aria-label={selected ? 'Deselect card' : 'Select card'}
            data-role="selector"
            onClick={(e) => {
              e.stopPropagation();
              onSelectToggle?.(card.id);
            }}
            className={`absolute left-2 top-2 w-5 h-5 rounded border-2 transition-all z-10 ${
              selected 
                ? 'bg-[var(--wf-magenta)] border-[var(--wf-magenta)]' 
                : 'bg-transparent border-[var(--wf-soft)]/30 hover:border-[var(--wf-magenta)]/50'
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white m-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {/* Drag handle */}
          <div
            data-role="drag-handle"
            {...provided.dragHandleProps}
            className="absolute right-2 top-2 w-6 h-6 rounded cursor-move opacity-40 hover:opacity-100 transition-opacity z-10"
            title="Drag to move"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 6a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM15 2a2 2 0 11-4 0 2 2 0 014 0zM15 6a2 2 0 11-4 0 2 2 0 014 0zM15 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          
          <div className="flex justify-between gap-2 items-start mb-2 pl-8 pr-8">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={async () => {
                  if (editedTitle.trim() && editedTitle !== card.title) {
                    await onUpdate?.(card.id, { title: editedTitle.trim() });
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  } else if (e.key === 'Escape') {
                    setEditedTitle(card.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-sm font-medium bg-transparent border-b border-[var(--wf-magenta)] text-[var(--wf-soft)] outline-none px-1 -ml-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h4 
                className="text-sm font-medium text-[var(--wf-soft)] cursor-text hover:text-[var(--wf-magenta)] transition-colors"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                title="Double-click to edit"
              >
                {card.title}
              </h4>
            )}
            <div className="flex items-center gap-1">
              {card.points && (
                <motion.span 
                  className="text-xs text-[var(--wf-soft)]/60 flex items-center gap-0.5" 
                  title="Story Points"
                  whileHover={{ scale: 1.1 }}
                >
                  <Hash className="w-3 h-3" />
                  {card.points}
                </motion.span>
              )}
              
              {/* Quick Actions */}
              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                    className="flex gap-1"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditModal(true);
                      }}
                      className="p-1 rounded bg-[var(--wf-soft)]/10 hover:bg-[var(--wf-magenta)]/20"
                      title="Edit"
                    >
                      <Edit3 className="w-3 h-3" />
                    </motion.button>
                    {column.id !== 'Done' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickMove(column.id === 'Backlog' ? 'Doing' : 'Done');
                        }}
                        className="p-1 rounded bg-[var(--wf-soft)]/10 hover:bg-[var(--wf-orange)]/20"
                        title="Quick Move"
                      >
                        <Zap className="w-3 h-3" />
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {card.desc && (
            <p className="text-xs text-[var(--wf-soft)]/80 mb-3 line-clamp-2">
              {card.desc}
            </p>
          )}
          
          {/* Labels */}
          {card.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map(label => (
                <span
                  key={label}
                  className="px-1.5 py-0.5 bg-[var(--wf-magenta)]/20 text-[var(--wf-magenta)] rounded text-xs"
                >
                  <Tag className="inline w-2.5 h-2.5 mr-0.5" />
                  {label}
                </span>
              ))}
            </div>
          )}
          
          {/* Assignees */}
          {card.assignees?.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Users className="w-3 h-3 text-[var(--wf-soft)]/60" />
              <div className="flex gap-1">
                {card.assignees.map(assignee => (
                  <span
                    key={assignee}
                    className="w-6 h-6 rounded-full bg-[var(--wf-orange)]/20 text-[var(--wf-orange)] text-xs flex items-center justify-center font-semibold"
                    title={assignee}
                  >
                    {assignee.substring(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Bottom meta info */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Priority */}
              {card.priority && (
                <span 
                  data-testid={`priority-${card.priority}`}
                  className={`
                  inline-block px-2 py-0.5 text-xs rounded-full
                  ${card.priority === 'h' ? 'bg-[var(--wf-magenta)]/20 text-[var(--wf-magenta)]' : ''}
                  ${card.priority === 'm' ? 'bg-[var(--wf-orange)]/20 text-[var(--wf-orange)]' : ''}
                  ${card.priority === 'l' ? 'bg-[var(--wf-soft)]/10 text-[var(--wf-soft)]/60' : ''}
                `}>
                  {card.priority === 'h' ? 'High' : card.priority === 'm' ? 'Medium' : 'Low'}
                </span>
              )}
              
              {/* Due date */}
              {dueDateInfo && (
                <span className={`text-xs flex items-center gap-0.5 ${dueDateInfo.color}`}>
                  <Calendar className="w-3 h-3" />
                  {dueDateInfo.text}
                </span>
              )}
              
              {/* Checklist progress */}
              {checklistTotal > 0 && (
                <span className="text-xs text-[var(--wf-soft)]/60 flex items-center gap-0.5">
                  <CheckSquare className="w-3 h-3" />
                  {checklistDone}/{checklistTotal}
                </span>
              )}
              
              {/* Comment count */}
              {card.comments?.length > 0 && (
                <span className="text-xs text-[var(--wf-soft)]/60">
                  💬 {card.comments.length}
                </span>
              )}
            </div>
          </div>
          
          {/* Move button */}
          <div className="flex justify-between items-center mt-3">
            {column.id !== 'Done' ? (
              <motion.button 
                data-testid={`card-move-${card.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickMove(column.id === 'Backlog' ? 'Doing' : 'Done');
                }}
                className="group relative text-xs px-3 py-1.5 rounded-md bg-[var(--wf-magenta)] text-white hover:bg-[var(--wf-orange)] transition-all overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-1">
                  Move 
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-3 h-3 inline" />
                  </motion.span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[var(--wf-orange)] to-[var(--wf-magenta)]"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            ) : (
              <motion.span 
                className="text-xs text-[#4ade80] flex items-center gap-1"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✓ Complete
              </motion.span>
            )}
          </div>
        </motion.div>
      )}
    </Draggable>
    
    {/* Edit Modal */}
    {showEditModal && (
      <CardEditModal
        card={card}
        column={column}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          onUpdate?.();
          setShowEditModal(false);
        }}
        onDelete={() => {
          onDelete?.();
          setShowEditModal(false);
        }}
        onUndo={(inverseOp) => pushUndo(inverseOp)}
      />
    )}
  </>
  );
});

export default Card;
