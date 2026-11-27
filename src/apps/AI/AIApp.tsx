import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Trash2, FlaskConical, FileText, Activity } from 'lucide-react';
import type { WindowState } from '@/system/types';
import { VirtualFS } from '@/system/VirtualFS';
import { windowManager } from '@/system/WindowManager';
import { eventBus } from '@/system/EventBus';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  'Explain Newtonian gravity',
  'How do I save an experiment?',
  'What is wave interference?',
  'Show me my recent files',
  'Open the Orbit Lab',
];

export function AIApp({ win }: { win: WindowState }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: 'Hello. I am NEXUS AI, your research assistant. I can explain scientific concepts, help with experiments, and control NEXUS OS applications. How can I assist you?' },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, thinking]);

  const respond = async (userText: string): Promise<string> => {
    const q = userText.toLowerCase();
    // local demo mode responses
    if (q.includes('gravity') || q.includes('orbit')) {
      return 'Newtonian gravity describes attraction between masses via F = G·m₁·m₂/r². In NEXUS Orbit Lab, each body accelerates toward every other body proportional to mass and inversely to distance squared. Try increasing a planet\'s initial velocity to see elliptical orbits, or reduce it for a decaying trajectory.';
    }
    if (q.includes('wave') || q.includes('interference')) {
      return 'Wave interference occurs when two or more waves superpose. When crests align, you get constructive interference (brighter amplitude). When a crest meets a trough, you get destructive interference. In NEXUS Wave Lab, adjust frequency and wavelength of each source to see these patterns form in real time.';
    }
    if (q.includes('fluid') || q.includes('flow')) {
      return 'The Fluid Lab uses a particle-tracing approximation of potential flow around obstacles. Real computational fluid dynamics solves the Navier-Stokes equations, which is far more computationally expensive. This visualization is educational and shows how streamlines bend around obstacles.';
    }
    if (q.includes('save') || q.includes('experiment')) {
      return 'To save an experiment: open NEXUS Lab, run any simulation, then click "Save Experiment". The data is exported as a JSON file into your Experiments folder in NEXUS Files. You can open it later in NEXUS Studio or the Files preview.';
    }
    if (q.includes('recent') || q.includes('files') || q.includes('my files')) {
      const all = await VirtualFS.getAll();
      const recent = all.filter((f) => f.type === 'file').sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
      if (recent.length === 0) return 'You have no files yet. Create some in NEXUS Files or save an experiment from NEXUS Lab.';
      return 'Your recent files:\n' + recent.map((f) => `• ${f.name} (${new Date(f.updatedAt).toLocaleString()})`).join('\n');
    }
    if (q.includes('open') && q.includes('orbit')) {
      windowManager.open('lab', { lab: 'orbit' });
      return 'Opening NEXUS Lab — Orbit Lab. You can adjust gravity, add bodies, and save experiments.';
    }
    if (q.includes('open') && q.includes('wave')) {
      windowManager.open('lab', { lab: 'wave' });
      return 'Opening NEXUS Lab — Wave Lab. Try moving the wave sources by clicking on the field.';
    }
    if (q.includes('open') && q.includes('fluid')) {
      windowManager.open('lab', { lab: 'fluid' });
      return 'Opening NEXUS Lab — Fluid Lab. Click to add obstacles to the flow.';
    }
    if (q.includes('open') && q.includes('terminal')) { windowManager.open('terminal'); return 'Opening NEXUS Terminal.'; }
    if (q.includes('open') && q.includes('files')) { windowManager.open('files'); return 'Opening NEXUS Files.'; }
    if (q.includes('open') && q.includes('monitor')) { windowManager.open('monitor'); return 'Opening NEXUS Monitor.'; }
    if (q.includes('open') && q.includes('studio')) { windowManager.open('studio'); return 'Opening NEXUS Studio.'; }
    if (q.includes('open') && q.includes('settings') || q.includes('open') && q.includes('control')) {
      windowManager.open('control'); return 'Opening NEXUS Control (System Settings).';
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return 'Hello! I\'m running in local demonstration mode. I can explain the physics simulations in NEXUS Lab, help you navigate the system, and open applications. Try asking about gravity, waves, or fluid dynamics.';
    }
    if (q.includes('who are you') || q.includes('what are you')) {
      return 'I am NEXUS AI, an integrated assistant running in local demonstration mode. I do not access external networks or your physical hardware. I can explain scientific concepts and control NEXUS OS applications through authorized system APIs.';
    }
    if (q.includes('help')) {
      return 'I can help you with:\n• Explaining physics (gravity, waves, fluid dynamics)\n• Saving and finding experiments\n• Opening NEXUS applications (just ask)\n• Navigating the virtual filesystem\n\nTry: "Explain Newtonian gravity" or "Open the Orbit Lab"';
    }
    return `I understand you're asking about "${userText}". I'm running in local demonstration mode and can help with scientific concepts in NEXUS Lab, file management, and launching applications. Try "Explain wave interference" or "Open my files".`;
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setThinking(true);
    const reply = await respond(text);
    setThinking(false);
    setMessages((m) => [...m, { role: 'assistant', text: reply }]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: hexA('3b82f6', 0.15) }}>
            <Sparkles size={15} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>NEXUS AI</p>
            <p className="text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>Local demonstration mode</p>
          </div>
        </div>
        <button onClick={() => setMessages([{ role: 'assistant', text: 'Conversation cleared. How can I help?' }])} className="rounded p-1 transition-colors hover:bg-white/5">
          <Trash2 size={13} style={{ color: 'var(--nexus-text-faint)' }} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: m.role === 'user' ? hexA('22d3ee', 0.15) : hexA('3b82f6', 0.15) }}>
              {m.role === 'user' ? <User size={14} style={{ color: '#22d3ee' }} /> : <Sparkles size={14} style={{ color: '#3b82f6' }} />}
            </div>
            <div className="max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: m.role === 'user' ? hexA('22d3ee', 0.08) : 'rgba(255,255,255,0.03)', color: 'var(--nexus-text)' }}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: hexA('3b82f6', 0.15) }}>
              <Sparkles size={14} style={{ color: '#3b82f6' }} className="nexus-pulse" />
            </div>
            <div className="flex items-center gap-1 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="h-1.5 w-1.5 rounded-full nexus-pulse" style={{ background: '#3b82f6' }} />
              <span className="h-1.5 w-1.5 rounded-full nexus-pulse" style={{ background: '#3b82f6', animationDelay: '0.2s' }} />
              <span className="h-1.5 w-1.5 rounded-full nexus-pulse" style={{ background: '#3b82f6', animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 2 && (
        <div className="border-t px-3 py-2" style={{ borderColor: 'var(--nexus-border)' }}>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>Suggested</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border px-2.5 py-1 text-[10px] transition-colors hover:border-cyan-400" style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-dim)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t p-3" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask NEXUS AI..."
            rows={1}
            className="flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-xs outline-none focus:border-blue-400"
            style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)', maxHeight: 80 }}
          />
          <button onClick={() => send(input)} disabled={!input.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg transition-all disabled:opacity-40" style={{ background: '#3b82f6' }}>
            <Send size={15} className="text-white" />
          </button>
        </div>
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
