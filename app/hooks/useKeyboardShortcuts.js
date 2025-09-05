'use client';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useKeyboardShortcuts({ 
  onCreateCard,
  onSearch,
  onToggleChat,
  onGenerateBacklog,
  onRefresh
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );
      
      if (isTyping && e.key !== 'Escape') return;
      
      // Global shortcuts
      switch(e.key) {
        case 'c':
        case 'C':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onCreateCard?.();
          }
          break;
          
        case '/':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onSearch?.();
          }
          break;
          
        case 't':
        case 'T':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onToggleChat?.();
          }
          break;
          
        case 'g':
        case 'G':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onGenerateBacklog?.();
          }
          break;
          
        case 'r':
        case 'R':
          if (e.metaKey || e.ctrlKey) {
            // Let browser handle Cmd+R for refresh
            return;
          }
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onRefresh?.();
            toast.success('Board refreshed');
          }
          break;
          
        case '?':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            showShortcutsHelp();
          }
          break;
          
        case 'Escape':
          // Close any open modals
          document.querySelectorAll('.modal').forEach(modal => {
            if (!modal.classList.contains('hidden')) {
              modal.classList.add('hidden');
            }
          });
          break;
      }
      
      // Column navigation shortcuts (1, 2, 3)
      if (!e.metaKey && !e.ctrlKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const columnIndex = parseInt(e.key) - 1;
        const columns = document.querySelectorAll('[data-column-id]');
        if (columns[columnIndex]) {
          columns[columnIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCreateCard, onSearch, onToggleChat, onGenerateBacklog, onRefresh]);
}

function showShortcutsHelp() {
  const shortcuts = [
    { key: 'C', action: 'Create new card' },
    { key: '/', action: 'Focus search' },
    { key: 'T', action: 'Toggle chat panel' },
    { key: 'G', action: 'Generate backlog' },
    { key: 'R', action: 'Refresh board' },
    { key: '1/2/3', action: 'Jump to column' },
    { key: 'Esc', action: 'Close modals' },
    { key: 'Cmd+Enter', action: 'Save (in modals)' },
    { key: 'Cmd+Delete', action: 'Delete (in modals)' },
    { key: '?', action: 'Show this help' },
  ];
  
  const message = shortcuts
    .map(s => `${s.key.padEnd(12)} - ${s.action}`)
    .join('\n');
    
  toast((t) => (
    <div className="font-mono text-xs">
      <div className="font-bold mb-2">Keyboard Shortcuts:</div>
      <pre className="whitespace-pre">{message}</pre>
      <button 
        onClick={() => toast.dismiss(t.id)}
        className="mt-2 text-[var(--wf-magenta)] hover:underline"
      >
        Dismiss
      </button>
    </div>
  ), {
    duration: 10000,
    style: {
      maxWidth: '400px',
    }
  });
}