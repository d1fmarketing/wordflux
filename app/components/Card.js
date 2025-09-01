'use client'

export default function Card({ 
  id,
  title, 
  description, 
  owner, 
  priority
}) {
  const priorityConfig = {
    h: { 
      color: 'text-wf-magenta', 
      bg: 'bg-wf-magenta/10',
      label: 'High',
      icon: '🔴'
    },
    m: { 
      color: 'text-wf-orange', 
      bg: 'bg-wf-orange/10',
      label: 'Medium',
      icon: '🟠'
    },
    l: { 
      color: 'text-wf-soft/60', 
      bg: 'bg-wf-soft/5',
      label: 'Low',
      icon: '⚪'
    },
  }

  const config = priorityConfig[priority] || priorityConfig.l
  
  return (
    <div className="bg-wf-soft/5 border border-wf-soft/10 rounded-xl p-4 cursor-move hover:bg-wf-soft/10 hover:border-wf-soft/20 transition-all group">
      {/* Card Header */}
      <div className="mb-3">
        <h4 className="font-semibold text-sm text-wf-soft mb-1">{title}</h4>
        {description && (
          <p className="text-xs text-wf-soft/60 line-clamp-2">{description}</p>
        )}
      </div>
      
      {/* Card Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-wf-soft/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-wf-soft/10 flex items-center justify-center text-xs">
            {owner?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="text-xs text-wf-soft/50">{owner}</span>
        </div>
        
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
          <span className="text-xs">{config.icon}</span>
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
      </div>
    </div>
  )
}