import { useState, useEffect } from 'react';
import { Orbit, Waves, Droplets, Save, Info } from 'lucide-react';
import type { WindowState, Experiment } from '@/system/types';
import { VirtualFS } from '@/system/VirtualFS';
import { eventBus } from '@/system/EventBus';
import { notificationManager } from '@/system/NotificationManager';
import { OrbitLab } from './OrbitLab';
import { WaveLab } from './WaveLab';
import { FluidLab } from './FluidLab';

type LabType = 'orbit' | 'wave' | 'fluid';

export function LabApp({ win }: { win: WindowState }) {
  const [lab, setLab] = useState<LabType>((win.props?.lab as LabType) ?? 'orbit');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (win.props?.lab) setLab(win.props.lab as LabType);
  }, [win.props]);

  const labs: { id: LabType; name: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; desc: string }[] = [
    { id: 'orbit', name: 'Orbit Lab', icon: Orbit, desc: 'Newtonian gravitational simulation' },
    { id: 'wave', name: 'Wave Lab', icon: Waves, desc: 'Wave interference patterns' },
    { id: 'fluid', name: 'Fluid Lab', icon: Droplets, desc: 'Fluid flow visualization' },
  ];

  const saveExperiment = async () => {
    setSaving(true);
    const exp: Experiment = {
      id: `exp-${Date.now()}`,
      lab,
      name: `${lab}-${new Date().toLocaleString()}`,
      description: `NEXUS Lab experiment — ${lab} simulation snapshot`,
      data: {
        timestamp: Date.now(),
        lab,
        note: 'Saved from NEXUS Lab. Open in NEXUS Files > Experiments.',
      },
      createdAt: Date.now(),
    };
    // find or create Experiments folder
    const root = await VirtualFS.list(null);
    let expFolder = root.find((f) => f.name === 'Experiments' && f.type === 'folder');
    if (!expFolder) {
      expFolder = await VirtualFS.create({ name: 'Experiments', type: 'folder', parentId: null });
    }
    const fileName = `${lab}-experiment-${Date.now()}.json`;
    await VirtualFS.create({
      name: fileName,
      type: 'file',
      parentId: expFolder.id,
      content: JSON.stringify(exp, null, 2),
      mimeType: 'application/json',
      meta: { experimentId: exp.id, lab },
    });
    eventBus.emit('fs:changed');
    eventBus.emit('experiment:saved', exp);
    notificationManager.add({
      app: 'lab',
      title: 'Experiment saved',
      body: `${lab} experiment saved to Experiments/${fileName}`,
    });
    setSaving(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1.5" style={{ borderColor: 'var(--nexus-border)' }}>
        <div className="flex items-center gap-1">
          {labs.map((l) => {
            const Icon = l.icon;
            return (
              <button
                key={l.id}
                onClick={() => setLab(l.id)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors"
                style={{
                  background: lab === l.id ? hexA('8b5cf6', 0.15) : 'transparent',
                  color: lab === l.id ? '#8b5cf6' : 'var(--nexus-text-dim)',
                }}
              >
                <Icon size={13} /> {l.name}
              </button>
            );
          })}
        </div>
        <button
          onClick={saveExperiment}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all"
          style={{ background: hexA('8b5cf6', 0.2), color: '#8b5cf6' }}
        >
          <Save size={13} /> {saving ? 'Saving...' : 'Save Experiment'}
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {lab === 'orbit' && <OrbitLab />}
        {lab === 'wave' && <WaveLab />}
        {lab === 'fluid' && <FluidLab />}
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-1 text-[10px]" style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-faint)' }}>
        <Info size={11} />
        {labs.find((l) => l.id === lab)?.desc} — saved experiments go to NEXUS Files / Experiments.
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
