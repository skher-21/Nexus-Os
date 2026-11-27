import { useEffect, useRef } from 'react';

export function Wallpaper({ variant, accent }: { variant: string; accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // base gradient
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.5, Math.max(w, h));
      const bg = variant === 'dawn'
        ? ['#1a1f3a', '#0b1226', '#070b18']
        : variant === 'nebula'
        ? ['#1a1040', '#0b0a2a', '#070b18']
        : variant === 'grid'
        ? ['#0b1226', '#070b18', '#050810']
        : variant === 'deep'
        ? ['#070b18', '#050810', '#02040a']
        : ['#0d1830', '#0b1226', '#070b18']; // aurora
      grad.addColorStop(0, bg[0]);
      grad.addColorStop(0.5, bg[1]);
      grad.addColorStop(1, bg[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // accent glow blobs
      if (variant === 'aurora' || variant === 'dawn' || variant === 'nebula') {
        const g2 = ctx.createRadialGradient(w * 0.2, h * 0.8, 0, w * 0.2, h * 0.8, w * 0.5);
        g2.addColorStop(0, hexA(accent, 0.12));
        g2.addColorStop(1, hexA(accent, 0));
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);
        const g3 = ctx.createRadialGradient(w * 0.85, h * 0.2, 0, w * 0.85, h * 0.2, w * 0.45);
        g3.addColorStop(0, hexA(variant === 'nebula' ? '#8b5cf6' : '#3b82f6', 0.1));
        g3.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, w, h);
      }

      // grid
      if (variant === 'grid' || variant === 'aurora') {
        ctx.strokeStyle = hexA(accent, 0.05);
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 48) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 48) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = hexA(accent, p.a);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [variant, accent]);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
