export const dynamic = 'force-dynamic';

export default function PublicBoardPage({ params }) {
  const token = params?.token || '';
  return (
    <div style={{minHeight:'100vh',background:'var(--surface)',color:'var(--text)',fontFamily:'var(--font-body, Inter), system-ui, sans-serif'}}>
      <header style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface)'}}>
        <div>
          <h1 style={{margin:0,fontSize:18}}>Client Portal</h1>
          <div style={{fontSize:12,color:'var(--muted)'}}>Review & Approve — No login required</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span id="cp-board-name" style={{fontSize:12,opacity:0.9}}></span>
        </div>
      </header>
      <main style={{padding:16}}>
        <div id="cp-warning" style={{display:'none',padding:12,background:'var(--surface-alt)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,marginBottom:12}}></div>
        <div id="cp-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}></div>
      </main>

      {/* Request Changes Modal */}
      <div id="cp-modal" style={{display:'none',position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div style={{width:'min(520px,92vw)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,boxShadow:'0 12px 32px rgba(0,0,0,0.08)',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
            <strong style={{color:'var(--text)'}}>Request Changes</strong>
            <button id="cp-close" aria-label="Close" style={{background:'transparent',border:'none',color:'var(--text)',fontSize:18,cursor:'pointer'}}>×</button>
          </div>
          <div style={{padding:16,display:'grid',gap:10}}>
            <label style={{display:'grid',gap:6}}>
              <span style={{fontSize:12,color:'var(--muted)'}}>Comments</span>
              <textarea id="cp-comment" rows={5} placeholder="What should be changed?" style={{padding:10,borderRadius:8,background:'#fff',color:'var(--text)',border:'1px solid var(--border)'}}></textarea>
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button id="cp-cancel" style={{padding:'10px 14px',borderRadius:8,background:'#fff',color:'var(--text)',border:'1px solid var(--border)',cursor:'pointer'}}>Cancel</button>
              <button id="cp-submit" style={{padding:'10px 14px',borderRadius:8,background:'#fff',color:'var(--text)',border:'1px solid var(--border)',cursor:'pointer'}}>Submit</button>
            </div>
            <div id="cp-status" style={{fontSize:12,opacity:0.85}}></div>
          </div>
        </div>
      </div>

      {/* Client ID Modal (first visit) */}
      <div id="cp-id-modal" style={{display:'none',position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div style={{width:'min(420px,92vw)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,boxShadow:'0 12px 32px rgba(0,0,0,0.08)',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
            <strong style={{color:'var(--text)'}}>Identify Yourself</strong>
          </div>
          <div style={{padding:16,display:'grid',gap:10}}>
            <div style={{fontSize:12,opacity:0.9}}>Enter your name or email so your approvals are attributed.</div>
            <input id="cp-id-input" placeholder="Your name or email" style={{padding:10,borderRadius:8,background:'#fff',color:'var(--text)',border:'1px solid var(--border)'}} />
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button id="cp-id-save" style={{padding:'10px 14px',borderRadius:8,background:'#fff',color:'var(--text)',border:'1px solid var(--border)',cursor:'pointer'}}>Continue</button>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
(function(){
  var TOKEN = ${JSON.stringify(token)};

  function getBoards(){ try{ return JSON.parse(localStorage.getItem('wf.boards')||'[]'); }catch{ return []; } }
  function getBoardKey(id){ return 'wf.' + id; }
  function getPublicBoards(){ try { return JSON.parse(localStorage.getItem('wf.publicBoards')||'{}'); } catch { return {}; } }
  function getNotifyPhone(){ try { return localStorage.getItem('wf.notifyPhone') || ''; } catch { return ''; } }
  function getClientId(){ try { return localStorage.getItem('wf.clientId') || ''; } catch { return ''; } }
  function setClientId(v){ try { localStorage.setItem('wf.clientId', v||''); } catch {} }
  function getActionsKey(boardId){ return 'wf.clientActions.' + boardId; }
  function getActions(boardId){ try{ return JSON.parse(localStorage.getItem(getActionsKey(boardId))||'[]'); }catch{ return []; } }
  function setActions(boardId, arr){ try{ localStorage.setItem(getActionsKey(boardId), JSON.stringify(arr)); }catch{} }

  function h(tag, attrs, children){
    var el = document.createElement(tag);
    attrs = attrs||{}; children = children||[];
    Object.keys(attrs).forEach(function(k){
      if (k==='style' && attrs[k] && typeof attrs[k]==='object') { Object.assign(el.style, attrs[k]); }
      else if (k.startsWith('data-')) { el.setAttribute(k, attrs[k]); }
      else { el[k] = attrs[k]; }
    });
    children.forEach(function(c){ el.appendChild(typeof c==='string' ? document.createTextNode(c) : c); });
    return el;
  }

  function needsApproval(card){
    try{
      if (card && card.tags && Array.isArray(card.tags) && card.tags.indexOf('needs_approval')>=0) return true;
      var d = (card && card.desc) ? String(card.desc).toLowerCase() : '';
      return d.indexOf('needs_approval')>=0;
    } catch { return false; }
  }

  function loadBoard(boardId){
    try{ var raw = localStorage.getItem(getBoardKey(boardId)); if (raw) return JSON.parse(raw); }catch{}
    return null;
  }
  function saveBoard(boardId, b){
    try{ localStorage.setItem(getBoardKey(boardId), JSON.stringify(b)); }catch{}
  }
  function ensureColumn(b, id, name){
    var exist = (b.columns||[]).find(function(c){ return c.id===id || c.name===name; });
    if (exist) return exist.id;
    b.columns = b.columns || [];
    b.columns.push({ id:id, name:name, cards:[] });
    return id;
  }
  function findCard(b, cardId){
    for (var i=0;i<(b.columns||[]).length;i++){
      var col=b.columns[i];
      var idx=(col.cards||[]).findIndex(function(c){ return c.id===cardId; });
      if (idx>=0) return { columnId: col.id, index: idx };
    }
    return null;
  }

  var boardId = getPublicBoards()[TOKEN];
  var warning = document.getElementById('cp-warning');
  var grid = document.getElementById('cp-grid');
  var boardNameEl = document.getElementById('cp-board-name');
  var modal = document.getElementById('cp-modal');
  var mClose = document.getElementById('cp-close');
  var mCancel = document.getElementById('cp-cancel');
  var mSubmit = document.getElementById('cp-submit');
  var mComment = document.getElementById('cp-comment');
  var mStatus = document.getElementById('cp-status');
  var idModal = document.getElementById('cp-id-modal');
  var idInput = document.getElementById('cp-id-input');
  var idSave = document.getElementById('cp-id-save');

  var pendingReq = null; // { boardId, cardId }

  function showModal(show){ if (!modal) return; modal.style.display = show ? 'flex' : 'none'; if (show) { mComment && (mComment.value=''); mStatus && (mStatus.textContent=''); } }
  function showIdModal(show){ if (!idModal) return; idModal.style.display = show ? 'flex' : 'none'; }

  function render(b){
    // Board name
    try {
      var list=getBoards();
      var meta=list.find(function(x){ return x.id===boardId; });
      if (meta && boardNameEl) boardNameEl.textContent = meta.name || meta.id || '';
    } catch {}

    grid.innerHTML='';
    (b.columns||[]).forEach(function(col){
      var colEl = h('div', { style:{background:'var(--surface-alt)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',minHeight:'120px'} });
      colEl.appendChild(h('h3', { style:{margin:'8px 0 16px',fontSize:'18px',color:'var(--text)'}}, [ (col.name||col.id)+' ('+(col.cards?.length||0)+')' ]));
      (col.cards||[]).forEach(function(card){
        var cardEl = h('div', { style:{background:'var(--surface)',padding:'16px',marginBottom:'10px',borderRadius:'8px',border:'1px solid var(--border)',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'} });
        cardEl.appendChild(h('div', { style:{fontWeight:600,marginBottom:'6px',color:'var(--text)'}}, [ card.title || card.id ]));
        if (card.desc){ cardEl.appendChild(h('div', { style:{fontSize:'12px',color:'var(--text)',whiteSpace:'pre-wrap'}}, [ card.desc ])); }
        if (needsApproval(card)){
          var bar = h('div', { style:{display:'flex',gap:'8px',marginTop:'8px'} });
          var btnA = h('button', { style:{padding:'6px 10px',borderRadius:'999px',background:'var(--success)',color:'#fff',border:'none',cursor:'pointer'}}, ['Approve']);
          var btnR = h('button', { style:{padding:'6px 10px',borderRadius:'999px',background:'#fff',color:'var(--text)',border:'1px solid var(--border)',cursor:'pointer'}}, ['Request Changes']);
          btnA.addEventListener('click', function(){ approveCard(card.id); });
          btnR.addEventListener('click', function(){ pendingReq={boardId:boardId,cardId:card.id}; showModal(true); });
          bar.appendChild(btnA); bar.appendChild(btnR);
          cardEl.appendChild(bar);
        }
        colEl.appendChild(cardEl);
      });
      grid.appendChild(colEl);
    });
  }

  function logAction(boardId, payload){
    try{
      var arr = getActions(boardId);
      var ts = Date.now();
      var clientId = getClientId() || 'anonymous';
      payload = Object.assign({ token:TOKEN, timestamp:ts, clientId: clientId }, payload||{});
      arr.unshift(payload);
      arr.splice(200);
      setActions(boardId, arr);
    }catch{}
  }

  function notifyWhatsApp(text){
    try{ var phone = getNotifyPhone().replace(/\D+/g,''); if (!phone) return; var url='https://wa.me/'+phone+'?text='+encodeURIComponent(text||''); window.open(url,'_blank'); }catch{}
  }

  function approveCard(cardId){
    try{
      var b = loadBoard(boardId);
      if (!b) return;
      var loc = findCard(b, cardId);
      if (!loc) return;
      var from = b.columns.find(function(c){ return c.id===loc.columnId; });
      var moved = from.cards.splice(loc.index,1)[0];
      var approvedId = ensureColumn(b, 'Approved', 'Approved');
      var to = b.columns.find(function(c){ return c.id===approvedId; });
      to.cards.push(moved);
      saveBoard(boardId,b);
      render(b);
      logAction(boardId, { action:'approve', actionText: 'Client approved: '+(moved.title||moved.id), cardId: cardId, cardTitle: moved.title||moved.id });
      notifyWhatsApp('Client '+(getClientId()||'')+' approved: '+(moved.title||moved.id)+'\nLink: '+location.href);
    }catch{}
  }

  function submitRequestChanges(){
    try{
      if (!pendingReq) { showModal(false); return; }
      var b = loadBoard(boardId); if (!b) { showModal(false); return; }
      var loc = findCard(b, pendingReq.cardId); if (!loc) { showModal(false); return; }
      var col = b.columns.find(function(c){ return c.id===loc.columnId; });
      var card = col.cards[loc.index];
      var msg = (mComment?.value||'').trim();
      logAction(boardId, { action:'request_changes', actionText: 'Client requested changes: '+(card.title||card.id), cardId: card.id, cardTitle: card.title||card.id, comment: msg });
      mStatus && (mStatus.textContent = 'Submitted');
      setTimeout(function(){ showModal(false); mStatus && (mStatus.textContent=''); }, 600);
      notifyWhatsApp('Client '+(getClientId()||'')+' requested changes on: '+(card.title||card.id)+'\n'+(msg?('Comment: '+msg+'\n'):'')+'Link: '+location.href);
    }catch{}
  }

  mClose?.addEventListener('click', function(){ showModal(false); });
  mCancel?.addEventListener('click', function(){ showModal(false); });
  mSubmit?.addEventListener('click', submitRequestChanges);

  // Identity capture
  (function ensureId(){
    var id = getClientId();
    if (!id) { showIdModal(true); }
    idSave?.addEventListener('click', function(){ var v=(idInput?.value||'').trim(); if (!v) return; setClientId(v); showIdModal(false); });
  })();

  if (!boardId){
    warning.style.display = 'block';
    warning.textContent = 'This link is not set up on this device. Ask your agency to share the link from their board, or open this on the same computer.';
    return;
  }
  var board = loadBoard(boardId);
  if (!board){
    warning.style.display = 'block';
    warning.textContent = 'Board data not found locally. Open the board on this computer to initialize the client portal.';
    return;
  }
  render(board);
})();
      `}} />
    </div>
  );
}
