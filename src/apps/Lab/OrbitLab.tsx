import { useRef, useEffect, useState, useCallback } from 'react';
import { useRafLoop, Slider } from '../shared';

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  color: string;
  fixed?: boolean;
  trail: { x: number; y: number }[];
}

const COLORS = ['#22d3ee', '#fbbf24', '#34d399', '#fb7185', '#8b5cf6', '#3b82f6'];

export function OrbitLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodiesRef = useRef<Body[]>([]);
  const [bodies, setBodies] = useState<Body[]>([]);
  const [G, setG] = useState(60);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [trails, setTrails] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<number>(0);
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const reset = useCallback(() => {
    const sun: Body = { x: 0, y: 0, vx: 0, vy: 0, mass: 500, color: '#fbbf24', fixed: true, trail: [] };
    const p1: Body = { x: 120, y: 0, vx: 0, vy: 64, mass: 10, color: '#22d3ee', trail: [] };
    const p2: Body = { x: -200, y: 0, vx: 0, vy: -48, mass: 20, color: '#fb7185', trail: [] };
    const p3: Body = { x: 0, y: 180, vx: -52, vy: 0, mass: 8, color: '#34d399', trail: [] };
    bodiesRef.current = [sun, p1, p2, p3];
    setBodies([...bodiesRef.current]);
  }, []);

  useEffect(() => { reset(); }, [reset]);

  useRafLoop((dt) => {
    if (paused) return;
    const bodies = bodiesRef.current;
    const sdt = dt * speed;
    // compute accelerations
    const ax = new Array(bodies.length).fill(0);
    const ay = new Array(bodies.length).fill(0);
    for (let i = 0; i < bodies.length; i++) {
      for (let j = 0; j < bodies.length; j++) {
        if (i === j) continue;
        const dx = bodies[j].x - bodies[i].x;
        const dy = bodies[j].y - bodies[i].y;
        const r2 = Math.max(25, dx * dx + dy * dy);
        const r = Math.sqrt(r2);
        const f = (G * bodies[j].mass) / r2;
        ax[i] += f * (dx / r);
        ay[i] += f * (dy / r);
      }
    }
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i].fixed) continue;
      bodies[i].vx += ax[i] * sdt;
      bodies[i].vy += ay[i] * sdt;
      bodies[i].x += bodies[i].vx * sdt;
      bodies[i].y += bodies[i].vy * sdt;
      if (trails) {
        bodies[i].trail.push({ x: bodies[i].x, y: bodies[i].y });
        if (bodies[i].trail.length > 300) bodies[i].trail.shift();
      }
    }
    draw();
    setBodies([...bodies.map((b) => ({ ...b, trail: [...b.trail] }))]);
  }, true);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = 'rgba(56,189,248,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const cx = w / 2 + panRef.current.x;
    const cy = h / 2 + panRef.current.y;
    const z = zoomRef.current;

    const bodies = bodiesRef.current;
    // trails
    if (trails) {
      for (const b of bodies) {
        if (b.trail.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = b.color + '40';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < b.trail.length; i++) {
          const px = cx + b.trail[i].x * z;
          const py = cy + b.trail[i].y * z;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    // bodies
    for (const b of bodies) {
      const px = cx + b.x * z;
      const py = cy + b.y * z;
      const r = Math.max(3, Math.sqrt(b.mass) * 0.6 * z);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
      grad.addColorStop(0, b.color);
      grad.addColorStop(0.4, b.color + '80');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    }
  };

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const addBody = () => {
    const b: Body = {
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      vx: 0,
      vy: 40,
      mass: 10,
      color: COLORS[bodiesRef.current.length % COLORS.length],
      trail: [],
    };
    bodiesRef.current = [...bodiesRef.current, b];
    setSelected(bodiesRef.current.length - 1);
  };

  const removeBody = () => {
    if (bodiesRef.current.length <= 1) return;
    const idx = Math.max(1, selected);
    bodiesRef.current = bodiesRef.current.filter((_, i) => i !== idx);
    setSelected(0);
  };

  const updateBody = (patch: Partial<Body>) => {
    bodiesRef.current = bodiesRef.current.map((b, i) => i === selected ? { ...b, ...patch } : b);
  };

  const sel = bodies[selected];

  return (
    <div className="flex h-full">
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => { dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; }}
          onMouseMove={(e) => {
            if (dragRef.current) {
              setPan({ x: dragRef.current.px + (e.clientX - dragRef.current.x), y: dragRef.current.py + (e.clientY - dragRef.current.y) });
            }
          }}
          onMouseUp={() => { dragRef.current = null; }}
          onMouseLeave={() => { dragRef.current = null; }}
          onWheel={(e) => { setZoom((z) => Math.max(0.2, Math.min(3, z - e.deltaY * 0.001))); }}
        />
        <div className="absolute left-3 top-3 rounded-lg nexus-glass px-3 py-2 text-[10px]" style={{ color: 'var(--nexus-text-dim)' }}>
          <p className="font-semibold" style={{ color: 'var(--nexus-text)' }}>Newtonian Orbit Lab</p>
          <p className="mt-0.5">F = G·m₁·m₂/r² · velocity Verlet integration</p>
          <p className="mt-0.5">Educational simulation. Not to scale.</p>
        </div>
        {sel && (
          <div className="absolute bottom-3 left-3 rounded-lg nexus-glass px-3 py-2 text-[10px] nexus-mono" style={{ color: 'var(--nexus-text-dim)' }}>
            <div>pos: ({sel.x.toFixed(1)}, {sel.y.toFixed(1)})</div>
            <div>vel: ({sel.vx.toFixed(1)}, {sel.vy.toFixed(1)})</div>
            <div>mass: {sel.mass.toFixed(1)} | speed: {Math.hypot(sel.vx, sel.vy).toFixed(2)}</div>
          </div>
        )}
      </div>

      <div className="w-60 shrink-0 overflow-y-auto border-l p-3 space-y-3" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="flex gap-1.5">
          <button onClick={() => setPaused(!paused)} className="flex-1 rounded-md py-1.5 text-xs font-medium" style={{ background: paused ? 'var(--nexus-accent)' : 'rgba(255,255,255,0.05)', color: paused ? '#070b18' : 'var(--nexus-text)' }}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={reset} className="flex-1 rounded-md py-1.5 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--nexus-text)' }}>Reset</button>
        </div>
        <Slider label="Sim Speed" value={speed} onChange={setSpeed} min={0.1} max={3} step={0.1} unit="x" />
        <Slider label="Gravity G" value={G} onChange={setG} min={1} max={200} step={1} />
        <Slider label="Zoom" value={zoom} onChange={setZoom} min={0.2} max={3} step={0.1} unit="x" />
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--nexus-text-dim)' }}>
          <input type="checkbox" checked={trails} onChange={(e) => setTrails(e.target.checked)} /> Show trails
        </label>

        <div className="border-t pt-3" style={{ borderColor: 'var(--nexus-border)' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>Bodies ({bodies.length})</span>
            <div className="flex gap-1">
              <button onClick={addBody} className="rounded px-2 py-0.5 text-[10px]" style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--nexus-accent)' }}>+ Add</button>
              <button onClick={removeBody} className="rounded px-2 py-0.5 text-[10px]" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--nexus-error)' }}>- Remove</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {bodies.map((b, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="h-6 w-6 rounded-full border-2"
                style={{ background: b.color, borderColor: selected === i ? '#fff' : 'transparent' }}
              />
            ))}
          </div>
          {sel && (
            <div className="mt-3 space-y-2">
              <Slider label="Mass" value={sel.mass} onChange={(v) => updateBody({ mass: v })} min={1} max={1000} step={1} />
              <Slider label="Velocity X" value={sel.vx} onChange={(v) => updateBody({ vx: v })} min={-200} max={200} step={1} />
              <Slider label="Velocity Y" value={sel.vy} onChange={(v) => updateBody({ vy: v })} min={-200} max={200} step={1} />
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--nexus-text-dim)' }}>
                <input type="checkbox" checked={!!sel.fixed} onChange={(e) => updateBody({ fixed: e.target.checked })} /> Fixed (anchor)
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
