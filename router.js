import { useEffect, useState } from 'react';

// Tiny hash router: "#/daily?date=2026-09-22". Hash routing works on any static host and survives a refresh.
const read = () => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [id, query = ''] = raw.split('?');
  return { id: id || 'dashboard', params: Object.fromEntries(new URLSearchParams(query)) };
};

export function useRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export const go = (id, params) => {
  const q = params ? `?${new URLSearchParams(params)}` : '';
  window.location.hash = `#/${id}${q}`;
};
