// Which screen a location hash points at. Only the router's own route names count: names that
// every object inherits (#constructor, #toString, #__proto__, #hasOwnProperty ...) fall back to
// home instead of crashing or showing a blank screen.
export function routeName(hash, routes) {
  const raw = String(hash || '').replace(/^#\/?/, '').split(/[/?]/)[0];
  return Object.hasOwn(routes, raw) ? raw : 'home';
}

// The part after the route name (#play/letters -> "letters"), or "" (plain ids only). The screen that
// gets it still checks it against its own allowlist.
export function routeParam(hash) {
  const v = String(hash || '').replace(/^#\/?/, '').split('?')[0].split('/')[1] || '';
  return /^[a-z0-9-]{1,24}$/.test(v) ? v : '';
}
