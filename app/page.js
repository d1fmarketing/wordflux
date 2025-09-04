import { getBoard } from './lib/board'

export const dynamic = 'force-dynamic'

export default async function Page() {
  // Server-render board to avoid any loader/skeleton in HTML
  const board = await getBoard(true)

  return (
    <div style={{height:'100vh',display:'flex',background:'var(--wf-navy)',color:'var(--wf-soft)',fontFamily:'var(--font-body, Inter), system-ui, sans-serif'}} id="main" suppressHydrationWarning>
      {/* Left: GPT-5 Chat Controller (33%) */}
      <aside style={{width:'33%',borderRight:'1px solid rgba(255,249,249,0.12)',display:'flex',flexDirection:'column',background:'var(--wf-navy)'}} suppressHydrationWarning>
        <div style={{padding:20,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff'}}>
          <h2 style={{margin:0,fontFamily:'var(--font-display, Poppins), system-ui, sans-serif'}}>GPT-5 Controller</h2>
          <p style={{margin:'6px 0 0',fontSize:12,opacity:0.95}}>AI controlando sua plataforma</p>
        </div>
        <div id="chat-log" style={{flex:1,padding:20,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{padding:12,borderRadius:8,background:'#16213e'}}>Eu controlo tudo. Pergunte: &quot;Gere uma campanha Black Friday&quot;</div>
        </div>
        <div style={{padding:16,borderTop:'1px solid rgba(255,249,249,0.12)'}}>
          <div style={{display:'flex',gap:10}}>
            <input id="chat-input" placeholder="Comandos para GPT-5..." style={{flex:1,padding:12,borderRadius:8,border:'1px solid rgba(255,249,249,0.12)',background:'#0f0f1d',color:'#fff'}} />
            <button id="chat-send" style={{padding:'12px 18px',borderRadius:8,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff',border:'none',cursor:'pointer'}}>Send</button>
          </div>
        </div>
      </aside>
      
      {/* Right: Kanban (67%) */}
      <main style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        <header style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,249,249,0.12)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--wf-navy)'}}> 
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <h1 style={{margin:0,fontSize:24,lineHeight:1.25}}>WordFlux</h1>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <select id="board-select" style={{padding:'6px 10px',borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)',cursor:'pointer'}}>
              <option>Default Board</option>
            </select>
            <button id="open-campaign" className="btn btn-primary">Generate Campaign</button>
            <button id="share-whatsapp" title="Share to WhatsApp" className="btn btn-secondary">📱 Share</button>
            <div className="menu">
              <button id="menu-more" className="btn btn-ghost" aria-haspopup="true" aria-expanded="false">···</button>
              <div id="menu-panel" className="menu-panel">
                <button id="menu-export">Export CSV</button>
                <button id="menu-templates">Templates</button>
                <button id="menu-client-portal">Client Portal</button>
              </div>
            </div>
          </div>
        </header>
        <section style={{flex:1,overflow:'auto',padding:24,background:'var(--wf-navy)'}}>
          <div id="empty-state" style={{display:'none',alignItems:'center',justifyContent:'center',minHeight:280,flexDirection:'column',gap:16}}>
            <h2 style={{margin:0}}>Vamos criar sua primeira campanha</h2>
            <small>Use IA para gerar uma campanha completa em segundos</small>
            <button id="empty-generate" className="btn btn-primary">Gerar Campanha</button>
          </div>
          <div id="kanban" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
            {board.columns.map(col => (
              <div key={col.id} style={{background:'rgba(255,249,249,0.035)',border:'1px solid rgba(255,249,249,0.12)',borderRadius:12,padding:16,minHeight:200}}>
                <h3 style={{margin:'8px 0 16px',fontSize:18,color: col.id==='Done' ? '#4ade80' : 'var(--wf-soft)'}}>{col.name} ({col.cards.length})</h3>
                {col.cards.map(card => (
                  <div key={card.id} style={{background:'#0f0f1d',padding:16,marginBottom:10,borderRadius:8,border:'1px solid rgba(255,249,249,0.08)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
                      <h4 style={{margin:0,fontSize:14,color:'var(--wf-soft)'}}>{card.title}</h4>
                      <span style={{fontSize:12,opacity:0.75}}>{card.owner || ''}</span>
                    </div>
                    {card.desc ? <p style={{margin:'6px 0 10px',fontSize:12,opacity:0.8}}>{card.desc}</p> : null}
                    {col.id !== 'Done' ? (
                      <button data-move
                        data-cardid={card.id}
                        data-from={col.id}
                        data-to={col.id==='Backlog'?'Doing':'Done'}
                        style={{fontSize:12,padding:'6px 10px',borderRadius:6,background:'#e50c78',color:'#fff',border:'none',cursor:'pointer'}}>
                        Move →
                      </button>
                    ) : (
                      <span style={{fontSize:12,color:'#4ade80'}}>✓ Complete</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>


      {/* Template Manager Modal */}
      <div id="template-modal" className="modal" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'none',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div className="modal-content" style={{width:520,maxWidth:'90vw',background:'#0f0f1d',border:'1px solid rgba(255,249,249,0.12)',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.08)'}}>
          <div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(255,249,249,0.12)'}}>
            <strong style={{color:'#fff'}}>Template Manager</strong>
            <button id="tm-close" className="btn btn-ghost" style={{fontSize:18}}>×</button>
          </div>
          <div style={{padding:16,color:'#fff'}}>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:12,color:'var(--muted)',marginBottom:6}}>Template Name</label>
              <input id="tm-name" placeholder="Marketing Campaign Template" style={{width:'100%',padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}} />
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:12,color:'var(--muted)',marginBottom:6}}>Description</label>
              <textarea id="tm-desc" placeholder="Template for social media campaigns with planning, creation, and analysis phases" style={{width:'100%',padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)',resize:'vertical',minHeight:60}} />
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:12,color:'var(--muted)',marginBottom:6}}>Saved Templates</label>
              <select id="tm-list" size="5" style={{width:'100%',padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}}></select>
            </div>
            <div id="tm-status" style={{fontSize:12,color:'var(--success)',marginBottom:12}}></div>
            <div style={{display:'flex',gap:10}}>
              <button id="tm-save" className="btn btn-secondary" style={{flex:1}}>Save Current Board</button>
              <button id="tm-apply" className="btn btn-primary" style={{flex:1}}>Apply Template</button>
              <button id="tm-delete" className="btn" style={{borderColor:'#dcdee3',color:'#b91c1c'}}>Delete</button>
            </div>
          </div>
        </div>
      </div>

      {/* Client Share Modal */}
      <div id="client-share-modal" className="modal" style={{display:'none',position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div className="modal-content" style={{width:'min(560px,92vw)',background:'#0f0f1d',border:'1px solid rgba(255,249,249,0.12)',borderRadius:12,boxShadow:'0 12px 32px rgba(0,0,0,0.08)',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid rgba(255,249,249,0.12)'}}>
            <strong style={{color:'#fff'}}>Client Portal</strong>
            <button id="cs-close" aria-label="Close" className="btn btn-ghost" style={{fontSize:18}}>×</button>
          </div>
          <div style={{padding:16,display:'grid',gap:12,color:'#fff'}}>
            <div style={{fontSize:12,color:'var(--muted)'}}>Share this link with your client. No login required.</div>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,color:'var(--muted)'}}>Shareable Link</span>
              <div style={{display:'flex',gap:8}}>
                <input id="cs-link" readOnly style={{flex:1,padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}} />
                <button id="cs-copy" className="btn btn-secondary">Copy</button>
              </div>
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,color:'var(--muted)'}}>WhatsApp (optional): Notify this number on approvals</span>
              <input id="cs-phone" placeholder="e.g., 15551234567 (country code + number)" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}} />
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button id="cs-preview" className="btn">Preview</button>
              <button id="cs-wa" className="btn btn-secondary">WhatsApp</button>
              <button id="cs-save" className="btn btn-secondary">Save</button>
            </div>
            <div id="cs-status" style={{fontSize:12,color:'var(--muted)'}}></div>
          </div>
        </div>
      </div>

      {/* Campaign Generator Modal */}
      <div id="campaign-modal" className="modal" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'none',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div className="modal-content" style={{width:520,maxWidth:'90vw',background:'#0f0f1d',border:'1px solid rgba(255,249,249,0.12)',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.08)'}}>
          <div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(255,249,249,0.12)'}}>
            <strong style={{color:'#fff'}}>GPT-5 Campaign Generator</strong>
            <button id="cg-close" className="btn btn-ghost" style={{fontSize:18}}>×</button>
          </div>
          <div style={{padding:16,display:'grid',gap:10,color:'#fff'}}>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Campaign Type</span>
              <select id="cg-type" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}}>
                <option>Social Media</option>
                <option>Email</option>
                <option>Content</option>
                <option>Full Digital</option>
              </select>
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Client / Brand</span>
              <input id="cg-brand" placeholder="e.g., Nike" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}} />
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Duration</span>
              <select id="cg-duration" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}}>
                <option>1 week</option>
                <option>2 weeks</option>
                <option>1 month</option>
                <option>3 months</option>
              </select>
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Budget</span>
              <select id="cg-budget" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Target Audience</span>
              <input id="cg-audience" placeholder="e.g., Athletes 18-25" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)'}} />
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Goals</span>
              <select id="cg-goals" multiple style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid rgba(255,249,249,0.12)',height:84}}>
                <option>Brand Awareness</option>
                <option>Lead Gen</option>
                <option>Sales</option>
                <option>Engagement</option>
              </select>
              <span style={{fontSize:12,opacity:0.7}}>Tip: Cmd/Ctrl-click to select multiple</span>
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:6}}>
              <button id="cg-cancel" className="btn">Cancel</button>
              <button id="cg-generate" className="btn btn-primary">Generate</button>
            </div>
            <div id="cg-status" style={{fontSize:12,opacity:0.85}}></div>
          </div>
        </div>
      </div>

      {/* Inline script: simple fetch() handlers for chat and moves */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__WF_INITIAL_BOARD = ${JSON.stringify(board)};`
        }}
      />
      <script src="/wordflux-client.js" defer></script>
    </div>
  )
}
