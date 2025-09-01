'use client'
import { useState } from 'react'

export default function ChatInput({ 
  onSend, 
  loading = false
}) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSend(input)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask GPT-5 about your board..."
          disabled={loading}
          className="w-full bg-wf-soft/5 border border-wf-soft/10 rounded-xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:border-wf-magenta/50 focus:bg-wf-soft/10 transition-all placeholder:text-wf-soft/30 disabled:opacity-50"
          rows={2}
        />
        
        {/* Voice button overlay */}
        <button
          className="absolute right-2 top-3 p-2 rounded-lg hover:bg-wf-soft/10 transition-colors"
          title="Voice input (coming soon)"
          disabled
        >
          <svg className="w-4 h-4 text-wf-soft/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>
      
      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        className="w-full gradient-bg text-white py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Thinking...</span>
          </>
        ) : (
          <>
            <span>Send to GPT-5</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </>
        )}
      </button>
      
      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <button 
          onClick={() => setInput('What should I prioritize today?')}
          className="text-xs px-3 py-1 rounded-full bg-wf-soft/5 hover:bg-wf-soft/10 transition-colors"
        >
          🎯 Priorities
        </button>
        <button 
          onClick={() => setInput('Analyze my board and suggest improvements')}
          className="text-xs px-3 py-1 rounded-full bg-wf-soft/5 hover:bg-wf-soft/10 transition-colors"
        >
          📊 Analyze
        </button>
        <button 
          onClick={() => setInput('Help me organize my workflow')}
          className="text-xs px-3 py-1 rounded-full bg-wf-soft/5 hover:bg-wf-soft/10 transition-colors"
        >
          🔄 Organize
        </button>
      </div>
    </div>
  )
}