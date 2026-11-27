import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BootScreen } from '@/components/BootScreen';
import { LoginScreen } from '@/components/LoginScreen';
import { Wallpaper } from '@/components/Wallpaper';
import { TopBar, AppLauncher } from '@/components/TopBar';
import { Dock } from '@/components/Dock';
import { Window } from '@/components/Window';
import { ContextMenu, openMenu, closeMenu } from '@/components/ContextMenu';
import { NotificationCenter, QuickSettings } from '@/components/Panels';
import { useWindows, usePreferences, useNotifications } from '@/system/hooks';
import { windowManager } from '@/system/WindowManager';
import { notificationManager } from '@/system/NotificationManager';
import { VirtualFS } from '@/system/VirtualFS';
import { eventBus } from '@/system/EventBus';
import { APP_LIST } from '@/system/AppRegistry';
import { PrefsContext } from '@/system/PrefsContext';
import type { AppId } from '@/system/types';
import { DesktopIcons } from '@/components/DesktopIcons';

type Phase = 'boot' | 'login' | 'desktop';

function NexusOS() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [user, setUser] = useState('Researcher');
  const windows = useWindows();
  const notifications = useNotifications();
  const [prefs, updatePrefs] = usePreferences();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  // seed filesystem on first desktop entry
  useEffect(() => {
    if (phase === 'desktop') {
      VirtualFS.seedDefaults();
    }
  }, [phase]);

  // keyboard shortcuts
  useEffect(() => {
    if (phase !== 'desktop') return;
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setLauncherOpen((o) => !o);
      } else if (ctrl && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        windowManager.open('terminal');
      } else if (ctrl && e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        windowManager.open('files');
      } else if (ctrl && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        windowManager.open('monitor');
      } else if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        windowManager.cycleNext();
      } else if (e.key === 'Escape') {
        setLauncherOpen(false);
        setNotifOpen(false);
        setQuickOpen(false);
        closeMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const handleLogin = (name: string) => {
    setUser(name);
    setPhase('desktop');
    notificationManager.add({
      app: 'control',
      title: 'Welcome to NEXUS OS',
      body: `Signed in as ${name}. Press Ctrl+K to search applications.`,
    });
  };

  const handleLogout = () => {
    setPhase('login');
    setNotifOpen(false);
    setQuickOpen(false);
  };

  const desktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Open Files', onClick: () => windowManager.open('files') },
        { label: 'Open Terminal', onClick: () => windowManager.open('terminal') },
        { label: 'Open Lab', onClick: () => windowManager.open('lab') },
        { label: 'Search Apps...', onClick: () => setLauncherOpen(true) },
        { separator: true },
        { label: 'System Settings', onClick: () => windowManager.open('control') },
        { label: 'System Monitor', onClick: () => windowManager.open('monitor') },
        { separator: true },
        { label: 'Change Wallpaper', onClick: () => windowManager.open('control') },
      ],
    });
  };

  if (phase === 'boot') {
    return <BootScreen onDone={() => setPhase('login')} />;
  }

  if (phase === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <PrefsContext.Provider value={{ prefs, updatePrefs }}>
      <div
        className="fixed inset-0 overflow-hidden"
        onContextMenu={desktopContextMenu}
        onClick={() => { closeMenu(); }}
      >
        <Wallpaper variant={prefs.wallpaper} accent={prefs.accent} />

        <TopBar
          prefs={prefs}
          updatePrefs={updatePrefs}
          onLauncher={() => setLauncherOpen(true)}
          onNotifications={() => { setNotifOpen((o) => !o); setQuickOpen(false); }}
          onQuickSettings={() => { setQuickOpen((o) => !o); setNotifOpen(false); }}
          user={user}
          onLogout={handleLogout}
        />

        <DesktopIcons prefs={prefs} />

        {/* Windows */}
        <AnimatePresence>
          {windows.map((win) => (
            <Window key={win.id} win={win} />
          ))}
        </AnimatePresence>

        <AppLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} />
        <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        <QuickSettings open={quickOpen} onClose={() => setQuickOpen(false)} prefs={prefs} updatePrefs={updatePrefs} />
        <ContextMenu />
        <Dock windows={windows} prefs={prefs} />
      </div>
    </PrefsContext.Provider>
  );
}

function App() {
  return <NexusOS />;
}

export default App;
