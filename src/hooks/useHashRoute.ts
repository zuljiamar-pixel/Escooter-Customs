import { useCallback, useEffect, useState } from 'react';

export const ROUTES = [
  'dashboard',
  'display',
  'boot',
  'store',
  'layout',
  'rgb',
  'gallery',
  'sound',
  'info',
  'connect',
  'settings',
  'select',
] as const;

export type RouteId = (typeof ROUTES)[number];

const parse = (hash: string): RouteId => {
  const id = hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return (ROUTES as readonly string[]).includes(id) ? (id as RouteId) : 'dashboard';
};

export function useHashRoute(): [RouteId, (route: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(() => parse(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: RouteId) => {
    if (parse(window.location.hash) === next) return;
    window.location.hash = `/${next}`;
  }, []);

  return [route, navigate];
}
