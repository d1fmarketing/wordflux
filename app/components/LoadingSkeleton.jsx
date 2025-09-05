'use client';
import { motion } from 'framer-motion';

export default function LoadingSkeleton() {
  return (
    <div className="wf-board grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((col) => (
        <motion.div
          key={col}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: col * 0.1 }}
          className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface-alt)]"
        >
          {/* Column header skeleton */}
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-24 bg-[var(--wf-soft)]/10 rounded animate-pulse" />
            <div className="h-6 w-12 bg-[var(--wf-soft)]/10 rounded-full animate-pulse" />
          </div>
          
          {/* Card skeletons */}
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="bg-[var(--wf-soft)]/5 border border-[var(--border)] rounded-xl p-4 animate-pulse"
                style={{ animationDelay: `${card * 0.2}s` }}
              >
                <div className="h-4 w-3/4 bg-[var(--wf-soft)]/10 rounded mb-2" />
                <div className="h-3 w-full bg-[var(--wf-soft)]/5 rounded mb-2" />
                <div className="h-3 w-2/3 bg-[var(--wf-soft)]/5 rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-[var(--wf-soft)]/10 rounded-full" />
                  <div className="h-5 w-12 bg-[var(--wf-soft)]/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Add card button skeleton */}
          <div className="mt-4">
            <div className="h-8 w-full bg-[var(--wf-soft)]/5 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}