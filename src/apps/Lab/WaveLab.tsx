import { useRef, useEffect, useState } from 'react';
import { useRafLoop, Slider } from '../shared';

interface Source {
  x: number;
  y: number;
  amplitude: number;
  frequency: number;
  wavelength: number;
  phase: number;
  color: string;
}

const COLORS = ['#22d3ee', '#fbbf24', '#fb7185'];

export function WaveLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sources, setSources] = useState<Source[]>([
    { x: 0.3, y: 0.5, amplitude: 1, frequency: 1, wavelength: 60, phase: 0, color: '#22d3ee' },
    { x: 0.7, y: 0.5, amplitude: 1, frequency: 1, wavelength: 60, phase: 0, color: '#fbbf24' },
  ]);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const tRef = useRef(0);
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const imgRef = useRef<ImageData | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    if (!imgRef.current || imgRef.current.width !== w || imgRef.current.height !== h) {
      imgRef.current = ctx.createImageData(w, h);
    }
    const img = imgRef.current;
    const data = img.data;
    const srcs = sourcesRef.current;
    const t = tRef.current;
    const step = 3; // render every 3rd pixel for performance

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        let sum = 0;
        for (const s of srcs) {
          const sx = s.x * w;
          const sy = s.y * h;
          const dist = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
          const wave = s.amplitude * Math.sin((2 * Math.PI * dist / s.wavelength) - s.frequency * t * 2 * Math.PI + s.phase);
          sum += wave;
        }
        // map sum to color
        const norm = Math.max(-1, Math.min(1, sum / Math.max(1, srcs.length)));
        let r, g, b;
        if (norm > 0) {
          // constructive — cyan
          r = Math.round(34 + norm * 20);
          g = Math.round(60 + norm * 150);
          b = Math.round(120 + norm * 135);
        } else {
          // destructive — deep blue/violet
          r = Math.round(20 + (-norm) * 80);
          g = Math.round(20 + (-norm) * 30);
          b = Math.round(50 + (-norm) * 90);
        }
        // fill block
        for (let dy = 0; dy < step && y + dy < h; dy++) {
          for (let dx = 0; dx < step && x + dx < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    // draw sources
    if (showSources) {
      for (let i = 0; i < srcs.length; i++) {
        const s = srcs[i];
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, selected === i ? 10 : 7, 0, Math.PI * 2);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = selected === i ? 3 : 2;
        ctx.stroke();
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  useRafLoop((dt) => {
    if (!paused) tRef.current += dt;
    draw();
  }, true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) { canvas.width = rect.width; canvas.height = rect.height; }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const updateSource = (patch: Partial<Source>) => {
    setSources((s) => s.map((src, i) => i === selected ? { ...src, ...patch } : src));
  };

  const sel = sources[selected];

  return (
    <div className="flex h-full">
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setSources((s) => s.map((src, i) => i === selected ? { ...src, x, y } : src));
          }}
        />
        <div className="absolute left-3 top-3 rounded-lg nexus-glass px-3 py-2 text-[10px]" style={{ color: 'var(--nexus-text-dim)' }}>
          <p className="font-semibold" style={{ color: 'var(--nexus-text)' }}>Wave Interference Lab</p>
          <p className="mt-0.5">ψ(r,t) = Σ A·sin(2π·r/λ − f·t + φ)</p>
          <p className="mt-0.5">Click the field to move the selected source.</p>
        </div>
      </div>
      <div className="w-60 shrink-0 overflow-y-auto border-l p-3 space-y-3" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="flex gap-1.5">
          <button onClick={() => setPaused(!paused)} className="flex-1 rounded-md py-1.5 text-xs font-medium" style={{ background: paused ? 'var(--nexus-accent)' : 'rgba(255,255,255,0.05)', color: paused ? '#070b18' : 'var(--nexus-text)' }}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setSources((s) => [...s, { x: 0.5, y: 0.5, amplitude: 1, frequency: 1, wavelength: 60, phase: 0, color: COLORS[s.length % COLORS.length] }])}
            className="flex-1 rounded-md py-1.5 text-xs"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--nexus-text)' }}
          >+ Source</button>
        </div>

        <div className="flex flex-wrap gap-1">
          {sources.map((s, i) => (
            <button key={i} onClick={() => setSelected(i)} className="h-6 w-6 rounded-full border-2" style={{ background: s.color, borderColor: selected === i ? '#fff' : 'transparent' }} />
          ))}
        </div>

        {sel && (
          <>
            <Slider label="Amplitude" value={sel.amplitude} onChange={(v) => updateSource({ amplitude: v })} min={0} max={2} step={0.1} />
            <Slider label="Frequency" value={sel.frequency} onChange={(v) => updateSource({ frequency: v })} min={0.1} max={3} step={0.1} unit=" Hz" />
            <Slider label="Wavelength" value={sel.wavelength} onChange={(v) => updateSource({ wavelength: v })} min={10} max={200} step={1} unit="px" />
            <Slider label="Phase" value={sel.phase} onChange={(v) => updateSource({ phase: v })} min={0} max={6.28} step={0.1} unit="rad" />
            <button
              onClick={() => setSources((s) => s.filter((_, i) => i !== selected).concat(s.length > 1 ? [] : []))}
              className="w-full rounded-md py-1 text-xs"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--nexus-error)' }}
            >
              Remove source (sel {selected + 1})
            </button>
            <button
              onClick={() => { if (sources.length > 1) { setSources((s) => s.filter((_, i) => i !== selected)); setSelected(0); } }}
              className="w-full rounded-md py-1 text-xs"
              style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--nexus-error)' }}
            >Delete Source</button>
          </>
        )}
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--nexus-text-dim)' }}>
          <input type="checkbox" checked={showSources} onChange={(e) => setShowSources(e.target.checked)} /> Show source markers
        </label>
        <div className="border-t pt-2 text-[10px]" style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-faint)' }}>
          <p>Cyan = constructive interference</p>
          <p>Dark = destructive interference</p>
        </div>
      </div>
    </div>
  );
}
