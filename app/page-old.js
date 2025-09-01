'use client'
import { useEffect, useState } from 'react'

const COLORS = {
  magenta: '#e50c78',
  orange: '#ef450a',
  navy: '#000023',
  soft: '#fff9f9'
}

export default function Page() {
  const [board, setBoard] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch board from Dynamo
  async function loadBoard() {
    const r = await fetch('/api/board/get')
    const j = await r.json()
    setBoard(j.board)
  }

  useEffect(() => { 
    loadBoard()
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hi! I\'m your WordFlux AI. I can help organize your board. Try asking me to analyze it or suggest improvements.'
    }])
  }, [])

  async function sendMessage() {
    if (!input.trim() || loading) return
    
    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        suggestions: data.suggestions 
      }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: `Error: ${error.message}` 
      }])
    } finally {
      setLoading(false)
    }
  }

  async function apply(op, args) {
    const r = await fetch('/api/board/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op, args })
    })
    const j = await r.json()
    if (j.board) {
      setBoard(j.board)
      setMessages(prev => [...prev, {
        role: 'system',
        content: `✓ Applied: ${op}`
      }])
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.navy, color: COLORS.soft, fontFamily: 'system-ui' }}>
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        .card { background: #000028; border-radius: 1.25rem; border: 1px solid rgba(255,255,255,0.08); }
        .pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); 
                border-radius: 999px; padding: 4px 12px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .pill:hover { background: rgba(255,255,255,0.1); }
        .gradient { background: linear-gradient(135deg, ${COLORS.magenta}, ${COLORS.orange}); }
        .chat-message { padding: 12px 16px; border-radius: 12px; margin-bottom: 8px; }
        .user-msg { background: rgba(229, 12, 120, 0.1); border: 1px solid rgba(229, 12, 120, 0.2); margin-left: 40px; }
        .assistant-msg { background: rgba(239, 69, 10, 0.1); border: 1px solid rgba(239, 69, 10, 0.2); margin-right: 40px; }
        .system-msg { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
                      text-align: center; font-size: 12px; opacity: 0.7; }
        .error-msg { background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.3); color: #ff6b6b; }
      `}</style>

      {/* Header */}
      <header style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="gradient" style={{ padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: 18 }}>
            WORDFLUX
          </span>
          <span style={{ opacity: 0.7 }}>AI-Powered Board Organization</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', height: 'calc(100vh - 80px)' }}>
        
        {/* Left Chat Panel */}
        <aside style={{ borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Messages */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}-msg`}>
                <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>
                  {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'WordFlux AI' : 'System'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {msg.suggestions.map((sug, j) => (
                      <span key={j} className="pill" style={{ fontSize: 11 }}>
                        💡 {sug.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant-msg" style={{ opacity: 0.5 }}>
                <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>WordFlux AI</div>
                <div>Thinking...</div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about the board..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: COLORS.soft,
                  fontSize: 14
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="gradient"
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading || !input.trim() ? 0.5 : 1
                }}
              >
                Send
              </button>
            </div>
            
            {/* Quick Actions */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="pill" onClick={() => setInput('Analyze the current board')}>
                📊 Analyze Board
              </button>
              <button className="pill" onClick={() => setInput('Suggest improvements')}>
                💡 Suggest Improvements
              </button>
              <button className="pill" onClick={() => setInput('What should I work on next?')}>
                🎯 What\'s Next?
              </button>
            </div>
          </div>

          {/* Manual Actions */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 8 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="pill" onClick={() => apply('set_wip_limit', { columnId: 'Doing', limit: 3 })}>
                Set WIP Doing → 3
              </button>
              <button className="pill" onClick={() => apply('move_card', { fromColumnId: 'Doing', toColumnId: 'Done', cardId: 'doing-1' })}>
                Move first Doing → Done
              </button>
            </div>
          </div>
        </aside>

        {/* Right Board */}
        <main style={{ padding: 24, overflowY: 'auto' }}>
          {!board ? (
            <div className="card" style={{ padding: 16 }}>Loading board...</div>
          ) : (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: `repeat(${board.columns.length}, minmax(260px, 1fr))` }}>
              {board.columns.map((col) => (
                <section key={col.id} className="card" style={{ padding: 12 }}>
                  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{col.name}</div>
                    <span className="pill">WIP: {board.wipLimits?.[col.id] || '—'}</span>
                  </header>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {col.cards.map((c) => (
                      <article key={c.id} className="card" style={{ padding: 12, background: '#000035' }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{c.desc}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, fontSize: 11 }}>
                          <span className="pill">👤 {c.owner}</span>
                          <span className="pill">⚡ {c.priority}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}