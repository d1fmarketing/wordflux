'use client'

export default function Message({ 
  role, 
  content, 
  timestamp,
  model 
}) {
  const isUser = role === 'user'
  const isError = role === 'error'
  const isAssistant = role === 'assistant'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div 
        className={`
          max-w-[85%] rounded-xl px-4 py-3 relative
          ${isUser 
            ? 'gradient-bg text-white shadow-soft' 
            : isError
              ? 'bg-wf-magenta/10 border border-wf-magenta/30 text-wf-soft'
              : 'bg-wf-soft/5 border border-wf-soft/10 text-wf-soft shadow-soft'
          }
        `}
      >
        {/* Message Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-2 text-xs ${isUser ? 'text-white/80' : 'text-wf-soft/60'}`}>
            {isUser ? (
              <>
                <span>You</span>
              </>
            ) : isError ? (
              <>
                <span className="text-wf-magenta">⚠️ Error</span>
              </>
            ) : (
              <>
                <span className="gradient-text font-semibold">GPT-5</span>
                {model && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-wf-magenta/10 to-wf-orange/10 text-wf-magenta">
                    {model}
                  </span>
                )}
              </>
            )}
          </div>
          {timestamp && (
            <span className={`ml-auto text-[10px] ${isUser ? 'text-white/60' : 'text-wf-soft/40'}`}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        {/* Message Content */}
        <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-wf-soft/90'}`}>
          {content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}