import { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Save,
  Search,
  Eye,
  Code2,
  X,
  Play,
  FolderOpen,
} from 'lucide-react';
import type { WindowState, NexusFile } from '@/system/types';
import { VirtualFS } from '@/system/VirtualFS';
import { eventBus } from '@/system/EventBus';
import { windowManager } from '@/system/WindowManager';
import { EmptyState } from '../shared';

export function StudioApp({ win }: { win: WindowState }) {
  const [openFiles, setOpenFiles] = useState<NexusFile[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [tree, setTree] = useState<NexusFile[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([null as unknown as string]));
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const all = await VirtualFS.getAll();
    setTree(all);
  };

  useEffect(() => {
    refresh();
    return eventBus.on('fs:changed', refresh);
  }, []);

  useEffect(() => {
    if (win.props?.fileId) openFile(win.props.fileId as string);
  }, [win.props]);

  const openFile = async (id: string) => {
    const file = await VirtualFS.get(id);
    if (!file || file.type !== 'file') return;
    setOpenFiles((prev) => prev.some((f) => f.id === id) ? prev : [...prev, file]);
    setContents((c) => ({ ...c, [id]: file.content ?? '' }));
    setActiveTab(id);
  };

  const closeTab = (id: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.id !== id));
    setContents((c) => { const n = { ...c }; delete n[id]; return n; });
    if (activeTab === id) {
      const remaining = openFiles.filter((f) => f.id !== id);
      setActiveTab(remaining[0]?.id ?? null);
    }
  };

  const save = async (id: string) => {
    const content = contents[id];
    await VirtualFS.update(id, { content });
    setDirty((d) => { const n = new Set(d); n.delete(id); return n; });
    eventBus.emit('fs:changed');
  };

  const updateContent = (id: string, content: string) => {
    setContents((c) => ({ ...c, [id]: content }));
    setDirty((d) => new Set(d).add(id));
  };

  const activeFile = openFiles.find((f) => f.id === activeTab);
  const activeContent = activeTab ? contents[activeTab] ?? '' : '';

  // simple syntax highlight for HTML
  const highlight = (code: string): string => {
    if (!activeFile) return code;
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#22d3ee">$2</span>')
      .replace(/([\w-]+)=("[^"]*")/g, '<span style="color:#fbbf24">$1</span>=<span style="color:#34d399">$2</span>')
      .replace(/(&lt;!--.*?--&gt;)/g, '<span style="color:#5a6d92">$1</span>');
  };

  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = tree
      .filter((f) => f.parentId === parentId)
      .filter((f) => !query || f.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name)));
    if (children.length === 0 && depth === 0) {
      return <p className="px-3 py-4 text-center text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>No files</p>;
    }
    return children.map((item) => {
      const isOpen = expanded.has(item.id);
      return (
        <div key={item.id}>
          <div
            className="flex cursor-pointer items-center gap-1 px-2 py-1 text-xs hover:bg-white/5"
            style={{ paddingLeft: 8 + depth * 12, color: 'var(--nexus-text-dim)' }}
            onClick={() => item.type === 'folder' ? setExpanded((e) => { const n = new Set(e); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; }) : openFile(item.id)}
          >
            {item.type === 'folder' ? (
              <>
                <span style={{ color: 'var(--nexus-text-faint)' }}>{isOpen ? '▾' : '▸'}</span>
                <FolderOpen size={12} style={{ color: '#3b82f6' }} />
              </>
            ) : (
              <>
                <span style={{ width: 12 }} />
                <FileText size={12} style={{ color: 'var(--nexus-text-faint)' }} />
              </>
            )}
            <span className="truncate">{item.name}</span>
          </div>
          {item.type === 'folder' && isOpen && renderTree(item.id, depth + 1)}
        </div>
      );
    });
  };

  const canPreview = activeFile?.mimeType === 'text/html' || activeFile?.name.endsWith('.html');

  return (
    <div className="flex h-full">
      {/* File explorer */}
      <div className="flex w-52 shrink-0 flex-col border-r" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="border-b px-2 py-1.5" style={{ borderColor: 'var(--nexus-border)' }}>
          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--nexus-text-faint)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded border bg-transparent py-1 pl-6 pr-2 text-[11px] outline-none"
              style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)' }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">{renderTree(null, 0)}</div>
        <div className="border-t px-2 py-1.5 text-[10px]" style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-faint)' }}>
          {tree.filter((f) => f.type === 'file').length} files in workspace
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col">
        {openFiles.length === 0 ? (
          <EmptyState icon={Code2} title="No file open" body="Select a file from the explorer to start editing. HTML files support live preview." />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center border-b overflow-x-auto nexus-no-scrollbar" style={{ borderColor: 'var(--nexus-border)' }}>
              {openFiles.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveTab(f.id)}
                  className="flex items-center gap-1.5 border-r px-3 py-1.5 text-xs cursor-pointer"
                  style={{
                    borderColor: 'var(--nexus-border)',
                    background: activeTab === f.id ? hexA('fb7185', 0.08) : 'transparent',
                    color: activeTab === f.id ? 'var(--nexus-text)' : 'var(--nexus-text-dim)',
                  }}
                >
                  <FileText size={11} />
                  <span>{f.name}</span>
                  {dirty.has(f.id) && <span style={{ color: '#fb7185' }}>●</span>}
                  <button onClick={(e) => { e.stopPropagation(); closeTab(f.id); }} className="rounded p-0.5 hover:bg-white/10">
                    <X size={11} />
                  </button>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1 px-2">
                {canPreview && (
                  <button onClick={() => setPreview(!preview)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px]" style={{ background: preview ? hexA('22d3ee', 0.15) : 'transparent', color: preview ? '#22d3ee' : 'var(--nexus-text-dim)' }}>
                    {preview ? <Code2 size={11} /> : <Eye size={11} />} {preview ? 'Edit' : 'Preview'}
                  </button>
                )}
                <button onClick={() => activeTab && save(activeTab)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px]" style={{ background: hexA('34d399', 0.15), color: '#34d399' }}>
                  <Save size={11} /> Save
                </button>
              </div>
            </div>

            {/* Content */}
            {preview && canPreview ? (
              <iframe srcDoc={activeContent} className="flex-1 bg-white" title="preview" sandbox="allow-scripts" />
            ) : (
              <div className="relative flex-1 overflow-auto" style={{ background: '#050810' }}>
                <div className="flex">
                  {/* line numbers */}
                  <div className="select-none nexus-mono py-3 pl-3 pr-2 text-right text-[11px] leading-5" style={{ color: 'var(--nexus-text-faint)', minWidth: 40 }}>
                    {activeContent.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                  </div>
                  {/* code */}
                  <div className="relative flex-1">
                    <pre
                      className="pointer-events-none absolute inset-0 nexus-mono py-3 pr-3 text-[11px] leading-5 whitespace-pre-wrap"
                      style={{ color: 'var(--nexus-text)', margin: 0 }}
                      dangerouslySetInnerHTML={{ __html: highlight(activeContent) + '\n' }}
                    />
                    <textarea
                      value={activeContent}
                      onChange={(e) => activeTab && updateContent(activeTab, e.target.value)}
                      className="absolute inset-0 resize-none bg-transparent nexus-mono py-3 pr-3 text-[11px] leading-5 whitespace-pre-wrap outline-none"
                      style={{ color: 'transparent', caretColor: 'var(--nexus-accent)' }}
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
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
