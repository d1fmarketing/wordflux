'use client';
import { useState, useRef, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Board from './components/Board';
import FilterBar from './components/FilterBar';
import ChatPanel from './components/ChatPanel';
import UpgradePrompt, { ProBadge, useProStatus } from './components/UpgradePrompt';
import ErrorBoundary from './components/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { 
  safePrompt, 
  validateColumnId, 
  validateCardTitle, 
  checkRateLimit 
} from './utils/validation';

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ q:'', priority:[], owner:[] });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [boardMutate, setBoardMutate] = useState(null);
  const searchInputRef = useRef(null);
  const isPro = useProStatus();
  
  // Configurable toast duration for testing
  const toastDuration = Number(process.env.NEXT_PUBLIC_TOAST_DURATION_MS || 3000);
  
  // Keyboard shortcuts with validation and error handling
  const handleCreateCard = useCallback(async () => {
    try {
      // Rate limit check
      if (!checkRateLimit('create_card', 5, 60000)) {
        toast.error('Too many requests. Please wait.');
        return;
      }
      
      const columnInput = safePrompt('Which column? (Backlog/Doing/Done)', 'Backlog');
      if (!columnInput) return;
      
      const columnId = validateColumnId(columnInput);
      if (!columnId) {
        toast.error('Invalid column. Please use: Backlog, Doing, or Done');
        return;
      }
      
      const titleInput = safePrompt('Card title:');
      if (!titleInput) return;
      
      const title = validateCardTitle(titleInput);
      if (!title) {
        toast.error('Invalid title. Please use 1-100 characters.');
        return;
      }
      
      const response = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'create_card',
          args: {
            columnId,
            title,
            description: '',
            priority: 'm'
          }
        })
      });
      
      if (response.ok) {
        toast.success('Card created', { duration: toastDuration });
        if (boardMutate) boardMutate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create card');
      }
    } catch (error) {
      console.error('Create card error:', error);
      toast.error('Failed to create card');
    }
  }, [boardMutate, toastDuration]);
  
  useKeyboardShortcuts({
    onCreateCard: handleCreateCard,
    onSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onToggleChat: () => {
      setSidebarOpen(!sidebarOpen);
    },
    onGenerateBacklog: () => {
      document.getElementById('generate-backlog')?.click();
    },
    onRefresh: () => {
      if (boardMutate) boardMutate();
    }
  });

  const handleChatMessage = useCallback((msg) => {
    try {
      if(msg === '__refresh_board__') {
        // Board will auto-refresh via SWR
        if (boardMutate) boardMutate();
      } else if (msg?.type === 'board_update' && msg.board) {
        // Optimistically update board with new state from Chat
        if (boardMutate) {
          boardMutate({ board: msg.board }, false);
        }
      }
    } catch (error) {
      console.error('Chat message handling error:', error);
      toast.error('Failed to process chat update');
    }
  }, [boardMutate]);

  return (
    <ErrorBoundary 
      fallbackTitle="Application Error"
      fallbackMessage="The application encountered an error. Please refresh the page or try again."
      onReset={() => window.location.reload()}
    >
      <div className="flex flex-col lg:flex-row min-h-screen bg-[var(--wf-navy)] text-[var(--wf-soft)]" id="main">
      <Toaster 
        position="bottom-center"
        toastOptions={{
          duration: toastDuration,
          style: {
            background: 'var(--surface-alt)',
            color: 'var(--wf-soft)',
            border: '1px solid var(--border)',
          },
        }}
      />
      {/* Mobile menu toggle FAB */}
      <button 
        id="chat-toggle"
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] rounded-full shadow-lg text-white"
        onClick={() => setSidebarOpen(true)}
        aria-label="Toggle chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      <div 
        id="sidebar-backdrop"
        className={`${sidebarOpen ? 'block' : 'hidden'} lg:hidden fixed inset-0 bg-black/50 z-40`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Desktop Chat Sidebar - Hidden on mobile, visible on lg */}
      <aside 
        id="chat-sidebar"
        className="hidden lg:flex lg:static lg:w-[280px] flex-shrink-0 bg-[var(--wf-navy)] border-r border-[var(--border)] flex-col"
      >
        <ChatPanel onUserMessage={handleChatMessage} />
      </aside>
      
      {/* Mobile Chat Drawer - Only visible on mobile, toggled with transform */}
      <aside 
        id="chat-sidebar-mobile"
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-[280px] bg-[var(--wf-navy)] border-r border-[var(--border)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="relative">
          <button 
            className="absolute top-5 right-5 p-1 hover:bg-white/10 rounded z-10" 
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <ChatPanel onUserMessage={handleChatMessage} />
        </div>
      </aside>
      
      {/* Right: Main board area */}
      <main className="min-w-0 flex-1 flex flex-col">
        {/* Header - fixed height */}
        <header className="h-[var(--header-h)] px-4 lg:px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--wf-navy)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-bold">WordFlux</h1>
            {/* Voice button - gated by Pro */}
            <button 
              id="voice-connect"
              className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--wf-soft)]/60 hover:text-[var(--wf-soft)] hover:border-[var(--wf-magenta)] transition-colors text-sm"
              onClick={() => {
                if (!isPro) {
                  setShowUpgrade(true);
                } else {
                  window.location.href = '/voice';
                }
              }}
            >
              🎙 Connect Voice {!isPro && <ProBadge />}
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <select 
              id="board-select"
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)] cursor-pointer text-sm"
            >
              <option>Default Board</option>
            </select>
            
            <button 
              id="generate-backlog" 
              className="btn btn-secondary hidden sm:inline-flex"
              onClick={async () => {
                const promptInput = safePrompt('What kind of backlog items do you need?', 'Generate user stories for an e-commerce checkout flow');
                if (!promptInput) return;
                
                // Rate limit AI requests
                if (!checkRateLimit('ai_backlog', 3, 60000)) {
                  toast.error('Too many AI requests. Please wait.', { duration: toastDuration });
                  return;
                }
                
                const btn = document.getElementById('generate-backlog');
                
                try {
                  if (btn) {
                    btn.disabled = true;
                    btn.textContent = 'Generating...';
                  }
                  
                  const response = await fetch('/api/ai/backlog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptInput }),
                    signal: AbortSignal.timeout(30000) // 30 second timeout
                  });
                  
                  const result = await response.json();
                  
                  if (response.ok && result.created > 0) {
                    toast.success(`Generated ${result.created} cards!`, { duration: toastDuration });
                    // Use mutate instead of reload
                    if (boardMutate) boardMutate();
                  } else {
                    toast.error(result.error || `Generated ${result.created} cards. ${result.errors?.length || 0} errors.`, { duration: toastDuration });
                  }
                } catch (error) {
                  console.error('Backlog generation error:', error);
                  if (error.name === 'AbortError') {
                    toast.error('Request timed out. Please try again.', { duration: toastDuration });
                  } else {
                    toast.error('Failed to generate backlog', { duration: toastDuration });
                  }
                } finally {
                  if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Generate Backlog';
                  }
                }
              }}
            >
              Generate Backlog
            </button>
            
            <button id="open-campaign" className="btn btn-primary hidden sm:inline-flex">
              Generate Campaign
            </button>
            
            <button id="share-whatsapp" title="Share to WhatsApp" className="btn btn-secondary hidden sm:inline-flex">
              📱
            </button>
            
            <div className="menu">
              <button id="menu-more" className="btn btn-ghost" aria-haspopup="true" aria-expanded="false">
                ···
              </button>
              <div id="menu-panel" className="menu-panel">
                <button id="menu-export">Export CSV</button>
                <button id="menu-templates">Templates</button>
                <button id="menu-client-portal">Client Portal</button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Board content with filters */}
        <section className="wf-mainpanel">
          {/* Filters */}
          <FilterBar board={undefined} value={filters} onChange={setFilters} searchRef={searchInputRef} />
          <Board filters={filters} onBoardUpdate={setBoardMutate} />
        </section>
      </main>

      {/* Template Manager Modal */}
      <div id="template-modal" className="modal fixed inset-0 bg-black/60 hidden items-center justify-center z-[1000]">
        <div className="modal-content w-[520px] max-w-[90vw] bg-[#0f0f1d] border border-[var(--border)] rounded-xl shadow-2xl">
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-[var(--border)]">
            <strong className="text-white">Template Manager</strong>
            <button id="tm-close" className="btn btn-ghost text-lg">×</button>
          </div>
          <div className="p-4 text-white">
            <div className="mb-4">
              <label className="block text-xs text-[var(--muted)] mb-1.5">Template Name</label>
              <input id="tm-name" placeholder="Marketing Campaign Template" className="w-full p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-[var(--muted)] mb-1.5">Description</label>
              <textarea id="tm-desc" placeholder="Template for social media campaigns" className="w-full p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)] resize-y min-h-[60px]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-[var(--muted)] mb-1.5">Saved Templates</label>
              <select id="tm-list" size="5" className="w-full p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]"></select>
            </div>
            <div id="tm-status" className="text-xs text-[var(--success)] mb-3"></div>
            <div className="flex gap-2.5">
              <button id="tm-save" className="btn btn-secondary flex-1">Save Current Board</button>
              <button id="tm-apply" className="btn btn-primary flex-1">Apply Template</button>
              <button id="tm-delete" className="btn border-red-500 text-red-500">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Campaign Generator Modal */}
      <div id="campaign-modal" className="modal fixed inset-0 bg-black/60 hidden items-center justify-center z-[1000]">
        <div className="modal-content w-[520px] max-w-[90vw] bg-[#0f0f1d] border border-[var(--border)] rounded-xl shadow-2xl">
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-[var(--border)]">
            <strong className="text-white">GPT-5 Campaign Generator</strong>
            <button id="cg-close" className="btn btn-ghost text-lg">×</button>
          </div>
          <div className="p-4 grid gap-2.5 text-white">
            <label className="grid gap-1.5">
              <span className="text-xs opacity-90">Campaign Type</span>
              <select id="cg-type" className="p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]">
                <option>Social Media</option>
                <option>Email</option>
                <option>Content</option>
                <option>Full Digital</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs opacity-90">Client / Brand</span>
              <input id="cg-brand" placeholder="e.g., Nike" className="p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs opacity-90">Duration</span>
              <select id="cg-duration" className="p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]">
                <option>1 week</option>
                <option>2 weeks</option>
                <option>1 month</option>
                <option>3 months</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs opacity-90">Budget</span>
              <select id="cg-budget" className="p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs opacity-90">Target Audience</span>
              <input id="cg-audience" placeholder="e.g., Athletes 18-25" className="p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs opacity-90">Goals</span>
              <select id="cg-goals" multiple="" className="p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)] h-[84px]">
                <option>Brand Awareness</option>
                <option>Lead Gen</option>
                <option>Sales</option>
                <option>Engagement</option>
              </select>
              <span className="text-xs opacity-70">Tip: Cmd/Ctrl-click to select multiple</span>
            </label>
            <div className="flex justify-end gap-2.5 mt-1.5">
              <button id="cg-cancel" className="btn">Cancel</button>
              <button id="cg-generate" className="btn btn-primary">Generate</button>
            </div>
            <div id="cg-status" className="text-xs opacity-85"></div>
          </div>
        </div>
      </div>
      
      {/* Client Share Modal */}
      <div id="client-share-modal" className="modal fixed inset-0 bg-black/60 hidden items-center justify-center z-[1000]">
        <div className="modal-content w-[min(560px,92vw)] bg-[#0f0f1d] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-3 px-4 border-b border-[var(--border)]">
            <strong className="text-white">Client Portal</strong>
            <button id="cs-close" aria-label="Close" className="btn btn-ghost text-lg">×</button>
          </div>
          <div className="p-4 grid gap-3 text-white">
            <div className="text-xs text-[var(--muted)]">Share this link with your client. No login required.</div>
            <label className="grid gap-1.5">
              <span className="text-xs text-[var(--muted)]">Shareable Link</span>
              <div className="flex gap-2">
                <input id="cs-link" readOnly="" className="flex-1 p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]" />
                <button id="cs-copy" className="btn btn-secondary">Copy</button>
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs text-[var(--muted)]">WhatsApp (optional): Notify this number on approvals</span>
              <input id="cs-phone" placeholder="e.g., 15551234567" className="p-2.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)]" />
            </label>
            <div className="flex justify-end gap-2">
              <button id="cs-preview" className="btn">Preview</button>
              <button id="cs-wa" className="btn btn-secondary">WhatsApp</button>
              <button id="cs-save" className="btn btn-secondary">Save</button>
            </div>
            <div id="cs-status" className="text-xs text-[var(--muted)]"></div>
          </div>
        </div>
      </div>

      {/* Load client-side JavaScript */}
      <script src="/wordflux-client.js" defer></script>
      
      {/* Upgrade Prompt Modal */}
      {showUpgrade && (
        <UpgradePrompt 
          feature="Voice & Image" 
          onClose={() => setShowUpgrade(false)} 
        />
      )}
    </div>
    </ErrorBoundary>
  );
}