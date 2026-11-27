import { useEffect, useState, useCallback } from 'react';
import {
  Folder,
  FileText,
  FolderPlus,
  FilePlus,
  Trash2,
  Pencil,
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Download,
  HardDrive,
  X,
  Save,
  Eye,
} from 'lucide-react';
import type { WindowState, NexusFile } from '@/system/types';
import { VirtualFS } from '@/system/VirtualFS';
import { eventBus } from '@/system/EventBus';
import { windowManager } from '@/system/WindowManager';
import { Toolbar, TButton, EmptyState, bytes } from '../shared';
import { openMenu } from '@/components/ContextMenu';

export function FilesApp({ win }: { win: WindowState }) {
  const [cwd, setCwd] = useState<string | null>((win.props?.folderId as string) ?? null);
  const [items, setItems] = useState<NexusFile[]>([]);
  const [path, setPath] = useState<NexusFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [preview, setPreview] = useState<NexusFile | null>(null);
  const [stats, setStats] = useState({ count: 0, bytes: 0 });
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [histIdx, setHistIdx] = useState(0);
  const [clipboard, setClipboard] = useState<{ id: string; mode: 'copy' | 'cut' } | null>(null);

  const refresh = useCallback(async () => {
    const [list, p, s] = await Promise.all([
      VirtualFS.list(cwd),
      VirtualFS.pathOf(cwd ?? ''),
      VirtualFS.storageStats(),
    ]);
    setItems(list);
    setPath(p);
    setStats(s);
  }, [cwd]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return eventBus.on('fs:changed', () => refresh());
  }, [refresh]);

  useEffect(() => {
    if (win.props?.folderId && win.props.folderId !== cwd) {
      setCwd(win.props.folderId as string);
    }
  }, [win.props]);

  const navigate = (id: string | null) => {
    setCwd(id);
    setSelected(null);
    const newHist = history.slice(0, histIdx + 1);
    newHist.push(id);
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
  };

  const goBack = () => {
    if (histIdx > 0) {
      setHistIdx(histIdx - 1);
      setCwd(history[histIdx - 1]);
      setSelected(null);
    }
  };
  const goForward = () => {
    if (histIdx < history.length - 1) {
      setHistIdx(histIdx + 1);
      setCwd(history[histIdx + 1]);
      setSelected(null);
    }
  };

  const createFolder = async () => {
    const f = await VirtualFS.create({ name: 'New Folder', type: 'folder', parentId: cwd });
    setEditing({ id: f.id, name: 'New Folder' });
    eventBus.emit('fs:changed');
  };

  const createFile = async () => {
    const f = await VirtualFS.create({ name: 'untitled.txt', type: 'file', parentId: cwd, content: '', mimeType: 'text/plain' });
    setEditing({ id: f.id, name: 'untitled.txt' });
    eventBus.emit('fs:changed');
  };

  const commitRename = async () => {
    if (!editing) return;
    await VirtualFS.rename(editing.id, editing.name || 'untitled');
    setEditing(null);
    eventBus.emit('fs:changed');
  };

  const del = async (id: string) => {
    await VirtualFS.remove(id);
    setSelected(null);
    eventBus.emit('fs:changed');
  };

  const open = (item: NexusFile) => {
    if (item.type === 'folder') {
      navigate(item.id);
    } else if (item.mimeType === 'text/html' || item.name.endsWith('.html')) {
      windowManager.open('studio', { fileId: item.id });
    } else {
      setPreview(item);
    }
  };

  const filtered = query
    ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div className="flex h-full flex-col">
      <Toolbar>
        <TButton onClick={goBack} title="Back" active={false}><ArrowLeft size={14} /></TButton>
        <TButton onClick={goForward} title="Forward"><ArrowRight size={14} /></TButton>
        <TButton onClick={() => navigate(path.length > 1 ? path[path.length - 2].id : null)} title="Up"><ArrowUp size={14} /></TButton>
        <div className="mx-1 h-4 w-px" style={{ background: 'var(--nexus-border)' }} />
        <TButton onClick={createFolder} title="New folder"><FolderPlus size={13} /> Folder</TButton>
        <TButton onClick={createFile} title="New file"><FilePlus size={13} /> File</TButton>
        <div className="mx-1 h-4 w-px" style={{ background: 'var(--nexus-border)' }} />
        <TButton onClick={() => selected && clipboard?.id !== selected && setClipboard(selected ? { id: selected, mode: 'copy' } : null)} title="Copy" disabled={!selected}><FilePlus size={13} /></TButton>
        <TButton onClick={() => selected && setClipboard({ id: selected, mode: 'cut' })} title="Cut" disabled={!selected}><FilePlus size={13} /></TButton>
        <TButton
          onClick={async () => {
            if (!clipboard) return;
            if (clipboard.mode === 'copy') await VirtualFS.copy(clipboard.id, cwd);
            else { await VirtualFS.move(clipboard.id, cwd); setClipboard(null); }
            eventBus.emit('fs:changed');
          }}
          title="Paste"
          disabled={!clipboard}
        >
          <FilePlus size={13} />
        </TButton>
        <div className="mx-1 h-4 w-px" style={{ background: 'var(--nexus-border)' }} />
        <TButton onClick={() => selected && del(selected)} title="Delete" danger disabled={!selected}><Trash2 size={13} /></TButton>
        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--nexus-text-faint)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-28 rounded border bg-transparent py-1 pl-6 pr-2 text-xs outline-none focus:border-cyan-400"
              style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)' }}
            />
          </div>
        </div>
      </Toolbar>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 border-b px-3 py-1.5 text-xs" style={{ borderColor: 'var(--nexus-border)' }}>
        <button onClick={() => navigate(null)} className="transition-colors hover:text-white" style={{ color: 'var(--nexus-text-dim)' }}>
          <HardDrive size={13} />
        </button>
        {path.map((p, i) => (
          <span key={p.id} className="flex items-center gap-1">
            <span style={{ color: 'var(--nexus-text-faint)' }}>/</span>
            <button
              onClick={() => navigate(p.id)}
              className="transition-colors hover:text-white"
              style={{ color: i === path.length - 1 ? 'var(--nexus-text)' : 'var(--nexus-text-dim)' }}
            >
              {p.name}
            </button>
          </span>
        ))}
      </div>

      {/* File grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <EmptyState icon={Folder} title="This folder is empty" body="Create a new file or folder using the toolbar above." />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item.id)}
                onDoubleClick={() => open(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelected(item.id);
                  openMenu({
                    x: e.clientX,
                    y: e.clientY,
                    items: [
                      { label: 'Open', onClick: () => open(item) },
                      { label: 'Rename', icon: Pencil, onClick: () => setEditing({ id: item.id, name: item.name }) },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => del(item.id) },
                    ],
                  });
                }}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all"
                style={{
                  borderColor: selected === item.id ? hexA('22d3ee', 0.4) : 'transparent',
                  background: selected === item.id ? hexA('22d3ee', 0.08) : 'transparent',
                }}
                onMouseEnter={(e) => { if (selected !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { if (selected !== item.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.type === 'folder' ? (
                  <Folder size={32} style={{ color: '#3b82f6' }} />
                ) : (
                  <FileText size={32} style={{ color: 'var(--nexus-text-dim)' }} />
                )}
                {editing?.id === item.id ? (
                  <input
                    autoFocus
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(null); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded border bg-transparent px-1 py-0.5 text-center text-[10px] outline-none"
                    style={{ borderColor: 'var(--nexus-accent)', color: 'var(--nexus-text)' }}
                  />
                ) : (
                  <span className="line-clamp-2 w-full text-center text-[10px] leading-tight" style={{ color: 'var(--nexus-text-dim)' }}>
                    {item.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t px-3 py-1 text-[10px]" style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-faint)' }}>
        <span>{filtered.length} items{selected ? ` · 1 selected` : ''}</span>
        <span>{bytes(stats.bytes)} used · {stats.count} files total</span>
      </div>

      {/* Preview modal */}
      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} onSave={async (content) => { await VirtualFS.update(preview.id, { content }); eventBus.emit('fs:changed'); setPreview(null); }} />}
    </div>
  );
}

