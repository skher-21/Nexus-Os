import { useRef, useEffect, useState, useCallback } from 'react';
import { useRafLoop, Slider } from '../shared';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Obstacle {
  x: number;
  y: number;
  r: number;
}

export function FluidLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [velocity, setVelocity] = useState(1.5);
  const [viscosity, setViscosity] = useState(0.02);
  const [paused, setPaused] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([{ x: 0.5, y: 0.5, r: 30 }]);
  const [colorMode, setColorMode] = useState(true);
  const particlesRef = useRef<Particle[]>([]);
  const velRef = useRef(velocity);
  const visRef = useRef(viscosity);
  visRef.current = viscosity;
  velRef.current = velocity;
  const obsRef = useRef(obstacles);
  obsRef.current = obstacles;

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    particlesRef.current = Array.from({ length: 1200 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: velRef.current,
      vy: 0,
      life: Math.random() * 200 + 50,
    }));
  }, []);

  useRafLoop((_dt) => {
    if (paused) { draw(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const v = velRef.current;
    const visc = visRef.current;
    const obs = obsRef.current;

    // fade background for trail effect
    ctx.fillStyle = 'rgba(5,8,16,0.12)';
    ctx.fillRect(0, 0, w, h);

    const particles = particlesRef.current;
    for (const p of particles) {
      // base flow left to right
      p.vx += (v - p.vx) * 0.05;
      // simple shear: slight vertical variation by y position
      const shear = Math.sin((p.y / h) * Math.PI) * 0.3;
      p.vy += (shear - p.vy) * 0.03;

      // obstacle influence (potential flow approximation around circle)
      for (const o of obs) {
        const ox = o.x * w;
        const oy = o.y * h;
        const dx = p.x - ox;
        const dy = p.y - oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < o.r) {
          // push out
          const ang = Math.atan2(dy, dx);
          p.x = ox + Math.cos(ang) * o.r;
          p.y = oy + Math.sin(ang) * o.r;
          p.vx = Math.cos(ang) * v;
          p.vy = Math.sin(ang) * v;
        } else if (dist < o.r * 3) {
          // deflection
          const force = (o.r * 2) / (dist * dist);
          p.vx += dx * force * 0.1;
          p.vy += dy * force * 0.1;
        }
      }

      // viscosity damping
      p.vx *= 1 - visc;
      p.vy *= 1 - visc;

      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // wrap or reset
      if (p.x > w || p.x < 0 || p.y < 0 || p.y > h || p.life <= 0) {
        p.x = 0;
        p.y = Math.random() * h;
        p.vx = v;
        p.vy = 0;
        p.life = Math.random() * 200 + 100;
      }

      // color by speed
      const speed = Math.hypot(p.vx, p.vy);
      const norm = Math.min(1, speed / (v * 2.5));
      let color: string;
      if (colorMode) {
        // velocity color map: blue -> cyan -> yellow -> red
        const hue = 220 - norm * 220;
        color = `hsla(${hue}, 80%, 55%, 0.7)`;
      } else {
        color = `rgba(34,211,238,${0.3 + norm * 0.5})`;
      }
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }

    // draw obstacles
    for (const o of obs) {
      ctx.beginPath();
      ctx.arc(o.x * w, o.y * h, o.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,92,246,0.25)';
      ctx.fill();
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, true);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) { canvas.width = rect.width; canvas.height = rect.height; initParticles(); }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [initParticles]);

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
            setObstacles((o) => [...o, { x, y, r: 25 }]);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            // remove nearest obstacle
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setObstacles((o) => {
              if (o.length <= 1) return o;
              let best = 0; let bd = Infinity;
              o.forEach((obs, i) => {
                const d = Math.hypot(obs.x - x, obs.y - y);
                if (d < bd) { bd = d; best = i; }
              });
              return o.filter((_, i) => i !== best);
            });
          }}
        />
        <div className="absolute left-3 top-3 rounded-lg nexus-glass px-3 py-2 text-[10px]" style={{ color: 'var(--nexus-text-dim)' }}>
          <p className="font-semibold" style={{ color: 'var(--nexus-text)' }}>Fluid Flow Lab</p>
          <p className="mt-0.5">Particle tracing · potential flow approximation</p>
          <p className="mt-0.5">Click to add obstacle · Right-click to remove</p>
          <p className="mt-0.5">Educational visualization, not a full CFD solver.</p>
        </div>
      </div>
      <div className="w-56 shrink-0 overflow-y-auto border-l p-3 space-y-3" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="flex gap-1.5">
          <button onClick={() => setPaused(!paused)} className="flex-1 rounded-md py-1.5 text-xs font-medium" style={{ background: paused ? 'var(--nexus-accent)' : 'rgba(255,255,255,0.05)', color: paused ? '#070b18' : 'var(--nexus-text)' }}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={initParticles} className="flex-1 rounded-md py-1.5 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--nexus-text)' }}>Reset</button>
        </div>
        <Slider label="Flow Velocity" value={velocity} onChange={setVelocity} min={0.2} max={5} step={0.1} unit=" u" />
        <Slider label="Viscosity" value={viscosity} onChange={setViscosity} min={0} max={0.2} step={0.005} />
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--nexus-text-dim)' }}>
          <input type="checkbox" checked={colorMode} onChange={(e) => setColorMode(e.target.checked)} /> Velocity color map
        </label>
        <div className="border-t pt-2 text-[10px]" style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-faint)' }}>
          <p>Obstacles: {obstacles.length}</p>
          <p>Particles: {particlesRef.current.length}</p>
          <p className="mt-1">Blue = slow · Red = fast</p>
        </div>
        {obstacles.length > 1 && (
          <button onClick={() => setObstacles([{ x: 0.5, y: 0.5, r: 30 }])} className="w-full rounded-md py-1 text-xs" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--nexus-error)' }}>
            Clear obstacles
          </button>
        )}
      </div>
    </div>
  );
}
