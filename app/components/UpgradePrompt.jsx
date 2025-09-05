'use client';
import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UpgradePrompt({ feature = 'Voice & Image', onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function handleUpgrade() {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Checkout not available yet');
      }
    } catch (err) {
      toast.error('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-[#0f0f1d] border border-[var(--border)] rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--wf-soft)] mb-2">
            Upgrade to Pro
          </h2>
          <p className="text-[var(--wf-soft)]/75">
            Unlock {feature} features with WordFlux Pro
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-green-400">✓</span>
            <span className="text-[var(--wf-soft)]">Voice control for hands-free operation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400">✓</span>
            <span className="text-[var(--wf-soft)]">Image attachments & screenshots</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400">✓</span>
            <span className="text-[var(--wf-soft)]">Unlimited AI actions</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400">✓</span>
            <span className="text-[var(--wf-soft)]">Priority support</span>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-[var(--wf-soft)]">$15/month</div>
          <div className="text-[var(--wf-soft)]/60">Cancel anytime</div>
        </div>
        
        <input
          type="email"
          placeholder="Enter your email"
          className="wf-input w-full mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <div className="flex gap-3">
          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Start Free Trial'}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--wf-soft)]/75 hover:text-[var(--wf-soft)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gradient-to-r from-[var(--wf-magenta)] to-[var(--wf-orange)] text-white">
      PRO
    </span>
  );
}

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  
  useEffect(() => {
    // Check URL params for upgrade success
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') {
      localStorage.setItem('wf_plan', 'pro');
      toast.success('Welcome to WordFlux Pro!');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Check pro status
    setIsPro(localStorage.getItem('wf_plan') === 'pro');
  }, []);
  
  return isPro;
}