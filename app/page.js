import { getBoard } from './lib/board'

export const dynamic = 'force-dynamic'

export default async function Page() {
  // Server-render board to avoid any loader/skeleton in HTML  
  const board = await getBoard(true)

  return (
    <div 
      className="flex flex-col lg:flex-row min-h-screen bg-[var(--wf-navy)] text-[var(--wf-soft)]"
      id="main"
      suppressHydrationWarning
    >
      {/* Mobile menu toggle FAB */}
      <button 
        id="chat-toggle"
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] rounded-full shadow-lg text-white"
        aria-label="Toggle chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      <div 
        id="sidebar-backdrop"
        className="hidden lg:hidden fixed inset-0 bg-black/50 z-40"
      />
      
      {/* Left: GPT-5 Chat Controller */}
      <aside 
        id="chat-sidebar"
        className="fixed lg:relative top-0 bottom-0 left-0 w-[280px] lg:w-[280px] flex-shrink-0 bg-[var(--wf-navy)] border-r border-[var(--border)] flex flex-col z-50 lg:z-auto transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out"
        suppressHydrationWarning
      >
        {/* Chat header */}
        <div className="p-5 bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="m-0 font-[var(--font-display),Poppins] text-lg font-semibold">GPT-5 Controller</h2>
              <p className="mt-1 text-xs opacity-95">AI controlando sua plataforma</p>
            </div>
            <button 
              id="sidebar-close"
              className="lg:hidden p-1 hover:bg-white/10 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Chat messages */}
        <div id="chat-log" className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          <div className="p-3 rounded-lg bg-[var(--surface-alt)]">
            Eu controlo tudo. Pergunte: &quot;Gere uma campanha Black Friday&quot;
          </div>
        </div>
        
        {/* Chat input - sticky at bottom */}
        <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--wf-navy)]/90 backdrop-blur p-3">
          <div className="flex gap-2">
            <textarea 
              id="chat-input" 
              placeholder="Comandos para GPT-5..."
              className="flex-1 p-3 rounded-lg border border-[var(--border)] bg-[#0f0f1d] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)] resize-none"
              rows="1"
            />
            <div className="flex flex-col gap-1">
              <button 
                id="chat-send"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white font-semibold hover:shadow-lg transition-shadow text-sm"
              >
                Send
              </button>
              <button 
                id="chat-clear"
                className="px-4 py-1 rounded-lg border border-[var(--border)] text-[var(--wf-soft)]/60 hover:text-[var(--wf-soft)] text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Right: Main board area */}
      <main className="min-w-0 flex-1 flex flex-col">
        {/* Header - fixed height */}
        <header className="h-[var(--header-h)] px-4 lg:px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--wf-navy)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-bold">WordFlux</h1>
            {/* Voice button placeholder */}
            <button 
              id="voice-connect"
              className="hidden lg:inline-flex px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--wf-soft)]/60 hover:text-[var(--wf-soft)] hover:border-[var(--wf-magenta)] transition-colors text-sm"
            >
              🎙 Connect Voice
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <select 
              id="board-select"
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-alt)] text-white border border-[var(--border)] cursor-pointer text-sm"
            >
              <option>Default Board</option>
            </select>
            
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
        
        {/* Board content */}
        <section className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[var(--wf-navy)]">
          <div id="empty-state" className="hidden items-center justify-center min-h-[280px] flex-col gap-4">
            <h2 className="m-0 text-center">Vamos criar sua primeira campanha</h2>
            <small className="text-center">Use IA para gerar uma campanha completa em segundos</small>
            <button id="empty-generate" className="btn btn-primary">Gerar Campanha</button>
          </div>
          
          {/* Responsive grid for columns */}
          <div id="kanban" className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {board.columns.map(col => {
              const limit = board.wipLimits?.[col.id];
              const isOverLimit = limit && col.cards.length > limit;
              
              return (
                <div 
                  key={col.id}
                  data-column-id={col.id}
                  className="w-full bg-[var(--wf-soft)]/[0.035] border border-[var(--border)] rounded-xl p-4 min-h-[50vh]"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${col.id === 'Done' ? 'text-[#4ade80]' : 'text-[var(--wf-soft)]'}`}>
                      {col.name}
                    </h3>
                    <button
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        isOverLimit 
                          ? 'bg-[var(--wf-magenta)]/20 text-[var(--wf-magenta)] border border-[var(--wf-magenta)]' 
                          : 'bg-[var(--wf-soft)]/10 text-[var(--wf-soft)]/75 hover:bg-[var(--wf-soft)]/20'
                      }`}
                      data-wip-badge={col.id}
                      title={limit ? `WIP Limit: ${limit}` : 'Set WIP limit'}
                    >
                      {limit ? `${col.cards.length}/${limit}` : col.cards.length}
                    </button>
                  </div>
                  
                  {/* Droppable area for cards */}
                  <div className="space-y-3" data-droppable={col.id}>
                    {col.cards.map(card => (
                      <div 
                        key={card.id}
                        data-card-id={card.id}
                        className="bg-[var(--wf-soft)]/10 border border-[var(--wf-soft)]/20 rounded-xl p-4 shadow-card hover:bg-[var(--wf-soft)]/[0.15] transition-colors cursor-move"
                      >
                        <div className="flex justify-between gap-2 items-start mb-2">
                          <h4 className="text-sm font-medium text-[var(--wf-soft)]">
                            {card.title}
                          </h4>
                          <span className="text-xs text-[var(--wf-soft)]/60">
                            {card.owner || ''}
                          </span>
                        </div>
                        
                        {card.desc && (
                          <p className="text-xs text-[var(--wf-soft)]/80 mb-3">
                            {card.desc}
                          </p>
                        )}
                        
                        {/* Priority indicator */}
                        {card.priority && (
                          <div className="flex gap-1 mb-3">
                            <span className={`
                              inline-block px-2 py-0.5 text-xs rounded-full
                              ${card.priority === 'h' ? 'bg-[var(--wf-magenta)]/20 text-[var(--wf-magenta)]' : ''}
                              ${card.priority === 'm' ? 'bg-[var(--wf-orange)]/20 text-[var(--wf-orange)]' : ''}
                              ${card.priority === 'l' ? 'bg-[var(--wf-soft)]/10 text-[var(--wf-soft)]/60' : ''}
                            `}>
                              {card.priority === 'h' ? 'High' : card.priority === 'm' ? 'Medium' : 'Low'}
                            </span>
                          </div>
                        )}
                        
                        {col.id !== 'Done' ? (
                          <button 
                            data-move="true"
                            data-cardid={card.id}
                            data-from={col.id}
                            data-to={col.id === 'Backlog' ? 'Doing' : 'Done'}
                            className="text-xs px-3 py-1.5 rounded-md bg-[var(--wf-magenta)] text-white hover:bg-[var(--wf-orange)] transition-colors"
                          >
                            Move →
                          </button>
                        ) : (
                          <span className="text-xs text-[#4ade80]">✓ Complete</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
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
    </div>
  )
}