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

// The ids after #playground (#playground/<id>/<zone>). Character ids are camelCase (yellowDog,
// friendSilly), which routeParam's lower-case rule turns into "" (that was the n2 play-scene bug:
// every camelCase id fell back to the pick grid). Each part is a plain id or ""; the screen still
// checks both against its own allowlist.
export function routeIds(hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('?')[0].split('/').slice(1, 3);
  return [0, 1].map((i) => (/^[a-z][A-Za-z0-9]{0,23}$/.test(parts[i] || '') ? parts[i] : ''));
}
