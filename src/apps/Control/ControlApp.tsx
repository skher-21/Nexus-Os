import { useState } from 'react';
import {
  Palette, Monitor, Bell, Clock, LayoutGrid, RotateCcw, Info, Check,
} from 'lucide-react';
import type { WindowState, Preferences, ThemeMode } from '@/system/types';
import { WALLPAPERS, ACCENTS, DEFAULT_PREFS } from '@/system/Preferences';

type Section = 'appearance' | 'display' | 'notifications' | 'datetime' | 'desktop' | 'about';

export function ControlApp({ win, prefs, updatePrefs }: {
  win: WindowState;
  prefs: Preferences;
  updatePrefs: (p: Partial<Preferences>) => void;
}) {
  const [section, setSection] = useState<Section>('appearance');

  const sections: { id: Section; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'display', label: 'Display & Dock', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'datetime', label: 'Date & Time', icon: Clock },
    { id: 'desktop', label: 'Desktop', icon: LayoutGrid },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="flex h-full">
      <div className="w-44 shrink-0 border-r p-2" style={{ borderColor: 'var(--nexus-border)' }}>
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors"
              style={{
                background: section === s.id ? hexA('8b5cf6', 0.15) : 'transparent',
                color: section === s.id ? '#8b5cf6' : 'var(--nexus-text-dim)',
              }}
            >
              <Icon size={14} /> {s.label}
            </button>
          );
        })}
        <button
          onClick={() => { updatePrefs(DEFAULT_PREFS); }}
          className="mt-4 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors"
          style={{ borderColor: hexA('f87171', 0.3), color: 'var(--nexus-error)' }}
        >
          <RotateCcw size={13} /> Reset All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {section === 'appearance' && (
          <div className="space-y-5">
            <SectionTitle title="Appearance" desc="Customize the look and feel of NEXUS OS" />
            <div>
              <Label>Theme</Label>
              <div className="flex gap-2">
                {(['dark', 'light'] as ThemeMode[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => updatePrefs({ theme: t })}
                    className="flex-1 rounded-lg border p-3 text-left transition-all"
                    style={{
                      borderColor: prefs.theme === t ? 'var(--nexus-accent)' : 'var(--nexus-border)',
                      background: prefs.theme === t ? hexA('22d3ee', 0.06) : 'transparent',
                    }}
                  >
                    <div className="mb-2 h-12 rounded" style={{ background: t === 'dark' ? '#070b18' : '#eef2f9' }} />
                    <span className="text-xs capitalize" style={{ color: 'var(--nexus-text)' }}>{t}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => updatePrefs({ accent: a.color })}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all"
                    style={{ borderColor: prefs.accent === a.color ? a.color : 'var(--nexus-border)' }}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ background: a.color }} />
                    <span style={{ color: 'var(--nexus-text)' }}>{a.name}</span>
                    {prefs.accent === a.color && <Check size={12} style={{ color: a.color }} />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Wallpaper</Label>
              <div className="grid grid-cols-3 gap-2">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => updatePrefs({ wallpaper: w.id })}
                    className="rounded-lg border p-2 text-center transition-all"
                    style={{ borderColor: prefs.wallpaper === w.id ? 'var(--nexus-accent)' : 'var(--nexus-border)' }}
                  >
                    <WallpaperThumb id={w.id} />
                    <span className="mt-1.5 block text-[10px]" style={{ color: 'var(--nexus-text-dim)' }}>{w.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow label="Animations" desc="Enable window and UI animations" value={prefs.animations} onChange={(v) => updatePrefs({ animations: v })} />
            <ToggleRow label="Reduced Motion" desc="Minimize non-essential motion" value={prefs.reducedMotion} onChange={(v) => updatePrefs({ reducedMotion: v })} />
          </div>
        )}

        {section === 'display' && (
          <div className="space-y-5">
            <SectionTitle title="Display & Dock" desc="Configure the application dock" />
            <ToggleRow label="Auto-hide dock" desc="Hide the dock until hovered" value={prefs.dockAutoHide} onChange={(v) => updatePrefs({ dockAutoHide: v })} />
            <div>
              <Label>Dock Size: {prefs.dockSize}px</Label>
              <input type="range" min={40} max={72} value={prefs.dockSize} onChange={(e) => updatePrefs({ dockSize: parseInt(e.target.value) })} className="w-full" style={{ accentColor: 'var(--nexus-accent)' }} />
            </div>
          </div>
        )}

        {section === 'notifications' && (
          <div className="space-y-5">
            <SectionTitle title="Notifications" desc="Manage system notifications" />
            <ToggleRow label="Notifications" desc="Show system notifications" value={prefs.notifications} onChange={(v) => updatePrefs({ notifications: v })} />
          </div>
        )}

        {section === 'datetime' && (
          <div className="space-y-5">
            <SectionTitle title="Date & Time" desc="Clock display preferences" />
            <ToggleRow label="24-hour clock" desc="Use 24-hour time format" value={prefs.clock24h} onChange={(v) => updatePrefs({ clock24h: v })} />
            <ToggleRow label="Show seconds" desc="Display seconds in the clock" value={prefs.showSeconds} onChange={(v) => updatePrefs({ showSeconds: v })} />
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--nexus-border)' }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>Preview</p>
              <p className="mt-1 text-2xl font-semibold nexus-mono" style={{ color: 'var(--nexus-text)' }}>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: prefs.showSeconds ? '2-digit' : undefined, hour12: !prefs.clock24h })}
              </p>
              <p className="text-xs" style={{ color: 'var(--nexus-text-dim)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {section === 'desktop' && (
          <div className="space-y-5">
            <SectionTitle title="Desktop" desc="Desktop icon visibility" />
            <ToggleRow label="Show desktop icons" desc="Display shortcuts on the desktop" value={prefs.showDesktopIcons} onChange={(v) => updatePrefs({ showDesktopIcons: v })} />
          </div>
        )}

        {section === 'about' && (
          <div className="space-y-4">
            <SectionTitle title="About NEXUS OS" desc="System information" />
            <div className="flex flex-col items-center py-6">
              <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
                <rect width="64" height="64" rx="14" fill="#0b1226" stroke="var(--nexus-accent)" strokeWidth="2" />
                <path d="M20 44V20l24 24V20" stroke="var(--nexus-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2 className="mt-3 text-lg font-bold tracking-widest" style={{ color: 'var(--nexus-text)' }}>NEXUS OS</h2>
              <p className="text-[10px] tracking-[0.3em]" style={{ color: 'var(--nexus-text-faint)' }}>BEYOND THE DESKTOP</p>
            </div>
            <div className="rounded-lg border p-3 text-xs space-y-1.5" style={{ borderColor: 'var(--nexus-border)' }}>
              <InfoRow label="Version" value="1.0.0" />
              <InfoRow label="Build" value="2040.11" />
              <InfoRow label="Kernel" value="NEXUS (simulated)" />
              <InfoRow label="Storage" value="IndexedDB" />
              <InfoRow label="Render" value="React 18 + Canvas" />
              <InfoRow label="Architecture" value="Modular service-based" />
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--nexus-text-faint)' }}>
              NEXUS OS is a browser-based operating system simulator. It is not a real operating system and does not access physical hardware. All file operations occur within a virtual filesystem stored in your browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold" style={{ color: 'var(--nexus-text)' }}>{title}</h2>
      <p className="text-xs" style={{ color: 'var(--nexus-text-faint)' }}>{desc}</p>
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>{children}</p>;
}
function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--nexus-border)' }}>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>{label}</p>
        <p className="text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative h-6 w-11 rounded-full transition-colors"
        style={{ background: value ? 'var(--nexus-accent)' : 'rgba(255,255,255,0.1)' }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
          style={{ left: value ? 'calc(100% - 22px)' : '2px' }}
        />
      </button>
    </div>
  );
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--nexus-text-dim)' }}>{label}</span>
      <span className="nexus-mono" style={{ color: 'var(--nexus-text)' }}>{value}</span>
    </div>
  );
}

function WallpaperThumb({ id }: { id: string }) {
  const bg = id === 'aurora' ? 'radial-gradient(ellipse at 30% 70%, #0d1830, #070b18)'
    : id === 'nebula' ? 'radial-gradient(ellipse at 50% 50%, #1a1040, #070b18)'
    : id === 'grid' ? 'linear-gradient(#0b1226, #050810)'
    : id === 'deep' ? 'radial-gradient(circle at 50% 40%, #070b18, #02040a)'
    : 'radial-gradient(ellipse at 60% 30%, #1a1f3a, #070b18)';
  return <div className="h-14 rounded" style={{ background: bg }} />;
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
