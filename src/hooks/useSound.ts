import { useCallback } from 'react';
import { soundEngine, type SoundName } from '../lib/sound';
import { useStore } from '../store/AppStore';

/** Spielt optionale UI-Sounds ab – nur wenn sie in den Einstellungen aktiviert sind. */
export function useSound() {
  const { settings } = useStore();
  const { sounds, soundPack, volume } = settings;
  return useCallback(
    (name: SoundName, force = false) => {
      if (!sounds && !force) return;
      soundEngine.play(name, soundPack, volume);
    },
    [sounds, soundPack, volume],
  );
}
