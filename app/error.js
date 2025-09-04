'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Error boundary caught:', error)
  }, [error])
  
  return (
    <div className="min-h-screen bg-[var(--wf-navy)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-6 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-[var(--wf-soft)] mb-2">
          Something went wrong!
        </h2>
        
        <p className="text-[var(--muted)] mb-6">
          {error?.message || 'An unexpected error occurred'}
        </p>
        
        <button 
          onClick={() => reset()} 
          className="px-6 py-3 bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
        >
          Try again
        </button>
        
        <p className="text-xs text-[var(--muted)] mt-4">
          If this problem persists, please refresh the page
        </p>
      </div>
    </div>
  )
}