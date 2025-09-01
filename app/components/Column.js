'use client'
import { Draggable } from 'react-beautiful-dnd'
import Card from './Card'

export default function Column({ 
  id,
  name, 
  cards = [], 
  wipLimit
}) {
  const isOverLimit = wipLimit && cards.length > wipLimit
  const columnIcons = {
    'backlog': '📋',
    'todo': '📝',
    'doing': '⚡',
    'done': '✅',
    'review': '👀'
  }
  const icon = columnIcons[id.toLowerCase()] || '📌'
  
  return (
    <div className="card w-full flex flex-col h-fit">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-wf-soft/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-bold text-lg text-wf-soft">{name}</h3>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-xs font-bold
          ${isOverLimit 
            ? 'bg-wf-magenta/20 text-wf-magenta animate-pulse' 
            : 'bg-wf-soft/10 text-wf-soft/70'
          }
        `}>
          {cards.length}{wipLimit ? ` / ${wipLimit}` : ''} cards
        </div>
      </div>
      
      {/* Cards Container */}
      <div className="flex-1 space-y-3 min-h-[300px]">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-wf-soft/30">
            <div className="text-4xl mb-3 opacity-50">{icon}</div>
            <p className="text-sm">No cards yet</p>
            <p className="text-xs mt-1">Drag cards here</p>
          </div>
        ) : (
          cards.map((card, index) => (
            <Draggable key={card.id} draggableId={card.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    ...provided.draggableProps.style,
                    opacity: snapshot.isDragging ? 0.7 : 1,
                    transform: snapshot.isDragging 
                      ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                      : provided.draggableProps.style?.transform
                  }}
                >
                  <Card {...card} />
                </div>
              )}
            </Draggable>
          ))
        )}
      </div>
    </div>
  )
}