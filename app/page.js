import { getBoard } from './lib/board'

export const dynamic = 'force-dynamic'

export default async function Page() {
  // Server-render board to avoid any loader/skeleton in HTML
  const board = await getBoard(true)

  return (
    <div style={{height:'100vh',display:'flex',background:'var(--wf-navy)',color:'var(--wf-soft)',fontFamily:'var(--font-body, Inter), system-ui, sans-serif'}} id="main" suppressHydrationWarning>
      {/* Left: GPT Assistant (33%) */}
      <aside style={{width:'33%',borderRight:'1px solid rgba(255,249,249,0.12)',display:'flex',flexDirection:'column'}} suppressHydrationWarning>
        <div style={{padding:20,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff'}}>
          <h2 style={{margin:0,fontFamily:'var(--font-display, Poppins), system-ui, sans-serif'}}>GPT-5 Assistant</h2>
          <p style={{margin:'6px 0 0',fontSize:12,opacity:0.95}}>Clarity in motion</p>
        </div>
        <div id="chat-log" style={{flex:1,padding:20,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{padding:12,borderRadius:8,background:'#16213e'}}>I help organize work. Try asking: &quot;What should we prioritize?&quot;</div>
        </div>
        <div style={{padding:16,borderTop:'1px solid rgba(255,249,249,0.12)'}}>
          <div style={{display:'flex',gap:10}}>
            <input id="chat-input" placeholder="Ask GPT-5..." style={{flex:1,padding:12,borderRadius:8,border:'1px solid #333',background:'#0f0f1d',color:'#fff'}} />
            <button id="chat-send" style={{padding:'12px 18px',borderRadius:8,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff',border:'none',cursor:'pointer'}}>Send</button>
          </div>
        </div>
        <div style={{padding:'12px 20px',borderTop:'1px solid rgba(255,249,249,0.12)',fontSize:12,opacity:0.9}}>
          <strong>Pricing</strong>: Free (1 workspace, 2 users) · Pro $15/user/mo · Team $25/user/mo · 60% revenue share for Brazilian operators
        </div>
      </aside>

      {/* Right: Kanban (67%) */}
      <main style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        <header style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,249,249,0.12)',display:'flex',alignItems:'center',justifyContent:'space-between'}}> 
          <div>
            <h1 style={{margin:0,fontSize:20,lineHeight:1.2}}>WordFlux Board</h1>
            <div style={{opacity:0.85,fontSize:12}}>Magenta/Orange accents • Dark theme • Gradient header</div>
          </div>
          <div style={{padding:'6px 10px',borderRadius:8,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff',fontWeight:600}}>Pro $15/user/month</div>
        </header>
        <section style={{flex:1,overflow:'auto',padding:24}}>
          <div id="kanban" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {board.columns.map(col => (
              <div key={col.id} style={{background:'rgba(255,249,249,0.035)',border:'1px solid rgba(255,249,249,0.12)',borderRadius:12,padding:12,minHeight:200}}>
                <h3 style={{margin:'2px 0 10px',fontSize:16,color: col.id==='Done' ? '#4ade80' : 'var(--wf-soft)'}}>{col.name} ({col.cards.length})</h3>
                {col.cards.map(card => (
                  <div key={card.id} style={{background:'#0f0f1d',padding:12,marginBottom:10,borderRadius:8,border:'1px solid rgba(255,249,249,0.08)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
                      <h4 style={{margin:0,fontSize:14}}>{card.title}</h4>
                      <span style={{fontSize:11,opacity:0.75}}>{card.owner || ''}</span>
                    </div>
                    {card.desc ? <p style={{margin:'6px 0 10px',fontSize:12,opacity:0.8}}>{card.desc}</p> : null}
                    {col.id !== 'Done' ? (
                      <button data-move
                        data-cardid={card.id}
                        data-from={col.id}
                        data-to={col.id==='Backlog'?'Doing':'Done'}
                        style={{padding:'6px 10px',fontSize:12,borderRadius:6,background:'#e50c78',color:'#fff',border:'none',cursor:'pointer'}}>
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

      {/* Inline script: simple fetch() handlers for chat and moves */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(() => {
  const initialBoard = ${JSON.stringify(board)};
  const log = document.getElementById('chat-log');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const kanban = document.getElementById('kanban');

  // --- Board Persistence (localStorage-first) ---
  function loadBoard() {
    try {
      const raw = localStorage.getItem('wf.board');
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialBoard;
  }
  function saveBoard(b) {
    try { localStorage.setItem('wf.board', JSON.stringify(b)); } catch {}
  }

  function h(tag, attrs = {}, children = []){
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (k === 'style' && typeof v === 'object') {
        Object.assign(el.style, v);
      } else if (k.startsWith('data-')) {
        el.setAttribute(k, v);
      } else {
        el[k] = v;
      }
    });
    children.forEach(c => el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return el;
  }

  function renderBoard(b){
    if (!kanban) return;
    kanban.innerHTML = '';
    const gridStyle = { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' };
    Object.assign(kanban.style, gridStyle);
    b.columns.forEach(col => {
      const colEl = h('div', { style: { background:'rgba(255,249,249,0.035)', border:'1px solid rgba(255,249,249,0.12)', borderRadius:'12px', padding:'12px', minHeight:'200px' } });
      const title = h('h3', { style: { margin:'2px 0 10px', fontSize:'16px', color: (col.id==='Done' ? '#4ade80' : 'var(--wf-soft)') } }, [ col.name + ' (' + col.cards.length + ')' ]);
      colEl.appendChild(title);
      col.cards.forEach(card => {
        const cardEl = h('div', { style: { background:'#0f0f1d', padding:'12px', marginBottom:'10px', borderRadius:'8px', border:'1px solid rgba(255,249,249,0.08)' } });
        const row = h('div', { style: { display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'center' } });
        row.appendChild(h('h4', { style: { margin:0, fontSize:'14px' } }, [ card.title ]));
        row.appendChild(h('span', { style: { fontSize:'11px', opacity:0.75 } }, [ card.owner || '' ]));
        cardEl.appendChild(row);
        if (card.desc) cardEl.appendChild(h('p', { style: { margin:'6px 0 10px', fontSize:'12px', opacity:0.8 } }, [ card.desc ]));
        if (col.id !== 'Done') {
          const to = (col.id === 'Backlog' ? 'Doing' : 'Done');
          const btn = h('button', { 
            textContent: 'Move →',
            style: { padding:'6px 10px', fontSize:'12px', borderRadius:'6px', background:'#e50c78', color:'#fff', border:'none', cursor:'pointer' }
          });
          btn.dataset.move = '1';
          btn.dataset.cardid = card.id;
          btn.dataset.from = col.id;
          btn.dataset.to = to;
          cardEl.appendChild(btn);
        } else {
          cardEl.appendChild(h('span', { style: { fontSize:'12px', color:'#4ade80' } }, ['✓ Complete']));
        }
        colEl.appendChild(cardEl);
      });
      kanban.appendChild(colEl);
    });
    // Wire up move buttons after render
    kanban.querySelectorAll('[data-move]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const cardId = btn.getAttribute('data-cardid');
        const from = btn.getAttribute('data-from');
        const to = btn.getAttribute('data-to');
        // Update local board immediately (optimistic UI)
        const fromCol = board.columns.find(c=>c.id===from);
        const toCol = board.columns.find(c=>c.id===to);
        if (!fromCol || !toCol) return;
        const idx = fromCol.cards.findIndex(c=>c.id===cardId);
        if (idx < 0) return;
        const [card] = fromCol.cards.splice(idx,1);
        toCol.cards.push(card);
        saveBoard(board);
        renderBoard(board);
        try {
          const res = await fetch('/api/board/move-card', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ cardId, fromColumnId: from, toColumnId: to })
          });
          const data = await res.json();
          if (data?.board) { board = data.board; saveBoard(board); renderBoard(board); }
        } catch {}
      });
    });
  }

  let board = loadBoard();
  // If nothing in localStorage, seed it with initial SSR board
  if (!board) { board = initialBoard; }
  saveBoard(board);
  renderBoard(board);

  function addBubble(role, text){
    const div = document.createElement('div');
    div.style.padding = '12px';
    div.style.borderRadius = '8px';
    div.style.background = role === 'user' ? '#1a1a2e' : '#16213e';
    div.style.whiteSpace = 'pre-wrap';
    div.textContent = text;

    // If assistant, parse for actionable suggestions and render inline "Apply" buttons
    if (role === 'assistant') {
      const actions = parseAssistantActions(text);
      if (actions.length) {
        const bar = document.createElement('div');
        bar.style.marginTop = '8px';
        bar.style.display = 'flex';
        bar.style.flexWrap = 'wrap';
        bar.style.gap = '6px';
        actions.forEach(action => {
          const btn = document.createElement('button');
          btn.textContent = action.label;
          btn.style.padding = '4px 8px';
          btn.style.fontSize = '11px';
          btn.style.borderRadius = '999px';
          btn.style.background = 'linear-gradient(135deg,#e50c78,#ef450a)';
          btn.style.color = '#fff';
          btn.style.border = 'none';
          btn.style.cursor = 'pointer';
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            await executeAssistantAction(action, btn);
          });
          bar.appendChild(btn);
        });
        div.appendChild(bar);
      }
    }

    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  // --- Assistant Action Parsing & Execution ---
  function resolveColumnId(label){
    if (!label) return null;
    var t = String(label).trim().replace(/^['"]|['"]$/g,'');
    var low = t.toLowerCase();
    var match = board.columns.find(function(c){ return c.id.toLowerCase() === low; });
    if (match) return match.id;
    match = board.columns.find(function(c){ return (c.name||'').toLowerCase() === low; });
    return match ? match.id : null;
  }

  function getCardLocation(cardId){
    for (var i=0;i<board.columns.length;i++){
      var col = board.columns[i];
      var idx = col.cards.findIndex(function(c){ return c.id === cardId; });
      if (idx >= 0) return { columnId: col.id, index: idx };
    }
    return null;
  }

  function showSuccess(el, msg){
    try{
      var s = document.createElement('span');
      s.textContent = ' ' + (msg || 'Applied ✓');
      s.style.marginLeft = '6px';
      s.style.fontSize = '11px';
      s.style.color = '#4ade80';
      el.parentElement && el.parentElement.appendChild(s);
      setTimeout(function(){ s.remove(); }, 1600);
    } catch {}
  }

  function parseAssistantActions(text){
    var actions = [];
    if (!text || typeof text !== 'string') return actions;

    // Move card: "Move <cardId> to <Column>" or "Move card <cardId> to <Column>" (optional: from <Column>)
    try {
      var moveRe = /(\b|^)Move\s+(?:card\s+)?([A-Za-z0-9._-]+)(?:\s+from\s+[A-Za-z0-9 _-]+)?\s+to\s+([A-Za-z0-9 _-]+)/gi;
      var m;
      while ((m = moveRe.exec(text))){
        var cardId = (m[2]||'').trim();
        var toLabel = (m[3]||'').trim();
        var loc = getCardLocation(cardId);
        var toId = resolveColumnId(toLabel);
        if (loc && toId && loc.columnId !== toId){
          actions.push({ type:'move_card', cardId: cardId, toColumnId: toId, label: 'Apply: Move ' + cardId + ' to ' + toId });
        }
      }
    } catch {}

    // Set WIP limit: "Set WIP limit (for) <Column> to <N>"
    try {
      var wipRe = /Set\s+WIP\s+limit\s+(?:for\s+)?([A-Za-z0-9 _-]+)\s+(?:to|=)\s*(\d+)/gi;
      var w;
      while ((w = wipRe.exec(text))){
        var colLabel = (w[1]||'').trim();
        var limitNum = parseInt((w[2]||'').trim(), 10);
        var cid = resolveColumnId(colLabel);
        if (cid && !isNaN(limitNum) && limitNum >= 0){
          actions.push({ type:'set_wip_limit', columnId: cid, limit: limitNum, label: 'Apply: WIP ' + cid + ' = ' + limitNum });
        }
      }
    } catch {}

    // Merge columns: "Merge (columns) <Source> into <Target> (as <NewName>)"
    try {
      var mergeRe = /Merge\s+(?:columns?\s*)?([A-Za-z0-9 _-]+)\s+(?:into|to|->|→)\s+([A-Za-z0-9 _-]+)(?:\s+as\s+['"]?([^'"\n]+)['"]?)?/gi;
      var g;
      while ((g = mergeRe.exec(text))){
        var src = resolveColumnId((g[1]||'').trim());
        var tgt = resolveColumnId((g[2]||'').trim());
        var newName = g[3] ? String(g[3]).trim() : null;
        if (src && tgt && src !== tgt){
          var lab = 'Apply: Merge ' + src + ' → ' + tgt + (newName ? (' as ' + newName) : '');
          actions.push({ type:'merge_columns', sourceId: src, targetId: tgt, newName: newName, label: lab });
        }
      }
    } catch {}

    return actions;
  }

  async function executeAssistantAction(action, btn){
    if (!action || !action.type) return;
    try{
      if (action.type === 'move_card'){
        var loc = getCardLocation(action.cardId);
        var toCol = board.columns.find(function(c){ return c.id === action.toColumnId; });
        if (!loc || !toCol){ btn.disabled = false; return; }
        var fromCol = board.columns.find(function(c){ return c.id === loc.columnId; });
        var moved = fromCol.cards.splice(loc.index, 1)[0];
        toCol.cards.push(moved);
        saveBoard(board);
        renderBoard(board);
        try{
          var r = await fetch('/api/board/move-card', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ fromColumnId: loc.columnId, toColumnId: action.toColumnId, cardId: action.cardId })
          });
          var dj = await r.json();
          if (dj && dj.board){ board = dj.board; saveBoard(board); renderBoard(board); }
        } catch {}
        showSuccess(btn, 'Applied ✓');
        return;
      }

      if (action.type === 'set_wip_limit'){
        board.wipLimits = board.wipLimits || {};
        board.wipLimits[action.columnId] = action.limit;
        saveBoard(board);
        try{
          var rw = await fetch('/api/board/apply', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ op:'set_wip_limit', args: { columnId: action.columnId, limit: action.limit } })
          });
          var wj = await rw.json();
          if (wj && wj.board){ board = wj.board; saveBoard(board); }
        } catch {}
        renderBoard(board);
        showSuccess(btn, 'Applied ✓');
        return;
      }

      if (action.type === 'merge_columns'){
        try{
          var rm = await fetch('/api/board/apply', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ op:'merge_columns', args: { sourceId: action.sourceId, targetId: action.targetId, newName: action.newName || undefined } })
          });
          var mj = await rm.json();
          if (mj && mj.board){ board = mj.board; saveBoard(board); renderBoard(board); showSuccess(btn, 'Applied ✓'); return; }
        } catch {}
        // Fallback: naive local merge
        var srcIdx = board.columns.findIndex(function(c){ return c.id === action.sourceId; });
        var tgtIdx = board.columns.findIndex(function(c){ return c.id === action.targetId; });
        if (srcIdx >= 0 && tgtIdx >= 0 && srcIdx !== tgtIdx){
          var srcCol = board.columns[srcIdx];
          var tgtCol = board.columns[tgtIdx];
          tgtCol.cards = srcCol.cards.concat(tgtCol.cards);
          if (action.newName){ tgtCol.name = action.newName; tgtCol.id = action.newName; }
          board.columns.splice(srcIdx,1);
          if (board.wipLimits){ delete board.wipLimits[action.sourceId]; }
          saveBoard(board);
          renderBoard(board);
          showSuccess(btn, 'Applied ✓');
        }
        return;
      }

    } finally {
      // keep button disabled after success
    }
  }

  async function send(){
    const msg = (input.value || '').trim();
    if(!msg) return;
    addBubble('user', msg);
    input.value='';
    try{
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      addBubble('assistant', data.response || data.reply || 'OK');
    } catch(e){ addBubble('assistant', 'Error contacting AI.'); }
  }

  sendBtn?.addEventListener('click', send);
  input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') send(); });

  // Legacy server-rendered buttons (present on first load before client render)
  document.querySelectorAll('[data-move]')?.forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); });
  });
})();
          `
        }}
      />
    </div>
  )
}
