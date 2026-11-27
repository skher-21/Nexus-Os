import { createContext, useContext } from 'react';
import type { Preferences } from './types';

export interface PrefsContextValue {
  prefs: Preferences;
  updatePrefs: (p: Partial<Preferences>) => void;
}

export const PrefsContext = createContext<PrefsContextValue>({
  prefs: {} as Preferences,
  updatePrefs: () => {},
});

export function usePrefs(): PrefsContextValue {
  return useContext(PrefsContext);
}
