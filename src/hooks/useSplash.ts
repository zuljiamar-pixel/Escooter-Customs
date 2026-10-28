import { createContext, useContext } from 'react';
import type { SplashAnimation } from '../store/types';

export const SplashContext = createContext<(animation: Exclude<SplashAnimation, 'none'>) => void>(() => undefined);

/** Spielt die Startanimation der App als Vorschau ab. */
export const useSplash = () => useContext(SplashContext);
