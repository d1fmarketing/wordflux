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
        {/* Collapsible History */}
        <div style={{borderTop:'1px solid rgba(255,249,249,0.12)'}}>
          <button id="history-toggle" style={{width:'100%',textAlign:'left',padding:'10px 20px',background:'transparent',color:'var(--wf-soft)',border:'none',cursor:'pointer'}}>
            📋 History
          </button>
          <div id="history-panel" style={{display:'none',padding:'0 20px 12px'}}>
            <ul id="history-list" style={{listStyle:'none',margin:0,padding:0,maxHeight:160,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}></ul>
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
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <select id="board-select" style={{padding:'6px 10px',borderRadius:8,background:'#1a1a2e',color:'#fff',border:'1px solid #333',cursor:'pointer'}}>
              <option>Default Board</option>
            </select>
            <span id="board-meta" style={{fontSize:12,opacity:0.8}}>Board 1 of 1</span>
            <div style={{padding:'6px 10px',borderRadius:8,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff',fontWeight:600}}>Pro $15/user/month</div>
            <button id="export-csv" style={{padding:'8px 12px',borderRadius:8,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff',border:'none',cursor:'pointer',fontWeight:600}}>Export CSV</button>
            <button id="share-whatsapp" title="Share to WhatsApp" style={{padding:'8px 12px',borderRadius:8,background:'linear-gradient(135deg,#25D366,#128C7E)',color:'#fff',border:'none',cursor:'pointer',fontWeight:700}}>📱 Share</button>
            <button id="open-campaign" style={{padding:'10px 14px',borderRadius:8,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff',border:'none',cursor:'pointer',fontWeight:700}}>Generate Campaign</button>
          </div>
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

      {/* Campaign Generator Modal */}
      <div id="campaign-modal" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'none',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div style={{width:520,maxWidth:'90vw',background:'#0f0f1d',border:'1px solid rgba(255,249,249,0.12)',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.4)'}}>
          <div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(255,249,249,0.12)'}}>
            <strong>GPT-5 Campaign Generator</strong>
            <button id="cg-close" style={{background:'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:18}}>×</button>
          </div>
          <div style={{padding:16,display:'grid',gap:10}}>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Campaign Type</span>
              <select id="cg-type" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid #333'}}>
                <option>Social Media</option>
                <option>Email</option>
                <option>Content</option>
                <option>Full Digital</option>
              </select>
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Client / Brand</span>
              <input id="cg-brand" placeholder="e.g., Nike" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid #333'}} />
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Duration</span>
              <select id="cg-duration" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid #333'}}>
                <option>1 week</option>
                <option>2 weeks</option>
                <option>1 month</option>
                <option>3 months</option>
              </select>
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Budget</span>
              <select id="cg-budget" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid #333'}}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Target Audience</span>
              <input id="cg-audience" placeholder="e.g., Athletes 18-25" style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid #333'}} />
            </label>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,opacity:0.9}}>Goals</span>
              <select id="cg-goals" multiple style={{padding:10,borderRadius:8,background:'#16213e',color:'#fff',border:'1px solid #333',height:84}}>
                <option>Brand Awareness</option>
                <option>Lead Gen</option>
                <option>Sales</option>
                <option>Engagement</option>
              </select>
              <span style={{fontSize:11,opacity:0.7}}>Tip: Cmd/Ctrl-click to select multiple</span>
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:6}}>
              <button id="cg-cancel" style={{padding:'10px 14px',borderRadius:8,background:'#1a1a2e',color:'#fff',border:'1px solid #333',cursor:'pointer'}}>Cancel</button>
              <button id="cg-generate" style={{padding:'10px 14px',borderRadius:8,background:'linear-gradient(135deg,#e50c78,#ef450a)',color:'#fff',border:'none',cursor:'pointer',fontWeight:700}}>Generate</button>
            </div>
            <div id="cg-status" style={{fontSize:12,opacity:0.85}}></div>
          </div>
        </div>
      </div>

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
  const boardSelect = document.getElementById('board-select');
  const boardMeta = document.getElementById('board-meta');
  const shareBtn = document.getElementById('share-whatsapp');
  const historyToggle = document.getElementById('history-toggle');
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const campaignModal = document.getElementById('campaign-modal');
  const openCampaignBtn = document.getElementById('open-campaign');
  const cgClose = document.getElementById('cg-close');
  const cgCancel = document.getElementById('cg-cancel');
  const cgGenerate = document.getElementById('cg-generate');
  const cgStatus = document.getElementById('cg-status');
  const cgType = document.getElementById('cg-type');
  const cgBrand = document.getElementById('cg-brand');
  const cgDuration = document.getElementById('cg-duration');
  const cgBudget = document.getElementById('cg-budget');
  const cgAudience = document.getElementById('cg-audience');
  const cgGoals = document.getElementById('cg-goals');

  // --- Multi-Board Management + Persistence ---
  function slugName(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function getBoards(){ try{ return JSON.parse(localStorage.getItem('wf.boards')||'[]'); }catch{ return []; } }
  function setBoards(arr){ try{ localStorage.setItem('wf.boards', JSON.stringify(arr)); }catch{} }
  function getCurrentBoardId(){
    var list = getBoards();
    var cur = list.find(function(x){ return x.current; });
    return cur ? cur.id : (list[0] ? list[0].id : null);
  }
  function setCurrentBoardId(id){
    var list = getBoards();
    list.forEach(function(b){ b.current = (b.id===id); });
    setBoards(list);
  }
  function ensureMigration(){
    var list = getBoards();
    if (list.length) return;
    // Migrate single-board to multi-board
    var legacy = null;
    try{ legacy = JSON.parse(localStorage.getItem('wf.board')||'null'); }catch{}
    var id = 'board-1';
    var name = 'Default Board';
    setBoards([{ id: id, name: name, current: true }]);
    if (legacy){ try{ localStorage.setItem('wf.'+id, JSON.stringify(legacy)); }catch{} }
    else { try{ localStorage.setItem('wf.'+id, JSON.stringify(initialBoard)); }catch{} }
  }
  function getBoardKey(id){ return 'wf.' + id; }
  function loadBoard() {
    ensureMigration();
    var id = getCurrentBoardId();
    try{
      var raw = localStorage.getItem(getBoardKey(id));
      if (raw) return JSON.parse(raw);
    }catch{}
    return initialBoard;
  }
  function loadBoardById(id){
    try{ var raw = localStorage.getItem(getBoardKey(id)); if (raw) return JSON.parse(raw); }catch{}
    return { id: 'default', columns: [], wipLimits: {} };
  }
  function saveBoard(b){
    try{
      var id = getCurrentBoardId();
      localStorage.setItem(getBoardKey(id), JSON.stringify(b));
    }catch{}
  }
  function renderBoardSelector(){
    if (!boardSelect) return;
    var list = getBoards();
    var curId = getCurrentBoardId();
    boardSelect.innerHTML='';
    list.forEach(function(item){
      var opt = document.createElement('option');
      opt.value = item.id; opt.textContent = item.name || item.id; opt.selected = (item.id===curId);
      boardSelect.appendChild(opt);
    });
    var optNew = document.createElement('option'); optNew.value = '__new__'; optNew.textContent = '➕ New Board';
    boardSelect.appendChild(optNew);
    // Meta: index + count
    if (boardMeta){ var idx = Math.max(0, list.findIndex(function(x){ return x.id===curId; })); boardMeta.textContent = 'Board ' + (idx+1) + ' of ' + list.length; }
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

  // --- Inline title editing (dblclick) ---
  function wireTitleEditing(titleEl, columnId, cardId){
    if (!titleEl) return;
    titleEl.style.cursor = 'text';
    titleEl.addEventListener('dblclick', () => startTitleEdit(titleEl, columnId, cardId));
  }

  function startTitleEdit(el, columnId, cardId){
    const original = (el.textContent || '').trim();
    el.contentEditable = 'true';
    el.spellcheck = false;
    el.style.outline = '1px solid #e50c78';
    el.style.outlineOffset = '2px';
    // focus and select all text
    el.focus();
    try{
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {}

    function cleanup(){
      el.contentEditable = 'false';
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('blur', onBlur);
    }

    function commit(){
      const next = (el.textContent || '').trim();
      cleanup();
      if (!next){ el.textContent = original; return; }
      if (next === original) return;
      const col = board.columns.find(c=>c.id===columnId);
      if (!col) return;
      const card = col.cards.find(c=>c.id===cardId);
      if (!card) return;
      card.title = next;
      addToHistory('Edited ' + (card.title||cardId));
      saveBoard(board);
      renderBoard(board);
      // sync to backend (best-effort)
      fetch('/api/board/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op:'update_card', args: { columnId, cardId, title: next } })
      }).then(r=>r.json()).then(d=>{
        if (d && d.board){ board = d.board; saveBoard(board); renderBoard(board); }
      }).catch(()=>{});
    }

    function cancel(){
      cleanup();
      el.textContent = original;
    }

    function onKey(e){
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); el.removeEventListener('blur', onBlur); cancel(); }
    }
    function onBlur(){ commit(); }

    el.addEventListener('keydown', onKey);
    el.addEventListener('blur', onBlur);
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
        const titleEl = h('h4', { style: { margin:0, fontSize:'14px', cursor:'text' } }, [ card.title ]);
        wireTitleEditing(titleEl, col.id, card.id);
        row.appendChild(titleEl);
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
        addToHistory('Moved ' + (card.title||card.id) + ' to ' + (toCol.name||toCol.id));
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

  ensureMigration();
  let board = loadBoard();
  // If nothing in localStorage, seed it with initial SSR board
  if (!board) { board = initialBoard; }
  saveBoard(board);
  renderBoard(board);

  // --- History helpers ---
  function addToHistory(action) {
    try{
      const curId = getCurrentBoardId();
      const history = JSON.parse(localStorage.getItem('wf.history.'+curId) || '[]');
      const time = new Date().toTimeString().slice(0,5); // HH:mm
      history.unshift({ action, time, ts: Date.now() });
      history.splice(20); // Keep only 20
      localStorage.setItem('wf.history.'+curId, JSON.stringify(history));
      renderHistory();
    } catch {}
  }
  function getHistory(){
    try { const curId = getCurrentBoardId(); return JSON.parse(localStorage.getItem('wf.history.'+curId) || '[]'); } catch { return []; }
  }
  function renderHistory(){
    if (!historyList) return;
    const items = getHistory();
    historyList.innerHTML = '';
    if (!items.length){
      const li = document.createElement('li');
      li.style.fontSize = '12px';
      li.style.opacity = '0.8';
      li.textContent = 'No activity yet';
      historyList.appendChild(li);
      return;
    }
    items.forEach(it => {
      const li = document.createElement('li');
      li.style.fontSize = '12px';
      li.style.opacity = '0.95';
      li.textContent = '[' + it.time + '] ' + it.action;
      historyList.appendChild(li);
    });
  }
  historyToggle?.addEventListener('click', () => {
    if (!historyPanel) return;
    const shown = historyPanel.style.display !== 'none';
    historyPanel.style.display = shown ? 'none' : 'block';
    if (!shown) renderHistory();
  });
  renderHistory();
  renderBoardSelector();

  boardSelect?.addEventListener('change', function(){
    var val = boardSelect.value;
    if (val === '__new__'){
      var list = getBoards();
      var nextNum = 1;
      list.forEach(function(b){ var m = /^board-(\d+)$/.exec(b.id); if (m){ nextNum = Math.max(nextNum, parseInt(m[1],10)+1); }});
      var name = window.prompt('New board name:', 'New Board');
      if (!name) { renderBoardSelector(); return; }
      var id = 'board-' + nextNum;
      list.forEach(function(b){ b.current=false; });
      list.push({ id, name, current:true });
      setBoards(list);
      setCurrentBoardId(id);
      var empty = { id: 'default', columns: [], wipLimits: {} };
      try{ localStorage.setItem(getBoardKey(id), JSON.stringify(empty)); }catch{}
      board = empty; renderBoard(board); renderHistory(); renderBoardSelector();
      return;
    }
    // Switching existing board
    setCurrentBoardId(val);
    // save current already done via saveBoard() on actions; just load new
    board = loadBoardById(val);
    renderBoard(board); renderHistory(); renderBoardSelector();
  });

  // --- Export CSV ---
  function formatTS(d){
    const pad = n=>String(n).padStart(2,'0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth()+1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const MM = pad(d.getMinutes());
    const SS = pad(d.getSeconds());
    return { stamp: (''+yyyy+'-'+mm+'-'+dd+'-'+HH+MM), human: (''+yyyy+'-'+mm+'-'+dd+' '+HH+':'+MM+':'+SS) };
  }
  function csvEscape(s){
    const v = s==null?'' : String(s).replace(/\r?\n/g,' ').replace(/"/g,'""');
    return '"'+v+'"';
  }
  function statusFromColumn(id){
    const cid = String(id||'').toLowerCase();
    if (cid === 'backlog') return 'pending';
    if (cid === 'doing') return 'in_progress';
    if (cid === 'done') return 'done';
    return cid || 'unknown';
  }
  function exportCSV(){
    const now = new Date();
    const { stamp, human } = formatTS(now);
    // Count cards
    let total = 0;
    board.columns.forEach(c=>{ total += (c.cards?.length||0); });
    // Board name for filename
    const list = getBoards();
    const curId = getCurrentBoardId();
    const curMeta = list.find(x=>x.id===curId);
    const bname = curMeta?.name || curId || 'board';
    const lines = [];
    lines.push(csvEscape('Exported At')+','+csvEscape(human));
    lines.push(csvEscape('Total Cards')+','+csvEscape(total));
    lines.push(['Column','Card Title','Owner','Priority','Description','Status'].map(csvEscape).join(','));
    board.columns.forEach(col => {
      (col.cards||[]).forEach(card => {
        const row = [
          col.name || col.id || '',
          card.title || '',
          card.owner || '',
          card.priority || '',
          card.desc || '',
          statusFromColumn(col.id || col.name)
        ].map(csvEscape).join(',');
        lines.push(row);
      });
    });
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wordflux-' + slugName(bname) + '-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
    addToHistory('Exported board to CSV');
  }
  document.getElementById('export-csv')?.addEventListener('click', exportCSV);

  // --- WhatsApp Share ---
  function getCurrentBoardName(){
    var list = getBoards();
    var curId = getCurrentBoardId();
    var cur = null;
    for (var i=0;i<list.length;i++){ if (list[i].id===curId){ cur = list[i]; break; } }
    return (cur && (cur.name||cur.id)) || 'Board';
  }
  function getBoardSummary(){
    var name = getCurrentBoardName();
    var todo = 0, doing = 0, done = 0;
    board.columns.forEach(function(col){
      if (col.id === 'Done') done = (col.cards||[]).length;
      else if (col.id === 'Doing') doing = (col.cards||[]).length;
      else todo += (col.cards||[]).length;
    });
    var items = getHistory().slice(0,3).map(function(h){ return h.action; });
    var recent = items.length ? ('\nRecent: ' + items.join(', ')) : '';
    var link = (typeof location!=='undefined' ? location.href : '');
    var text = '\ud83d\udcca *' + name + '*\n' +
               '\u2705 Completed: ' + done + '\n' +
               '\ud83d\udd04 In Progress: ' + doing + '\n' +
               '\ud83d\udcdd To Do: ' + todo + '\n' +
               recent + '\n\n' +
               'View full board: ' + link;
    return text;
  }
  function shareWhatsApp(){
    try{
      var text = getBoardSummary();
      var encoded = encodeURIComponent(text);
      var url = 'https://wa.me/?text=' + encoded;
      try{ window.open(url, '_blank'); }catch(e){ location.href = url; }
      addToHistory('Shared board via WhatsApp');
    } catch {}
  }
  shareBtn?.addEventListener('click', shareWhatsApp);

  // --- Campaign Generator ---
  function showCampaignModal(show){ if (!campaignModal) return; campaignModal.style.display = show ? 'flex' : 'none'; }
  openCampaignBtn?.addEventListener('click', function(){ showCampaignModal(true); });
  cgClose?.addEventListener('click', function(){ showCampaignModal(false); cgStatus && (cgStatus.textContent=''); });
  cgCancel?.addEventListener('click', function(){ showCampaignModal(false); cgStatus && (cgStatus.textContent=''); });

  function getSelectedGoals(){
    var arr=[]; if (!cgGoals) return arr; for (var i=0;i<cgGoals.options.length;i++){ var o=cgGoals.options[i]; if (o.selected) arr.push(o.value); }
    return arr;
  }
  function daysForDuration(text){
    var t=(text||'').toLowerCase();
    if (t.indexOf('3 months')>=0) return 90;
    if (t.indexOf('1 month')>=0) return 30;
    if (t.indexOf('2 weeks')>=0) return 14;
    return 7;
  }
  function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,20); }
  function ensureColumn(id, name){
    var exist = board.columns.find(function(c){ return c.id===id || c.name===name; });
    if (exist) return exist.id;
    board.columns.push({ id:id, name:name, cards:[] });
    saveBoard(board); renderBoard(board);
    fetch('/api/board/apply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ op:'add_column', args:{ id, name } }) }).catch(function(){});
    return id;
  }
  function chooseOwner(title){
    var t=(title||'').toLowerCase();
    if (t.indexOf('plan')>=0||t.indexOf('strategy')>=0) return 'strategy';
    if (t.indexOf('design')>=0||t.indexOf('creative')>=0||t.indexOf('visual')>=0) return 'design';
    if (t.indexOf('copy')>=0||t.indexOf('write')>=0||t.indexOf('content')>=0||t.indexOf('script')>=0) return 'copy';
    if (t.indexOf('ads')>=0||t.indexOf('media')>=0||t.indexOf('buy')>=0||t.indexOf('campaign')>=0) return 'media';
    if (t.indexOf('analytics')>=0||t.indexOf('report')>=0||t.indexOf('measure')>=0) return 'analytics';
    return 'pm';
  }
  function addCard(columnId, title, desc, owner, priority){
    var col = board.columns.find(function(c){ return c.id===columnId; });
    if (!col) return;
    var cid = (title||'new').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20) + '-' + Date.now();
    var card = { id: cid, title: title||'New Task', desc: desc||'', owner: owner||'', priority: priority||'m' };
    col.cards.push(card);
    saveBoard(board); renderBoard(board);
    fetch('/api/board/apply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ op:'add_card', args:{ columnId: columnId, title: title, desc: card.desc, owner: card.owner, priority: card.priority, id: cid } }) }).catch(function(){});
  }
  function distributeDueDates(phases, totalDays){
    var now = new Date();
    function fmt(d){ var y=d.getFullYear(); var m=(''+(d.getMonth()+1)).padStart(2,'0'); var da=(''+d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+da; }
    var phaseRatios = { 'planning':0.2, 'creation':0.5, 'launch':0.2, 'analysis':0.1 };
    var dayCursor = 0;
    phases.forEach(function(ph){
      var key = slug(ph.name||'');
      var windowDays = Math.max(1, Math.round((phaseRatios[key]||0.25) * totalDays));
      var tasks = ph.tasks||[];
      for (var i=0;i<tasks.length;i++){
        var t = tasks[i];
        var offset = (typeof t.daysFromStart==='number' ? t.daysFromStart : Math.min(dayCursor + i, totalDays-1));
        var d = new Date(now.getTime() + offset*24*60*60*1000);
        t._due = fmt(d);
      }
      dayCursor += windowDays;
    });
  }
  function extractJSON(text){
    if (!text) return null;
    // Try whole string first
    try{ return JSON.parse(text); }catch(e){}
    // Try extracting the first balanced JSON object
    var i = text.indexOf('{');
    if (i>=0){
      var depth=0; for (var j=i;j<text.length;j++){
        var ch = text[j];
        if (ch==='{' ) depth++;
        else if (ch==='}') { depth--; if (depth===0){ var sub = text.slice(i,j+1); try{ return JSON.parse(sub); } catch(e2){} break; } }
      }
    }
    return null;
  }
  async function generateCampaign(){
    if (!cgGenerate) return; cgGenerate.disabled = true; if (cgStatus) cgStatus.textContent = 'Generating campaign with GPT-5...';
    try{
      var type = cgType ? cgType.value : 'Full Digital';
      var brand = (cgBrand ? cgBrand.value : '').trim() || 'Client';
      var duration = cgDuration ? cgDuration.value : '1 month';
      var budget = cgBudget ? cgBudget.value : 'Medium';
      var audience = (cgAudience ? cgAudience.value : '').trim() || 'General';
      var goalsArr = getSelectedGoals();
      var goals = goalsArr.length ? goalsArr.join(', ') : 'Brand Awareness';

      var prompt = 'Generate a complete '+type+' campaign for '+brand+' lasting '+duration+' targeting '+audience+' with a '+budget+' budget focused on '+goals+'. Create specific tasks with deadlines, owners, and descriptions. Return ONLY valid JSON with keys: campaign {type, brand, duration, budget, audience, goals[]}, phases[] where each phase has name and tasks[] with title, description, owner (role), priority (l|m|h), and optional daysFromStart (integer). No commentary.';

      var res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: prompt }) });
      var data = await res.json();
      var plan = extractJSON(data && (data.response||data.reply));

      if (!plan || !plan.phases || !plan.phases.length){
        if (cgStatus) cgStatus.textContent = 'AI did not return a structured plan. Creating a basic scaffold...';
        plan = { campaign: { type:type, brand:brand, duration:duration, budget:budget, audience:audience, goals:goalsArr }, phases:[
          { name:'Planning', tasks:[ { title:'Kickoff + Strategy Brief', description:'Define objectives, channels, KPIs.', owner:'strategy', priority:'h' } ] },
          { name:'Creation', tasks:[ { title:'Produce content set', description:'Copy + design assets per channel.', owner:'design', priority:'m' } ] },
          { name:'Launch', tasks:[ { title:'Publish & monitor', description:'Schedule posts and monitor spend.', owner:'media', priority:'m' } ] },
          { name:'Analysis', tasks:[ { title:'Report & learnings', description:'Analyze performance and propose next steps.', owner:'analytics', priority:'m' } ] }
        ] };
      }

      var totalDays = daysForDuration(duration);
      distributeDueDates(plan.phases, totalDays);

      var phases = plan.phases || [];
      var created = 0;
      phases.forEach(function(ph){
        var name = ph.name || 'Phase';
        var id = slug(name) || 'phase';
        var colId = ensureColumn(id, name);
        (ph.tasks||[]).forEach(function(t){
          var title = t.title || 'Task';
          var owner = t.owner || chooseOwner(title);
          var pr = (t.priority==='l'||t.priority==='m'||t.priority==='h') ? t.priority : 'm';
          var desc = (t.description||'') + (t._due ? '\nDue: '+t._due : '');
          addCard(colId, title, desc, owner, pr);
          created++;
        });
      });

      addToHistory('Generated campaign for ' + brand + ' (' + type + '): ' + created + ' tasks');
      if (cgStatus) cgStatus.textContent = 'Campaign created: ' + created + ' tasks added.';
      setTimeout(function(){ showCampaignModal(false); cgStatus && (cgStatus.textContent=''); }, 800);

    } catch(e){ if (cgStatus) cgStatus.textContent = 'Error generating campaign.'; }
    finally { if (cgGenerate) cgGenerate.disabled = false; }
  }
  cgGenerate?.addEventListener('click', generateCampaign);

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
        addToHistory('Applied AI: ' + (action.label||action.type));
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
        addToHistory('Applied AI: ' + (action.label||action.type));
        return;
      }

      if (action.type === 'merge_columns'){
        try{
          var rm = await fetch('/api/board/apply', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ op:'merge_columns', args: { sourceId: action.sourceId, targetId: action.targetId, newName: action.newName || undefined } })
          });
          var mj = await rm.json();
          if (mj && mj.board){ board = mj.board; saveBoard(board); renderBoard(board); showSuccess(btn, 'Applied ✓'); addToHistory('Applied AI: ' + (action.label||action.type)); return; }
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
          addToHistory('Applied AI: ' + (action.label||action.type));
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
