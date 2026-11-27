import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight, Clock } from 'lucide-react';

export function LoginScreen({ onLogin }: { onLogin: (user: string) => void }) {
  const [name, setName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(name.trim() || 'Researcher');
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center nexus-grid-bg"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0b1226 0%, #070b18 75%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 flex flex-col items-center">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="14" fill="#0b1226" stroke="#22d3ee" strokeWidth="1.5" />
          <path d="M20 44V20l24 24V20" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="mt-4 text-xl font-bold tracking-[0.3em] nexus-text-glow" style={{ color: '#22d3ee' }}>
          NEXUS OS
        </h1>
      </div>

      <form onSubmit={submit} className="w-[340px] max-w-[90vw]">
        <div className="nexus-glass rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(34,211,238,0.12)' }}>
              <User size={22} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#e6edf7' }}>Welcome</p>
              <p className="text-xs" style={{ color: '#5a6d92' }}>Sign in to your workstation</p>
            </div>
          </div>

          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            className="w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-cyan-400"
            style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)' }}
          />

          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(90deg, #22d3ee, #3b82f6)', color: '#070b18' }}
          >
            Sign In <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => onLogin('Guest')}
            className="mt-2 w-full rounded-lg py-2 text-xs transition-colors hover:text-white"
            style={{ color: '#5a6d92' }}
          >
            Continue as Guest
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: '#5a6d92' }}>
          <Clock size={12} />
          {new Date().toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </form>
    </motion.div>
  );
}
