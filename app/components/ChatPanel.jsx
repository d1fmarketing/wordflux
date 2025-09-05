'use client';
import { useState } from 'react';
import ChatInput from './ChatInput';

export default function ChatPanel({ onUserMessage }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Eu controlo tudo. Pergunte: "Gere uma campanha Black Friday"' }
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSend({ text, mode }) {
    setMessages(m => [...m, { role:'user', text }]);
    setLoading(true);
    
    try {
      const ai = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ message: text, mode })
      }).then(r=>r.json());

      // Show AI's reply
      setMessages(m => [...m, { role:'assistant', text: ai.reply || 'Done.' }]);

      // If board was updated, refresh with new board state
      if(ai.board && ai.version){
        onUserMessage?.({ type: 'board_update', board: ai.board });
      }
    } catch(err) {
      setMessages(m => [...m, { role:'assistant', text: 'Erro: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="p-5 bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="m-0 font-[var(--font-display),Poppins] text-lg font-semibold">GPT-5 Controller</h2>
            <p className="mt-1 text-xs opacity-95">AI controlando sua plataforma</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-lg ${
            msg.role === 'user' 
              ? 'bg-[#1a1a2e] text-[var(--wf-soft)]' 
              : 'bg-[var(--surface-alt)] text-[var(--wf-soft)]'
          }`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="p-3 rounded-lg bg-[var(--surface-alt)] text-[var(--wf-soft)]/60 animate-pulse">
            Processando...
          </div>
        )}
      </div>
      
      <ChatInput onSend={handleSend} disabled={loading} />
    </>
  );
}