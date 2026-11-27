import { useEffect, useRef, useState } from 'react';
import { Cpu, MemoryStick, HardDrive, Wifi, Clock, Activity, AppWindow } from 'lucide-react';
import type { WindowState } from '@/system/types';
import { windowManager } from '@/system/WindowManager';
import { useWindows } from '@/system/hooks';
import { VirtualFS } from '@/system/VirtualFS';
import { APP_REGISTRY } from '@/system/AppRegistry';

export function MonitorApp({ win }: { win: WindowState }) {
  const windows = useWindows();
  const [cpuHist, setCpuHist] = useState<number[]>(Array(40).fill(0));
  const [memHist, setMemHist] = useState<number[]>(Array(40).fill(0));
  const [netHist, setNetHist] = useState<number[]>(Array(40).fill(0));
  const [storage, setStorage] = useState({ count: 0, bytes: 0 });
  const [uptime, setUptime] = useState(0);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const id = setInterval(() => {
      setUptime(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    VirtualFS.storageStats().then(setStorage);
    const unsub = setInterval(() => VirtualFS.storageStats().then(setStorage), 3000);
    return () => clearInterval(unsub);
  }, []);

  useEffect(() => {
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      // derive simulated metrics from actual app state
      const appCount = windows.length;
      const baseCpu = 8 + appCount * 6 + Math.random() * 12;
      const cpu = Math.min(100, baseCpu);
      const mem = Math.min(100, 28 + appCount * 9 + Math.random() * 8);
      const net = Math.max(0, 5 + Math.sin(t / 1000) * 15 + Math.random() * 10 + (windows.some((w) => w.appId === 'web') ? 20 : 0));
      setCpuHist((h) => [...h.slice(1), cpu]);
      setMemHist((h) => [...h.slice(1), mem]);
      setNetHist((h) => [...h.slice(1), net]);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [windows.length]);

  const cpu = cpuHist[cpuHist.length - 1] ?? 0;
  const mem = memHist[memHist.length - 1] ?? 0;
  const net = netHist[netHist.length - 1] ?? 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} style={{ color: '#fbbf24' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--nexus-text)' }}>System Monitor</span>
          <span className="rounded px-1.5 py-0.5 text-[9px]" style={{ background: hexA('fbbf24', 0.15), color: '#fbbf24' }}>SIMULATED</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] nexus-mono" style={{ color: 'var(--nexus-text-faint)' }}>
          <Clock size={11} /> uptime {formatUptime(uptime)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MetricCard icon={Cpu} label="CPU" value={`${cpu.toFixed(0)}%`} history={cpuHist} color="#22d3ee" />
        <MetricCard icon={MemoryStick} label="Memory" value={`${mem.toFixed(0)}%`} history={memHist} color="#8b5cf6" />
        <MetricCard icon={Wifi} label="Network" value={`${net.toFixed(0)} Mb/s`} history={netHist} color="#34d399" />
        <MetricCard icon={HardDrive} label="Storage" value={`${(storage.bytes / 1024).toFixed(1)} KB`} count={`${storage.count} files`} color="#fbbf24" />
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="mb-2 flex items-center gap-2">
          <AppWindow size={14} style={{ color: 'var(--nexus-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>Running Applications</span>
          <span className="ml-auto text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>{windows.length} active</span>
        </div>
        {windows.length === 0 ? (
          <p className="py-3 text-center text-[11px]" style={{ color: 'var(--nexus-text-faint)' }}>No applications running</p>
        ) : (
          <div className="space-y-1">
            {windows.map((w) => {
              const app = APP_REGISTRY[w.appId];
              const Icon = app.icon;
              return (
                <div key={w.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Icon size={13} style={{ color: app.accent }} />
                  <span style={{ color: 'var(--nexus-text)' }}>{w.title}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] nexus-mono" style={{ color: 'var(--nexus-text-faint)' }}>{Math.round(w.width)}×{Math.round(w.height)}</span>
                    {w.minimized ? (
                      <span className="rounded px-1 text-[9px]" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--nexus-text-faint)' }}>minimized</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px]" style={{ color: '#34d399' }}>
                        <span className="h-1.5 w-1.5 rounded-full nexus-pulse" style={{ background: '#34d399' }} /> active
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--nexus-border)' }}>
        <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>System Status</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-3">
          <StatusRow label="Kernel" value="NEXUS 1.0" ok />
          <StatusRow label="Filesystem" value="IndexedDB" ok />
          <StatusRow label="Window Mgr" value="Active" ok />
          <StatusRow label="Event Bus" value="Connected" ok />
          <StatusRow label="Render" value="React 18" ok />
          <StatusRow label="Network" value="Simulated" ok />
        </div>
        <p className="mt-2 text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>
          Metrics are derived from actual NEXUS application state and labeled as simulated. They do not reflect physical hardware.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, history, color, count }: {
  icon: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>;
  label: string; value: string; history?: number[]; color: string; count?: string;
}) {
  return (
    <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--nexus-border)' }}>
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold nexus-mono" style={{ color: 'var(--nexus-text)' }}>{value}</p>
      {count && <p className="text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>{count}</p>}
      {history && (
        <svg width="100%" height="32" className="mt-1.5" viewBox="0 0 40 32" preserveAspectRatio="none">
          <polyline
            points={history.map((v, i) => `${i},${32 - (v / 100) * 30}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.8"
          />
        </svg>
      )}
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--nexus-text-dim)' }}>{label}</span>
      <span className="flex items-center gap-1">
        {ok && <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34d399' }} />}
        <span className="nexus-mono" style={{ color: 'var(--nexus-text)' }}>{value}</span>
      </span>
    </div>
  );
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
