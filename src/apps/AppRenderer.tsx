import type { WindowState } from '@/system/types';
import { usePrefs } from '@/system/PrefsContext';
import { FilesApp } from './Files/FilesApp';
import { LabApp } from './Lab/LabApp';
import { TerminalApp } from './Terminal/TerminalApp';
import { AIApp } from './AI/AIApp';
import { StudioApp } from './Studio/StudioApp';
import { MonitorApp } from './Monitor/MonitorApp';
import { WebApp } from './Web/WebApp';
import { ControlApp } from './Control/ControlApp';

export function AppRenderer({ win }: { win: WindowState }) {
  const { prefs, updatePrefs } = usePrefs();
  switch (win.appId) {
    case 'files':
      return <FilesApp win={win} />;
    case 'lab':
      return <LabApp win={win} />;
    case 'terminal':
      return <TerminalApp win={win} />;
    case 'ai':
      return <AIApp win={win} />;
    case 'studio':
      return <StudioApp win={win} />;
    case 'monitor':
      return <MonitorApp win={win} />;
    case 'web':
      return <WebApp win={win} />;
    case 'control':
      return <ControlApp win={win} prefs={prefs} updatePrefs={updatePrefs} />;
    default:
      return <div className="p-4 text-sm">Unknown application</div>;
  }
}
