import { useEffect, useRef, useState } from 'react';
import type { WindowState, NexusFile } from '@/system/types';
import { VirtualFS } from '@/system/VirtualFS';
import { windowManager } from '@/system/WindowManager';
import { APP_LIST } from '@/system/AppRegistry';
import { PreferencesManager } from '@/system/Preferences';
import type { AppId } from '@/system/types';

interface Line {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export function TerminalApp({ win }: { win: WindowState }) {
  const [cwd, setCwd] = useState<string | null>(null);
  const [cwdName, setCwdName] = useState('~');
  const [lines, setLines] = useState<Line[]>([
    { type: 'system', text: 'NEXUS Terminal v1.0 — type "help" for available commands' },
    { type: 'system', text: 'All commands operate on the NEXUS virtual filesystem.' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cwdRef = useRef<string | null>(null);
  cwdRef.current = cwd;

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const print = (text: string, type: Line['type'] = 'output') =>
    setLines((l) => [...l, { type, text }]);

  const resolvePath = async (arg: string): Promise<string | null> => {
    if (!arg || arg === '.') return cwd;
    if (arg === '~' || arg === '/') return null;
    if (arg === '..') {
      const p = await VirtualFS.pathOf(cwd ?? '');
      return p.length > 1 ? p[p.length - 2].id : null;
    }
    if (arg.startsWith('/')) {
      const parts = arg.split('/').filter(Boolean);
      let cur: string | null = null;
      for (const part of parts) {
        const children = await VirtualFS.list(cur);
        const found = children.find((c) => c.name === part && c.type === 'folder');
        if (!found) return null;
        cur = found.id;
      }
      return cur;
    }
    // relative
    const children = await VirtualFS.list(cwd);
    const found = children.find((c) => c.name === arg);
    return found?.type === 'folder' ? found.id : null;
  };

  const commands: Record<string, (args: string[]) => Promise<void> | void> = {
    help: () => {
      print('Available commands:');
      print('  help              Show this help');
      print('  clear             Clear the screen');
      print('  date              Show current date');
      print('  time              Show current time');
      print('  whoami            Show current user');
      print('  sysinfo           Show system information');
      print('  ls [path]         List directory contents');
      print('  pwd               Print working directory');
      print('  cd <path>         Change directory');
      print('  mkdir <name>      Create a folder');
      print('  touch <name>      Create an empty file');
      print('  cat <file>        Display file contents');
      print('  write <file> ...  Write text to a file');
      print('  rm <name>         Remove a file or folder');
      print('  cp <a> <b>        Copy a file');
      print('  mv <a> <b>        Move/rename a file');
      print('  open <app>        Launch a NEXUS application');
      print('  apps              List installed applications');
      print('  theme <name>      Set theme (dark/light)');
      print('  echo <text>       Print text');
    },
    clear: () => setLines([]),
    date: () => print(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })),
    time: () => print(new Date().toLocaleTimeString('en-US')),
    whoami: () => print('researcher@nexus'),
    sysinfo: () => {
      print('NEXUS OS — Beyond the Desktop');
      print('Kernel: NEXUS 1.0 (simulated)');
      print('Shell: nexus-sh');
      print('Render: React + Canvas');
      print('Storage: IndexedDB virtual filesystem');
    },
    ls: async (args) => {
      const target = await resolvePath(args[0] ?? '');
      if (target === undefined && args[0]) { print(`ls: cannot access '${args[0]}'`, 'error'); return; }
      const items = await VirtualFS.list(target ?? null);
      if (items.length === 0) { print('(empty)'); return; }
      const names = items.map((i) => i.type === 'folder' ? i.name + '/' : i.name);
      print(names.join('   '));
    },
    pwd: async () => {
      const p = await VirtualFS.pathOf(cwdRef.current ?? '');
      print('/' + p.map((x) => x.name).join('/'));
    },
    cd: async (args) => {
      if (!args[0] || args[0] === '~') { setCwd(null); setCwdName('~'); return; }
      const target = await resolvePath(args[0]);
      if (target === null && args[0] !== '..') { print(`cd: no such directory: ${args[0]}`, 'error'); return; }
      setCwd(target);
      const p = await VirtualFS.pathOf(target ?? '');
      setCwdName('~/' + p.map((x) => x.name).join('/'));
    },
    mkdir: async (args) => {
      if (!args[0]) { print('mkdir: missing operand', 'error'); return; }
      await VirtualFS.create({ name: args[0], type: 'folder', parentId: cwd });
      print(`Created folder: ${args[0]}`);
    },
    touch: async (args) => {
      if (!args[0]) { print('touch: missing operand', 'error'); return; }
      await VirtualFS.create({ name: args[0], type: 'file', parentId: cwd, content: '', mimeType: 'text/plain' });
      print(`Created file: ${args[0]}`);
    },
    cat: async (args) => {
      if (!args[0]) { print('cat: missing operand', 'error'); return; }
      const items = await VirtualFS.list(cwd);
      const file = items.find((f) => f.name === args[0] && f.type === 'file');
      if (!file) { print(`cat: ${args[0]}: No such file`, 'error'); return; }
      print(file.content || '(empty)');
    },
    write: async (args) => {
      if (!args[0]) { print('write: missing filename', 'error'); return; }
      const content = args.slice(1).join(' ');
      const items = await VirtualFS.list(cwd);
      let file = items.find((f) => f.name === args[0] && f.type === 'file');
      if (file) await VirtualFS.update(file.id, { content });
      else file = await VirtualFS.create({ name: args[0], type: 'file', parentId: cwd, content, mimeType: 'text/plain' });
      print(`Wrote ${content.length} bytes to ${args[0]}`);
    },
    rm: async (args) => {
      if (!args[0]) { print('rm: missing operand', 'error'); return; }
      const items = await VirtualFS.list(cwd);
      const target = items.find((f) => f.name === args[0]);
      if (!target) { print(`rm: ${args[0]}: No such file or directory`, 'error'); return; }
      await VirtualFS.remove(target.id);
      print(`Removed: ${args[0]}`);
    },
    cp: async (args) => {
      if (!args[0] || !args[1]) { print('cp: missing operand', 'error'); return; }
      const items = await VirtualFS.list(cwd);
      const src = items.find((f) => f.name === args[0]);
      if (!src) { print(`cp: ${args[0]}: No such file`, 'error'); return; }
      await VirtualFS.copy(src.id, cwd);
      // rename the copy
      const after = await VirtualFS.list(cwd);
      const copy = after.find((f) => f.name === src.name && f.id !== src.id);
      if (copy) await VirtualFS.rename(copy.id, args[1]);
      print(`Copied ${args[0]} -> ${args[1]}`);
    },
    mv: async (args) => {
      if (!args[0] || !args[1]) { print('mv: missing operand', 'error'); return; }
      const items = await VirtualFS.list(cwd);
      const src = items.find((f) => f.name === args[0]);
      if (!src) { print(`mv: ${args[0]}: No such file`, 'error'); return; }
      await VirtualFS.rename(src.id, args[1]);
      print(`Moved ${args[0]} -> ${args[1]}`);
    },
    open: (args) => {
      const id = (args[0] ?? '').toLowerCase() as AppId;
      const app = APP_LIST.find((a) => a.id === id || a.name.toLowerCase().includes(id));
      if (!app) { print(`open: unknown application: ${args[0]}`, 'error'); return; }
      windowManager.open(app.id);
      print(`Launching ${app.name}...`);
    },
    apps: () => {
      APP_LIST.forEach((a) => print(`  ${a.id.padEnd(12)} ${a.name}`));
    },
    theme: (args) => {
      const t = args[0];
      if (t !== 'dark' && t !== 'light') { print('theme: usage: theme <dark|light>', 'error'); return; }
      const prefs = PreferencesManager.load();
      PreferencesManager.save({ ...prefs, theme: t });
      PreferencesManager.applyTheme(t);
      print(`Theme set to ${t}`);
    },
    echo: (args) => print(args.join(' ')),
  };

  const run = async (raw: string) => {
    const cmd = raw.trim();
    setLines((l) => [...l, { type: 'input', text: `${cwdName} $ ${cmd}` }]);
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setHistIdx(-1);
    const [name, ...args] = cmd.split(/\s+/);
    const fn = commands[name];
    if (!fn) { print(`nexus-sh: command not found: ${name}`, 'error'); return; }
    try { await fn(args); } catch (e) { print(`error: ${String(e)}`, 'error'); }
  };

  const autocomplete = () => {
    const parts = input.split(/\s+/);
    if (parts.length === 1) {
      const matches = Object.keys(commands).filter((c) => c.startsWith(parts[0]));
      if (matches.length === 1) setInput(matches[0] + ' ');
    } else {
      VirtualFS.list(cwd).then((items) => {
        const last = parts[parts.length - 1];
        const match = items.find((i) => i.name.startsWith(last));
        if (match) {
          parts[parts.length - 1] = match.name;
          setInput(parts.join(' '));
        }
      });
    }
  };

  return (
    <div
      className="flex h-full flex-col p-3 nexus-mono text-xs"
      style={{ background: '#050810' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {lines.map((line, i) => (
          <div
            key={i}
            className="whitespace-pre-wrap break-all leading-relaxed"
            style={{
              color:
                line.type === 'error' ? 'var(--nexus-error)'
                : line.type === 'system' ? 'var(--nexus-text-faint)'
                : line.type === 'input' ? 'var(--nexus-accent)'
                : 'var(--nexus-text-dim)',
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2">
        <span style={{ color: 'var(--nexus-accent)' }}>{cwdName} $</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { run(input); setInput(''); }
            else if (e.key === 'ArrowUp') {
              const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
              if (history[idx]) { setHistIdx(idx); setInput(history[idx]); }
            } else if (e.key === 'ArrowDown') {
              if (histIdx === -1) return;
              const idx = histIdx + 1;
              if (idx >= history.length) { setHistIdx(-1); setInput(''); }
              else { setHistIdx(idx); setInput(history[idx]); }
            } else if (e.key === 'Tab') { e.preventDefault(); autocomplete(); }
          }}
          className="flex-1 bg-transparent outline-none"
          style={{ color: 'var(--nexus-text)', caretColor: 'var(--nexus-accent)' }}
        />
      </div>
    </div>
  );
}
