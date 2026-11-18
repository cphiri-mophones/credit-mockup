import { useEffect, useState } from 'react';

export type Route = 'queue' | 'verify' | 'offer' | 'call' | 'decide' | 'activate' | 'details' | 'cash-device' | 'cash-activate' | 'cash-details' | 'admin';

const ROUTES: Route[] = ['queue', 'verify', 'offer', 'call', 'decide', 'activate', 'details', 'cash-device', 'cash-activate', 'cash-details', 'admin'];

export interface Location {
  route: Route;
  // Second hash segment, used for the details tab: #/details/crb
  sub: string;
}

function parse(hash: string): Location {
  const [name = '', sub = ''] = hash.replace(/^#\/?/, '').split('/');
  return { route: (ROUTES as string[]).includes(name) ? (name as Route) : 'queue', sub };
}

export function useLocation(): Location {
  const [location, setLocation] = useState<Location>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      const next = parse(window.location.hash);
      setLocation((prev) => {
        if (prev.route !== next.route) document.getElementById('moos-content')?.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return location;
}

export function navigate(route: Route, sub?: string) {
  window.location.hash = sub ? `/${route}/${sub}` : `/${route}`;
}

// Where each application view was last left, so the view switch returns there.
export const viewMemory: { flowStep: string | null; detailsTab: string; cashFlowStep: string | null; cashDetailsTab: string } = {
  flowStep: null,
  detailsTab: 'overview',
  cashFlowStep: null,
  cashDetailsTab: 'overview',
};
