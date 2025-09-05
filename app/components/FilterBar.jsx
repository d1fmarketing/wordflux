// app/components/FilterBar.jsx
'use client';
import { useMemo, useState, useEffect } from 'react';
import { Filter, X, Save, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ownersFrom = (board)=> Array.from(
  new Set(board?.columns?.flatMap(c=>c.cards?.map(k=>k.owner).filter(Boolean)) ?? [])
);

export default function FilterBar({ board, value, onChange, searchRef }) {
  const [q, setQ] = useState(value?.q ?? '');
  const [prio, setPrio] = useState(new Set(value?.priority ?? []));  // 'h' | 'm' | 'l'
  const [owner, setOwner] = useState(new Set(value?.owner ?? []));
  const [savedViews, setSavedViews] = useState([]);

  const owners = useMemo(()=>ownersFrom(board), [board]);

  useEffect(()=>{
    onChange?.({
      q: q.trim(),
      priority: Array.from(prio),
      owner: Array.from(owner),
    });
  }, [q, prio, owner, onChange]);

  function toggle(set, key){
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  }

  function clearAll(){
    setQ(''); setPrio(new Set()); setOwner(new Set());
  }
  
  async function saveView() {
    const name = prompt('Save view as:');
    if (!name) return;
    
    try {
      const res = await fetch('/api/views/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          filters: {
            q: q.trim(),
            priority: Array.from(prio),
            owner: Array.from(owner)
          }
        })
      });
      
      if (res.ok) {
        const { saved } = await res.json();
        // Store in localStorage for persistence
        const views = JSON.parse(localStorage.getItem('wf_saved_views') || '[]');
        views.push(saved);
        localStorage.setItem('wf_saved_views', JSON.stringify(views));
        setSavedViews(views);
        toast.success('View saved');
      }
    } catch(err) {
      toast.error('Failed to save view');
    }
  }
  
  function loadView(view) {
    setQ(view.filters.q || '');
    setPrio(new Set(view.filters.priority || []));
    setOwner(new Set(view.filters.owner || []));
    toast.success(`Loaded: ${view.name}`);
  }
  
  function deleteView(viewId) {
    const views = JSON.parse(localStorage.getItem('wf_saved_views') || '[]');
    const updated = views.filter(v => v.id !== viewId);
    localStorage.setItem('wf_saved_views', JSON.stringify(updated));
    setSavedViews(updated);
    toast.success('View deleted');
  }
  
  // Load saved views from localStorage
  useEffect(() => {
    const views = JSON.parse(localStorage.getItem('wf_saved_views') || '[]');
    setSavedViews(views);
  }, []);

  return (
    <div className="mb-4">
      {/* Saved views chips */}
      {savedViews.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-[var(--wf-soft)]/60">Saved views:</span>
          {savedViews.map(view => (
            <div
              key={view.id}
              className="group flex items-center gap-1 px-3 py-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-full cursor-pointer hover:border-[var(--wf-magenta)] transition-all"
            >
              <button
                onClick={() => loadView(view)}
                className="text-xs text-[var(--wf-soft)]"
                title={`Load ${view.name}`}
              >
                {view.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteView(view.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity ml-1"
                title="Delete view"
              >
                ×
              </button>
            </div>
          ))}
          <button 
            onClick={saveView} 
            data-testid="save-view-btn"
            className="px-3 py-1 border border-dashed border-[var(--border)] rounded-full text-xs text-[var(--wf-soft)]/60 hover:border-[var(--wf-magenta)] hover:text-[var(--wf-magenta)] transition-all flex items-center gap-1"
          >
            <Save size={12}/> Save current
          </button>
        </div>
      )}
      
      {/* Save view button if no saved views */}
      {savedViews.length === 0 && (
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={saveView} 
            data-testid="save-view-btn"
            className="wf-btn wf-btn-outline flex items-center gap-1"
          >
            <Save size={14}/> Save view
          </button>
        </div>
      )}
      
      {/* Filters row */}
      <div className="flex items-center gap-8 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} />
          <input
            ref={searchRef}
            value={q} onChange={e=>setQ(e.target.value)}
            className="wf-input" placeholder="Search title/desc…"
            style={{width: 260}}
          />
        </div>

        {/* Priority */}
        <div className="flex items-center gap-6">
          {[
            ['h','High','wf-pri-high'],
            ['m','Medium','wf-pri-med'],
            ['l','Low','wf-pri-low'],
          ].map(([key,label,cls])=>(
            <button key={key}
              onClick={()=>setPrio(s=>toggle(s,key))}
              className={`wf-btn wf-btn-outline ${prio.has(key) ? 'ring-2 ring-wf-orange' : ''}`}
            >
              <span className={cls}>{label}</span>
            </button>
          ))}
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 flex-wrap">
          {owners.map(o=>(
            <button key={o}
              onClick={()=>setOwner(s=>toggle(s,o))}
              className={`wf-btn wf-btn-outline text-xs ${owner.has(o)?'ring-2 ring-wf-magenta':''}`}
              title={`Filter owner: ${o}`}
            >
              {o}
            </button>
          ))}
        </div>

        <button onClick={clearAll} className="wf-btn wf-btn-outline flex items-center gap-1">
          <X size={14}/> Clear
        </button>
      </div>
      
      {/* Active Filter Pills + Quick Chips */}
      {(() => {
        const hasQ = q.trim().length > 0;
        const prios = Array.from(prio);
        const owners = Array.from(owner);
        const hasAny = hasQ || prios.length > 0 || owners.length > 0;
        if (!hasAny) return null;
        const priLabel = (p) => p === 'h' ? 'High' : p === 'm' ? 'Medium' : 'Low';
        return (
          <>
            <div className="mt-3 flex gap-2 flex-wrap" aria-label="Active filters">
              {hasQ && (
                <button
                  onClick={() => setQ('')}
                  className="px-2 py-1 rounded-full bg-[var(--surface-alt)] text-[var(--wf-soft)] border border-[var(--border)] text-xs"
                  aria-label={`Clear search ${q}`}
                  title="Clear search"
                >
                  &quot;{q}&quot; ×
                </button>
              )}
              {prios.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrio((s) => toggle(s, p))}
                  className="px-2 py-1 rounded-full bg-[var(--surface-alt)] text-[var(--wf-soft)] border border-[var(--border)] text-xs"
                  aria-label={`Remove priority ${priLabel(p)}`}
                  title={`Remove priority ${priLabel(p)}`}
                >
                  Priority: {priLabel(p)} ×
                </button>
              ))}
              {owners.map((o) => (
                <button
                  key={o}
                  onClick={() => setOwner((s) => toggle(s, o))}
                  className="px-2 py-1 rounded-full bg-[var(--surface-alt)] text-[var(--wf-soft)] border border-[var(--border)] text-xs"
                  aria-label={`Remove owner ${o}`}
                  title={`Remove owner ${o}`}
                >
                  Owner: {o} ×
                </button>
              ))}
              <button onClick={clearAll} className="wf-btn wf-btn-outline text-xs">
                Clear all
              </button>
            </div>
          </>
        );
      })()}
      
      {/* Quick priority chips */}
      <div className="mt-2 flex gap-2 flex-wrap" aria-label="Quick filters">
        {[
          ['h', 'High'],
          ['m', 'Medium'],
          ['l', 'Low'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setPrio((s) => toggle(s, k))}
            className={`wf-btn wf-btn-outline text-xs ${prio.has(k) ? 'ring-2 ring-[var(--wf-orange)]' : ''}`}
            title={`Toggle ${label}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}