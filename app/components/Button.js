'use client'

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'gradient-bg text-white hover:opacity-90',
    secondary: 'bg-wf-soft/10 text-wf-soft border border-wf-soft/20 hover:bg-wf-soft/20',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}