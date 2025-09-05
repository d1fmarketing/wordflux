'use client';
import { useState, useEffect } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wf_reply_mode') || 'short';
    }
    return 'short';
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wf_reply_mode', mode);
    }
  }, [mode]);

  function submit() {
    if (text.trim() && !disabled) {
      onSend?.({ text: text.trim(), mode });
      setText('');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--wf-navy)]/90 backdrop-blur p-3">
      <div className="flex gap-2">
        <textarea 
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Comandos para GPT-5..."
          className="flex-1 p-3 rounded-lg border border-[var(--border)] bg-[#0f0f1d] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--wf-magenta)] resize-none"
          rows="1"
          disabled={disabled}
        />
        <div className="flex flex-col gap-1">
          <button 
            onClick={submit}
            disabled={disabled || !text.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white font-semibold hover:shadow-lg transition-shadow text-sm disabled:opacity-50"
          >
            Send
          </button>
          <button 
            onClick={() => setText('')}
            disabled={disabled}
            className="px-4 py-1 rounded-lg border border-[var(--border)] text-[var(--wf-soft)]/60 hover:text-[var(--wf-soft)] text-xs disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs mt-2">
        <label className="text-[var(--wf-soft)]/60">Reply length:</label>
        {['short','normal','long'].map(m=>(
          <button key={m}
            onClick={()=>setMode(m)}
            className={`wf-btn wf-btn-outline ${mode===m ? 'ring-2 ring-[var(--wf-magenta)]':''}`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}