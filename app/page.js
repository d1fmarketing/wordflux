'use client'
import { useEffect, useState, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import toast, { Toaster } from 'react-hot-toast'
import Column from './components/Column'
import Message from './components/Message'
import ChatInput from './components/ChatInput'

export default function Page() {
  const [board, setBoard] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wf_sidebar_open')
      if (stored !== null) return JSON.parse(stored)
      return window.innerWidth >= 1024
    }
    return true
  })
  const messagesEndRef = useRef(null)

  // Fetch board from Dynamo
  async function loadBoard() {
    try {
      const r = await fetch('/api/board/get')
      const j = await r.json()
      setBoard(j.board)
    } catch (error) {
      toast.error('Failed to load board')
    }
  }

  useEffect(() => {
    loadBoard()
    setMessages([{
      role: 'assistant',
      content: 'Welcome to WordFlux! I\'m powered by GPT-5 and ready to help organize your board.',
      model: 'gpt-5-mini',
      timestamp: Date.now()
    }])
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wf_sidebar_open', JSON.stringify(sidebarOpen))
    }
  }, [sidebarOpen])

  async function sendMessage(message) {
    setLoading(true)
    
    // Add user message
    const userMsg = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        model: data.model,
        timestamp: Date.now()
      }])
      
      toast.success('Response received')
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: error.message,
        timestamp: Date.now()
      }])
      toast.error('Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  async function applyBoardChange(op, args) {
    try {
      const r = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op, args })
      })
      const j = await r.json()
      if (j.board) {
        setBoard(j.board)
        toast.success(`Applied: ${op}`)
      }
    } catch (error) {
      toast.error('Failed to apply change')
    }
  }

  // Drag and drop handler with optimistic updates
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    
    // No destination = cancelled drag
    if (!destination) return
    
    // Same position = no change
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return
    
    // Optimistic local update
    setBoard(prev => {
      if (!prev) return prev
      const newBoard = JSON.parse(JSON.stringify(prev)) // Deep clone
      const fromColumn = newBoard.columns.find(c => c.id === source.droppableId)
      const toColumn = newBoard.columns.find(c => c.id === destination.droppableId)
      
      if (!fromColumn || !toColumn) return prev
      
      const [movedCard] = fromColumn.cards.splice(source.index, 1)
      toColumn.cards.splice(destination.index, 0, movedCard)
      
      return newBoard
    })
    
    // Persist to server
    try {
      const res = await fetch('/api/board/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'move_card',
          args: {
            fromColumnId: source.droppableId,
            toColumnId: destination.droppableId,
            cardId: draggableId,
            position: destination.index
          }
        })
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to move card')
      
      // Update with server truth
      setBoard(json.board)
      toast.success('Card moved')
    } catch (error) {
      // Revert on failure
      toast.error('Failed to move card - reverting')
      await loadBoard()
    }
  }

  return (
    <div className="min-h-screen bg-wf-navy flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--wf-navy)',
            color: 'var(--wf-soft)',
            border: '1px solid rgba(255, 249, 249, 0.1)',
            borderRadius: 'var(--radius)',
          },
        }}
      />
      
      {/* Header */}
      <header className="h-16 border-b border-wf-soft/10 px-4 lg:px-6">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-wf-soft/5 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-lg lg:text-xl font-bold gradient-text tracking-wide">WORDFLUX</h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-gradient-to-r from-wf-magenta/10 to-wf-orange/10 text-wf-magenta text-[10px] font-bold uppercase tracking-wider">
                GPT-5 Powered
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-wf-soft/50 hidden lg:block">
              Clarity in motion
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Chat Sidebar */}
        {sidebarOpen && (
          <aside className="w-full lg:w-[280px] flex-shrink-0 bg-wf-navy/50 border-r border-wf-soft/10 flex flex-col h-[calc(100vh-64px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100vh-64px-80px)]">
              {messages.map((msg, i) => (
                <Message key={i} {...msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-wf-soft/10 sticky bottom-0 bg-wf-navy/80 backdrop-blur">
              <ChatInput onSend={sendMessage} loading={loading} />
            </div>
          </aside>
        )}

        {/* Main Board */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          {!board ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Loading skeletons for columns */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card w-full animate-pulse">
                  <div className="h-6 w-1/3 bg-wf-soft/10 rounded mb-4" />
                  <div className="border-b border-wf-soft/10 mb-4" />
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-20 bg-wf-soft/5 rounded-xl mb-3" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {board.columns.map((column) => (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          transition-all duration-200
                          ${snapshot.isDraggingOver ? 'opacity-90' : ''}
                          min-h-[50vh]
                        `}
                      >
                        <Column
                          {...column}
                          wipLimit={board.wipLimits?.[column.id]}
                        />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}
        </main>
      </div>
    </div>
  )
}