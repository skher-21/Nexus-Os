import { useState, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Star, StarOff, X, Plus, Globe, Lock, Search,
} from 'lucide-react';
import type { WindowState } from '@/system/types';

interface Tab {
  id: string;
  url: string;
  title: string;
  history: string[];
  histIdx: number;
}

const uid = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const QUICK_LINKS = [
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Newton%27s_law_of_universal_gravitation' },
  { name: 'NASA', url: 'https://www.nasa.gov' },
  { name: 'arXiv', url: 'https://arxiv.org' },
  { name: 'MDN', url: 'https://developer.mozilla.org' },
];

export function WebApp({ win }: { win: WindowState }) {
  const [tabs, setTabs] = useState<Tab[]>([{ id: uid(), url: '', title: 'New Tab', history: [''], histIdx: 0 }]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [addressInput, setAddressInput] = useState('');
  const [bookmarks, setBookmarks] = useState<{ url: string; name: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('nexus-bookmarks') ?? '[]'); } catch { return []; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const active = tabs.find((t) => t.id === activeId)!;

  const persistBookmarks = (b: { url: string; name: string }[]) => {
    setBookmarks(b);
    localStorage.setItem('nexus-bookmarks', JSON.stringify(b));
  };

  const updateTab = (id: string, patch: Partial<Tab>) => {
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const navigate = (input: string) => {
    let url = input.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) url = 'https://' + url;
      else url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    const newHist = [...active.history.slice(0, active.histIdx + 1), url];
    updateTab(activeId, { url, title: url.replace(/^https?:\/\//, '').split('/')[0], history: newHist, histIdx: newHist.length - 1 });
    setAddressInput(url);
  };

  const goBack = () => {
    if (active.histIdx > 0) {
      const idx = active.histIdx - 1;
      updateTab(activeId, { url: active.history[idx], histIdx: idx });
      setAddressInput(active.history[idx]);
    }
  };
  const goForward = () => {
    if (active.histIdx < active.history.length - 1) {
      const idx = active.histIdx + 1;
      updateTab(activeId, { url: active.history[idx], histIdx: idx });
      setAddressInput(active.history[idx]);
    }
  };

  const newTab = () => {
    const t: Tab = { id: uid(), url: '', title: 'New Tab', history: [''], histIdx: 0 };
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
    setAddressInput('');
  };

  const closeTab = (id: string) => {
    setTabs((ts) => {
      const filtered = ts.filter((t) => t.id !== id);
      if (filtered.length === 0) { return [{ id: uid(), url: '', title: 'New Tab', history: [''], histIdx: 0 }]; }
      if (id === activeId) { setActiveId(filtered[0].id); setAddressInput(filtered[0].url); }
      return filtered;
    });
  };

  const isBookmarked = bookmarks.some((b) => b.url === active.url);
  const toggleBookmark = () => {
    if (isBookmarked) persistBookmarks(bookmarks.filter((b) => b.url !== active.url));
    else persistBookmarks([...bookmarks, { url: active.url, name: active.title }]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5 overflow-x-auto nexus-no-scrollbar" style={{ borderColor: 'var(--nexus-border)' }}>
        {tabs.map((t) => (
          <div
            key={t.id}
            onClick={() => { setActiveId(t.id); setAddressInput(t.url); }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] cursor-pointer shrink-0"
            style={{
              background: t.id === activeId ? hexA('22d3ee', 0.1) : 'transparent',
              color: t.id === activeId ? 'var(--nexus-text)' : 'var(--nexus-text-dim)',
              border: t.id === activeId ? `1px solid ${hexA('22d3ee', 0.3)}` : '1px solid transparent',
            }}
          >
            <Globe size={10} />
            <span className="max-w-24 truncate">{t.title || 'New Tab'}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="rounded p-0.5 hover:bg-white/10">
              <X size={10} />
            </button>
          </div>
        ))}
        <button onClick={newTab} className="rounded p-1 hover:bg-white/5">
          <Plus size={13} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 border-b px-2 py-1.5" style={{ borderColor: 'var(--nexus-border)' }}>
        <button onClick={goBack} disabled={active.histIdx <= 0} className="rounded p-1 transition-colors hover:bg-white/5 disabled:opacity-30">
          <ArrowLeft size={14} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>
        <button onClick={goForward} disabled={active.histIdx >= active.history.length - 1} className="rounded p-1 transition-colors hover:bg-white/5 disabled:opacity-30">
          <ArrowRight size={14} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>
        <button onClick={() => active.url && updateTab(activeId, { url: active.url })} className="rounded p-1 transition-colors hover:bg-white/5">
          <RotateCw size={13} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>
        <button onClick={() => { updateTab(activeId, { url: '', title: 'New Tab' }); setAddressInput(''); }} className="rounded p-1 transition-colors hover:bg-white/5">
          <Home size={13} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>
        <form
          onSubmit={(e) => { e.preventDefault(); navigate(addressInput); }}
          className="flex flex-1 items-center gap-1.5 rounded-full border px-2.5 py-1"
          style={{ borderColor: 'var(--nexus-border)' }}
        >
          {active.url.startsWith('https://') ? <Lock size={11} style={{ color: '#34d399' }} /> : <Search size={11} style={{ color: 'var(--nexus-text-faint)' }} />}
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Search or enter address"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--nexus-text)' }}
          />
        </form>
        <button onClick={toggleBookmark} className="rounded p-1 transition-colors hover:bg-white/5">
          {isBookmarked ? <Star size={14} style={{ color: '#fbbf24' }} fill="#fbbf24" /> : <StarOff size={14} style={{ color: 'var(--nexus-text-dim)' }} />}
        </button>
        <button onClick={() => setShowBookmarks((s) => !s)} className="rounded p-1 transition-colors hover:bg-white/5">
          <Star size={14} style={{ color: showBookmarks ? 'var(--nexus-accent)' : 'var(--nexus-text-dim)' }} />
        </button>
      </div>

      {/* Bookmarks dropdown */}
      {showBookmarks && (
        <div className="absolute right-12 top-20 z-50 w-56 rounded-lg nexus-glass p-2" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>Bookmarks</p>
          {bookmarks.length === 0 ? (
            <p className="py-2 text-center text-[11px]" style={{ color: 'var(--nexus-text-faint)' }}>No bookmarks yet</p>
          ) : (
            bookmarks.map((b, i) => (
              <button
                key={i}
                onClick={() => { navigate(b.url); setShowBookmarks(false); }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] hover:bg-white/5"
                style={{ color: 'var(--nexus-text-dim)' }}
              >
                <Star size={11} style={{ color: '#fbbf24' }} />
                <span className="truncate">{b.name}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 bg-white">
        {active.url ? (
          <>
            <iframe
              ref={iframeRef}
              src={active.url}
              className="h-full w-full border-0"
              title={active.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] nexus-glass" style={{ color: 'var(--nexus-text-faint)' }}>
              Some sites may block embedding for security. This is expected browser behavior.
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4" style={{ background: '#070b18' }}>
            <Globe size={40} style={{ color: 'var(--nexus-accent)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--nexus-text-dim)' }}>NEXUS Web</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {QUICK_LINKS.map((q) => (
                <button
                  key={q.url}
                  onClick={() => navigate(q.url)}
                  className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-cyan-400"
                  style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-dim)' }}
                >
                  {q.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
