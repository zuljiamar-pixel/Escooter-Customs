import { createContext, useContext } from 'react';
import type { RouteId } from './useHashRoute';

export interface NavState {
  route: RouteId;
  navigate: (route: RouteId) => void;
}

export const NavContext = createContext<NavState | null>(null);

export function useNav(): NavState {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside NavContext');
  return ctx;
}
