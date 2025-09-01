'use client'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-wf-navy flex items-center justify-center p-8">
      <div className="card max-w-lg">
        <h2 className="text-xl font-semibold mb-3">Something went wrong</h2>
        <p className="text-wf-soft/70 mb-4">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button 
          onClick={() => reset()} 
          className="gradient-bg text-white px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}