import { useEffect, useRef, useState } from 'react';

export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 border-b px-2 py-1.5" style={{ borderColor: 'var(--nexus-border)' }}>
      {children}
    </div>
  );
}

export function TButton({
  children,
  onClick,
  active,
  title,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
      style={{
        background: active ? hexA('var(--nexus-accent)', 0.12) : 'transparent',
        color: danger ? 'var(--nexus-error)' : active ? 'var(--nexus-accent)' : 'var(--nexus-text-dim)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>;
  title: string;
  body?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <Icon size={36} style={{ color: 'var(--nexus-text-faint)', opacity: 0.4 }} />
      <p className="text-sm font-medium" style={{ color: 'var(--nexus-text-dim)' }}>{title}</p>
      {body && <p className="max-w-xs text-xs" style={{ color: 'var(--nexus-text-faint)' }}>{body}</p>}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs" style={{ color: 'var(--nexus-text-dim)' }}>
      <span className="shrink-0">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded border bg-transparent px-2 py-1 text-right outline-none focus:border-cyan-400"
        style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)' }}
      />
    </label>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--nexus-text-dim)' }}>
        <span>{label}</span>
        <span className="nexus-mono" style={{ color: 'var(--nexus-text)' }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--nexus-accent)' }}
      />
    </div>
  );
}

export function useRafLoop(callback: (dt: number) => void, active: boolean) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      cbRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

export function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