function PreviewModal({ file, onClose, onSave }: { file: NexusFile; onClose: () => void; onSave: (content: string) => void }) {
  const [content, setContent] = useState(file.content ?? '');
  const [mode, setMode] = useState<'edit' | 'view'>('view');
  return (
    <div className="absolute inset-0 z-50 flex flex-col nexus-glass" style={{ background: 'rgba(7,11,24,0.95)' }}>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="flex items-center gap-2">
          <FileText size={14} style={{ color: 'var(--nexus-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>{file.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')} className="rounded p-1 transition-colors hover:bg-white/5">
            {mode === 'edit' ? <Eye size={13} style={{ color: 'var(--nexus-text-dim)' }} /> : <Pencil size={13} style={{ color: 'var(--nexus-text-dim)' }} />}
          </button>
          {mode === 'edit' && (
            <button onClick={() => onSave(content)} className="flex items-center gap-1 rounded px-2 py-1 text-xs" style={{ background: 'var(--nexus-accent)', color: '#070b18' }}>
              <Save size={12} /> Save
            </button>
          )}
          <button onClick={onClose} className="rounded p-1 transition-colors hover:bg-white/5">
            <X size={14} style={{ color: 'var(--nexus-text-dim)' }} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {mode === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full w-full resize-none bg-transparent font-mono text-xs outline-none"
            style={{ color: 'var(--nexus-text)' }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-xs" style={{ color: 'var(--nexus-text-dim)' }}>{content || '(empty file)'}</pre>
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
