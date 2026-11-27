import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldCheck, HardDrive, LayoutGrid, RotateCw, Sparkles } from 'lucide-react';

const STEPS = [
  { icon: Terminal, label: 'Initializing NEXUS kernel simulation' },
  { icon: LayoutGrid, label: 'Loading application registry' },
  { icon: HardDrive, label: 'Mounting virtual filesystem' },
  { icon: Sparkles, label: 'Initializing interface services' },
  { icon: RotateCw, label: 'Restoring user workspace' },
  { icon: ShieldCheck, label: 'Securing session' },
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(() => setExiting(true), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 380);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (exiting) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [exiting, onDone]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!exiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center nexus-grid-bg"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #0b1226 0%, #070b18 70%)' }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-10 flex flex-col items-center"
          >
            <svg width="84" height="84" viewBox="0 0 64 64" fill="none" className="nexus-flicker">
              <rect width="64" height="64" rx="14" fill="#0b1226" stroke="#22d3ee" strokeWidth="1.5" />
              <path d="M20 44V20l24 24V20" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="mt-5 text-3xl font-bold tracking-[0.3em] nexus-text-glow" style={{ color: '#22d3ee' }}>
              NEXUS OS
            </h1>
            <p className="mt-1 text-xs tracking-[0.4em]" style={{ color: '#5a6d92' }}>
              BEYOND THE DESKTOP
            </p>
          </motion.div>

          <div className="w-[420px] max-w-[90vw] space-y-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <Icon
                    size={16}
                    style={{
                      color: done ? '#34d399' : active ? '#22d3ee' : '#5a6d92',
                    }}
                    className={active ? 'nexus-pulse' : ''}
                  />
                  <span style={{ color: done || active ? '#e6edf7' : '#5a6d92' }}>
                    {s.label}
                  </span>
                  {done && <span className="ml-auto text-xs" style={{ color: '#34d399' }}>OK</span>}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 w-[420px] max-w-[90vw]">
            <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ background: 'rgba(56,189,248,0.12)' }}>
              <motion.div
                className="h-full"
                style={{ background: 'linear-gradient(90deg, #22d3ee, #8b5cf6)' }}
                initial={{ width: '0%' }}
                animate={{ width: `${(step / STEPS.length) * 100}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
          </div>

          <button
            onClick={() => setExiting(true)}
            className="mt-10 text-xs tracking-widest transition-colors hover:text-white"
            style={{ color: '#5a6d92' }}
          >
            SKIP BOOT &rarr;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
