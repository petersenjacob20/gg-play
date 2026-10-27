// Ride Close-Up Scenes, the second pack (gg-pack-rides2): the service worker fills its cache at install, named by
// content hash, so it opens offline. ONE shared close-up template; each scene in SCENES2 is data: its park, the
// ride drawn round the rider (`set` behind, `car` carrying the pet), where the rider is at t (0 = start, 1 = end) and
// one word per pet. Tap the pet or the ride and it rides by itself; or drag it along. No timer, no score, nothing to lose.
import * as R from './rides.js';
import * as A from './rides-art.js';

export const RIDES2_CACHE = 'gg-pack-rides2-714012bf6d';
export const RIDES2_PACK = ['./js/rides2.js'];
const T = (t, a = {}, ...k) => [t, a, ...k.filter(Boolean)];
const G = (a, ...k) => T('g', a, ...k);
const TAU = Math.PI * 2;
const E = (cx, cy, rx, ry, fill, stroke, a = {}) => T('ellipse', { cx, cy, rx, ry, fill, stroke: stroke || 'none', 'stroke-width': stroke ? 2 : 0, ...a });
const P = (d, fill, stroke) => T('path', { d, fill, stroke: stroke || 'none', 'stroke-width': stroke ? 2 : 0 });
const L = (d, stroke, w = 2) => T('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round' });
// how each word poses the pet (keys the rides art reads); `on` = riding
const POSE = {
  open: { mouth: 'open' }, howl: { mouth: 'O', chinUp: true }, ears: { ears: 'out', mouth: 'open' }, back: { ears: 'back' }, calm: { half: true },
  snooze: { shut: true }, ball: { toy: 'ballBlue', toyAt: 'mouth' }, king: { chinUp: true }, paws: { pawsUp: true, mouth: 'open' },
};
// the scenes (rideables first); act: pet -> [word, pose]
export const SCENES2 = {
  // lazy ring (water park): the ring drifts down the current from the far end of the pool, turning slowly
  lazyRing: { park: 'water', T: 4, wet: true, ps: 0.6,
    at: (t) => [180 + Math.sin(t * TAU) * 70, 330 + t * 300, 1.1 + t * 0.45, Math.sin(t * TAU * 2) * 8],
    set: () => [A.pool(30, 280, 300, 420)],
    car: (d, k) => A.ring(d, '#4AA3DF', [G({ transform: 'translate(0 8)' }, ...k)]),
    act: { yellowDog: ['calmDrift', 'calm'], chocolateDog: ['snoozeFloat', 'snooze'], gingerDog: ['earsSail', 'ears'], blackDog: ['ballBob', 'ball'],
      puppy: ['splashPaws', 'paws'], kitty: ['kingFloat', 'king'], bunny: ['peekOut', 'open'], bunny2: ['peekOut', 'open'] } },
  // carousel (fair): the pet rides a bobbing horse once round the turning carousel
  carousel: { park: 'coaster', T: 4, ps: 0.55,
    at: (t) => [180 + Math.sin(t * TAU) * 100, 560 - Math.abs(Math.sin(t * TAU * 3)) * 18, 1.35 + Math.cos(t * TAU) * 0.15, 0],
    set: (d, t) => [G({ class: 'r-carousel' }, E(180, 640, 160, 30, '#E9C46A', '#B98F3A'), L('M180 640V300', '#D9B26F', 8),
      P('M20 330L180 250L340 330Z', '#E5484D', '#B8313A'), ...[0, 1, 2, 3].map((i) => P(`M${20 + i * 80} 330l40 -20l40 20q-40 14 -80 0z`, '#FFFFFF', '#E0C9C9')),
      ...[0, 1, 2, 3, 4].map((i) => L(`M${36 + i * 72 + Math.sin(t * TAU + i) * 10} 340V620`, '#E9D8A6', 3)))],
    car: (d, k) => G({}, L('M0 -150V40', '#E9D8A6', 3), E(0, -6, 40, 15, '#FFFFFF', '#C9B8A8'), P('M30 -12l18 -26l10 6l-12 26z', '#FFFFFF', '#C9B8A8'),
      L('M-26 6l-8 26M-12 8l-4 26M14 8l4 26M28 6l8 26', '#C9B8A8', 4), P('M-14 -20h28v12h-28z', '#E5484D'), G({ transform: 'translate(0 -14)' }, ...k)),
    act: { yellowDog: ['sitTall', 'calm'], chocolateDog: ['hugPole', 'back'], gingerDog: ['earsFly', 'ears'], blackDog: ['ballHold', 'ball'],
      puppy: ['waveHowl', 'howl'], kitty: ['kingWave', 'king'], bunny: ['bounceHop', 'open'], bunny2: ['bounceHop', 'open'] } },
  // bumper cars (fair): the pet steers a bumper car round the rink, bumping softly off the rail
  bumpers: { park: 'coaster', T: 4, ps: 0.55,
    at: (t) => [180 + Math.sin(t * TAU * 1.5) * 72, 570 + Math.sin(t * TAU) * 70, 1.3 + Math.sin(t * TAU) * 0.1, Math.sin(t * TAU * 3) * 10],
    set: () => [G({ class: 'r-rink' }, T('rect', { x: 20, y: 400, width: 320, height: 330, rx: 30, fill: '#7C8A99', stroke: '#F2C230', 'stroke-width': 10 }),
      L('M20 420V300M340 420V300M20 300H340', '#9AA7B4', 4), T('rect', { x: 150, y: 520, width: 60, height: 60, rx: 30, fill: '#5C6B7A' }))],
    car: (d, k) => G({}, L('M0 -20V-150', '#9AA7B4', 2), G({ transform: 'translate(0 -6)' }, ...k), P('M-50 -10q0 -14 14 -14h72q14 0 14 14v18q0 14 -14 14h-72q-14 0 -14 -14z', '#3D7BE0', '#2A5BAF'),
      E(0, 24, 54, 6, '#2A2F36')),
    act: { yellowDog: ['gentleNudge', 'calm'], chocolateDog: ['bumpGiggle', 'open'], gingerDog: ['spinOut', 'ears'], blackDog: ['ballBump', 'ball'],
      puppy: ['honkHowl', 'howl'], kitty: ['kingSteer', 'king'], bunny: ['hopBump', 'paws'], bunny2: ['hopBump', 'paws'] } },
  // balloon tower (fair): the pet's basket rises up the tower, turning gently, and floats back down
  balloonTower: { park: 'coaster', T: 5, ps: 0.55,
    at: (t) => { const u = Math.sin(t * Math.PI); return [180 + Math.sin(t * TAU * 2) * 30, 690 - u * 330, 1.35 - u * 0.3, 0]; },
    set: () => [G({ class: 'r-tower' }, L('M180 720V230', '#9AA7B4', 14), E(180, 222, 40, 40, '#E5484D', '#B8313A'), E(180, 720, 60, 10, '#7C8A99'))],
    car: (d, k) => G({}, L('M-30 -10l-10 -110M30 -10l10 -110', '#8A6A3A', 2), E(0, -130, 44, 24, '#F2C230', '#C99A1E'),
      G({ transform: 'translate(0 0)' }, ...k), P('M-34 -16h68l-6 34h-56z', '#C98B4E', '#8A5A2A')),
    act: { yellowDog: ['lookDown', 'calm'], chocolateDog: ['eyesShut', 'snooze'], gingerDog: ['earsUp', 'ears'], blackDog: ['ballUp', 'ball'],
      puppy: ['skyHowl', 'howl'], kitty: ['kingView', 'king'], bunny: ['pawsUp', 'paws'], bunny2: ['pawsUp', 'paws'] } },
  // kiddie train (fair): the pet rides the little train along its track, under the bunting, and stops by the flags
  kiddieTrain: { park: 'coaster', T: 4, ps: 0.55,
    at: (t) => [80 + t * 200, 640 - Math.abs(Math.sin(t * TAU * 4)) * 4, 1.45, 0],
    set: () => [G({ class: 'r-track' }, L('M0 668H360M0 682H360', '#8A6A3A', 4), L(Array.from({ length: 13 }, (_, i) => `M${i * 30} 662v26`).join(''), '#B98F5A', 5))],
    car: (d, k) => G({}, G({ transform: 'translate(0 -6)' }, ...k), P('M-50 -20h100v36h-100z', '#4FB35A', '#2F7D3B'), L('M-50 -20h100', '#F2C230', 5),
      E(-30, 22, 12, 12, '#2A2F36', '#5C6B7A'), E(30, 22, 12, 12, '#2A2F36', '#5C6B7A')),
    act: { yellowDog: ['waveBye', 'paws'], chocolateDog: ['napRide', 'snooze'], gingerDog: ['earsWind', 'ears'], blackDog: ['ballSeat', 'ball'],
      puppy: ['tootHowl', 'howl'], kitty: ['kingConductor', 'king'], bunny: ['peekWindow', 'open'], bunny2: ['peekWindow', 'open'] } },
  // ferris wheel (fair): the pet's gondola goes once round the big wheel, over the top and back down
  ferris: { park: 'coaster', T: 6, ps: 0.5,
    at: (t) => { const a = Math.PI / 2 + t * TAU; return [180 + Math.cos(a) * 115, 440 + Math.sin(a) * 115, 1.15, 0]; },
    set: (d, t) => [G({ class: 'r-wheel-big' }, L('M180 440L110 720M180 440L250 720', '#9AA7B4', 8), E(180, 440, 115, 115, 'none', '#E5484D', { 'stroke-width': 6 }),
      L(Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 2 + t * TAU + (i * TAU) / 8; return `M180 440L${(180 + Math.cos(a) * 115).toFixed(1)} ${(440 + Math.sin(a) * 115).toFixed(1)}`; }).join(''), '#F2C230', 3),
      E(180, 440, 12, 12, '#F2C230', '#C99A1E'))],
    car: (d, k) => G({}, L('M0 -150V-120', '#9AA7B4', 3), G({ transform: 'translate(0 -8)' }, ...k), P('M-40 -20h80q0 40 -40 40q-40 0 -40 -40z', '#3D7BE0', '#2A5BAF')),
    act: { yellowDog: ['viewCalm', 'calm'], chocolateDog: ['hideEyes', 'snooze'], gingerDog: ['earsBreeze', 'ears'], blackDog: ['ballHug', 'ball'],
      puppy: ['topHowl', 'howl'], kitty: ['kingTop', 'king'], bunny: ['swingHop', 'paws'], bunny2: ['swingHop', 'paws'] } },
  // sandbox (park): the pet digs in place, sand flying, a shovel beside; she pops up with what she found
  sandbox: { park: 'park', T: 2.4, ps: 0.7,
    at: (t) => [180, 660 - Math.abs(Math.sin(t * TAU * 3)) * 8, 1.3, 0],
    set: () => [G({ class: 'r-sandbox' }, T('rect', { x: 50, y: 606, width: 260, height: 108, rx: 14, fill: '#C98B4E', stroke: '#8A5A2A', 'stroke-width': 6 }),
      T('rect', { x: 70, y: 618, width: 220, height: 78, rx: 10, fill: '#F1D9A0', stroke: '#D9BE85', 'stroke-width': 3 }))],
    car: (d, k, t) => G({}, ...k, G({ class: 'r-sand-fly', opacity: Math.abs(Math.sin(t * TAU * 3)).toFixed(2) },
      E(-40, -14, 6, 5, '#E8C783'), E(-26, -30, 5, 4, '#E8C783'), E(-54, -28, 4, 4, '#E8C783')), P('M34 -6l22 -34l9 5l-22 35z', '#E5484D', '#B8313A')),
    act: { yellowDog: ['calmDig', 'calm'], chocolateDog: ['napDig', 'snooze'], gingerDog: ['earsFling', 'ears'], blackDog: ['ballBury', 'ball'],
      puppy: ['digHowl', 'howl'], kitty: ['kingDig', 'king'], bunny: ['pawsFling', 'paws'], bunny2: ['pawsFling', 'paws'] } },
  // climbing dome (park): the pet climbs the rainbow dome from one side, over the top, and down the other
  climber: { park: 'park', T: 3, ps: 0.72,
    at: (t) => { const a = Math.PI - t * TAU / 2; return [180 + Math.cos(a) * 100, 662 - Math.sin(a) * 170, 1.0 + Math.sin(a) * 0.15, 0]; },
    set: () => [G({ class: 'r-dome' },
      ...[[120, 195, '#5DBB63'], [100, 170, '#F2C230'], [75, 130, '#E5484D']].map(([rx, h, c]) => L(Array.from({ length: 21 }, (_, i) => {
        const a = Math.PI - (i / 20) * TAU / 2; return `${i ? 'L' : 'M'}${(180 + Math.cos(a) * rx).toFixed(1)} ${(662 - Math.sin(a) * h).toFixed(1)}`;
      }).join(''), c, 8)),
      L('M180 662V492', '#4AA3DF', 6), E(180, 664, 130, 14, '#C98B4E', '#8A5A2A'))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['steadyClimb', 'calm'], chocolateDog: ['holdTight', 'back'], gingerDog: ['earsOver', 'ears'], blackDog: ['ballGrip', 'ball'],
      puppy: ['climbHowl', 'howl'], kitty: ['kingClimb', 'king'], bunny: ['pawsOver', 'paws'], bunny2: ['pawsOver', 'paws'] } },
  // seesaw (park): her end teeters up and down a few times, the far end answering opposite through the pivot
  seesaw: { park: 'park', T: 2.7, ps: 0.68,
    at: (t) => { const a = 16 * Math.sin(t * TAU * 3), rad = a * Math.PI / 180; return [180 + 110 * Math.cos(rad), 660 + 110 * Math.sin(rad), 1.3, a]; },
    set: (d, t) => { const a = 16 * Math.sin(t * TAU * 3), rad = a * Math.PI / 180, fx = 180 - 110 * Math.cos(rad), fy = 660 - 110 * Math.sin(rad);
      return [G({ class: 'r-seesaw' }, P('M150 712L180 655L210 712Z', '#8A6A3A', '#5C4420'), L(`M${fx.toFixed(1)} ${fy.toFixed(1)}L180 660`, '#C98B4E', 16), E(180, 716, 130, 14, '#5DBB63'))]; },
    car: (d, k) => G({}, P('M-95 -4h110v16h-110z', '#C98B4E', '#8A5A2A'), G({ transform: 'translate(0 -6)' }, ...k)),
    act: { yellowDog: ['steadyRock', 'calm'], chocolateDog: ['napTip', 'snooze'], gingerDog: ['earsBounce', 'ears'], blackDog: ['ballBounce', 'ball'],
      puppy: ['tipHowl', 'howl'], kitty: ['kingTip', 'king'], bunny: ['pawsBounce', 'paws'], bunny2: ['pawsBounce', 'paws'] } },
  // the big tree (park): she peeks out from one side of the trunk, ducks back behind it, then peeks out the other side
  tree: { park: 'park', T: 3, ps: 0.72,
    at: (t) => { const u = Math.sin(t * TAU * 2); return [180 + u * 85, 660, 1.25 - Math.abs(u) * 0.25, 0]; },
    set: (d) => [A.tree(d, 180, 662, 2)],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmPeek', 'calm'], chocolateDog: ['hugTrunk', 'back'], gingerDog: ['earsPeek', 'ears'], blackDog: ['ballPeek', 'ball'],
      puppy: ['peekHowl', 'howl'], kitty: ['kingPeek', 'king'], bunny: ['pawsPeek', 'paws'], bunny2: ['pawsPeek', 'paws'] } },
  // flower bed (park): she dips down and noses a flower, pollen puffing up, then rises; twice over the ride
  flowers: { park: 'park', T: 2.2, ps: 0.72,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 630 + u * 30, 1.3, 0]; },
    set: () => [G({ class: 'r-flowerbed' }, E(180, 672, 150, 22, '#8FD07A', '#6CB25A'),
      A.flower(110, 662), A.flower(150, 668, '#4AA3DF'), A.flower(210, 668, '#4AA3DF'), A.flower(250, 662))],
    car: (d, k, t) => G({}, ...k, G({ class: 'r-pollen', opacity: Math.abs(Math.sin(t * TAU * 2)).toFixed(2) },
      E(-30, -18, 4, 3, '#FFD54A'), E(-18, -32, 3, 3, '#FFD54A'), E(-40, -28, 3, 3, '#FFD54A'))),
    act: { yellowDog: ['calmSniff', 'calm'], chocolateDog: ['napSniff', 'snooze'], gingerDog: ['earsDroop', 'ears'], blackDog: ['ballSniff', 'ball'],
      puppy: ['sniffHowl', 'howl'], kitty: ['kingSniff', 'king'], bunny: ['pawsSniff', 'paws'], bunny2: ['pawsSniff', 'paws'] } },
  // the little pond (park): she wades in and splashes in place, a ring of ripples; twice over the ride
  pond: { park: 'park', T: 2.4, wet: true, ps: 0.72,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 654 - u * 8, 1.3, 0]; },
    set: () => [G({ class: 'r-pond' }, E(180, 672, 150, 44, '#4AA3DF', '#2F7FB5'), E(180, 668, 130, 34, '#5AB8F0', null, { opacity: 0.6 }),
      L('M110 662q20 -8 40 0q20 8 40 0M150 680q20 -8 40 0q20 8 40 0', '#FFFFFF', 1.5, { opacity: 0.7 }))],
    car: (d, k, t) => G({}, ...k, G({ class: 'r-pond-splash', opacity: Math.abs(Math.sin(t * TAU * 2)).toFixed(2) }, A.splash(0.8))),
    act: { yellowDog: ['calmWade', 'calm'], chocolateDog: ['napWade', 'snooze'], gingerDog: ['earsFlick', 'ears'], blackDog: ['ballSplash', 'ball'],
      puppy: ['splashHowl', 'howl'], kitty: ['kingWade', 'king'], bunny: ['pawsSplash', 'paws'], bunny2: ['pawsSplash', 'paws'] } },
  // the snack stand (park): she bobs up on her toes to nibble a treat off the counter, crumbs puffing; twice over the ride
  snacks: { park: 'park', T: 2.2, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 3)); return [180, 654 - u * 6, 1.3, 0]; },
    set: () => [G({ class: 'r-standcart' }, T('rect', { x: 70, y: 600, width: 220, height: 70, rx: 10, fill: '#C98B4E', stroke: '#8A5A2A', 'stroke-width': 6 }),
      P('M60 600q120 -46 240 0z', '#E5484D', '#B8313A'), L('M80 600q100 -34 200 0', '#FFFFFF', 4, { opacity: 0.4 }),
      P('M150 596l10 -34h20l10 34z', '#F2C230', '#C99A1E'), ...[0, 1, 2, 3, 4].map((i) => E(160 + i * 8, 560, 4, 4, '#FFF7E0', '#E8C783', { 'stroke-width': 1 })))],
    car: (d, k, t) => G({}, ...k, G({ class: 'r-crumbs', opacity: Math.abs(Math.sin(t * TAU * 3)).toFixed(2) },
      E(-36, -18, 4, 3, '#FFF7E0'), E(-22, -32, 3, 3, '#FFF7E0'), E(-48, -28, 3, 3, '#FFF7E0'))),
    act: { yellowDog: ['calmMunch', 'calm'], chocolateDog: ['napMunch', 'snooze'], gingerDog: ['earsPerk', 'ears'], blackDog: ['ballCrunch', 'ball'],
      puppy: ['munchHowl', 'howl'], kitty: ['kingMunch', 'king'], bunny: ['pawsMunch', 'paws'], bunny2: ['pawsMunch', 'paws'] } },
  // the ticket booth (coaster): she bounces up on her toes to see over the counter and wave at the window, a ticket
  // popping up out of the slot; twice over the ride
  ticketBooth: { park: 'coaster', T: 2.2, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 654 - u * 10, 1.3, 0]; },
    set: (d, t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [G({ class: 'r-ticketbooth' },
      T('rect', { x: 70, y: 580, width: 220, height: 90, rx: 10, fill: '#C98B4E', stroke: '#8A5A2A', 'stroke-width': 6 }),
      T('rect', { x: 130, y: 600, width: 100, height: 48, rx: 8, fill: '#BEE3F5', stroke: '#4AA3DF', 'stroke-width': 4 }),
      P('M60 580q120 -40 240 0z', '#4AA3DF', '#2A5BAF'), L('M80 580q100 -28 200 0', '#FFFFFF', 4, { opacity: 0.4 })),
      G({ class: 'r-ticket', opacity: u.toFixed(2) }, T('rect', { x: 166, y: 598 - u * 16, width: 28, height: 14, rx: 2, fill: '#FFF7E0', stroke: '#E8C783', 'stroke-width': 1.5 }))]; },
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmWave', 'calm'], chocolateDog: ['shyPeek', 'back'], gingerDog: ['earsWave', 'ears'], blackDog: ['ballWave', 'ball'],
      puppy: ['waveHowl', 'howl'], kitty: ['kingTicket', 'king'], bunny: ['pawsWave', 'paws'], bunny2: ['pawsWave', 'paws'] } },
  // the balloon arch (coaster): she bounces up on her toes and waves at the balloons bobbing over the arch; twice over the ride
  balloonArch: { park: 'coaster', T: 2.4, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 654 - u * 10, 1.3, 0]; },
    set: (d, t) => [G({ class: 'r-balloonarch' }, L('M60 700Q60 560 180 560Q300 560 300 700', '#C98B4E', 10),
      ...[0, 1, 2, 3, 4].map((i) => { const bx = 72 + i * 54, by = 560 + Math.sin(t * TAU * 2 + i) * 6;
        return G({}, L(`M${bx} ${by + 26}V700`, '#8A6A3A', 2), E(bx, by, 22, 26, ['#E5484D', '#F2C230', '#4AA3DF', '#5DBB63', '#E5484D'][i], ['#B8313A', '#C99A1E', '#2A5BAF', '#2F7D3B', '#B8313A'][i])); }))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmPeer', 'calm'], chocolateDog: ['shyLook', 'back'], gingerDog: ['earsPop', 'ears'], blackDog: ['ballHold', 'ball'],
      puppy: ['archHowl', 'howl'], kitty: ['kingArch', 'king'], bunny: ['pawsPop', 'paws'], bunny2: ['pawsPop', 'paws'] } },
  // the fountain (coaster): she stands at the basin's edge and the middle jet bobs up and splashes her; giggles twice
  fountain: { park: 'coaster', T: 2.4, wet: true, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 660 - u * 8, 1.3, 0]; },
    set: (d, t) => { const j = 40 + Math.abs(Math.sin(t * TAU * 2)) * 50;
      return [G({ class: 'r-fountain' }, E(180, 620, 150, 30, '#9AA7B4', '#7C8A99'), E(180, 616, 130, 20, '#7FC8F0', '#4AA3DF'),
        T('rect', { x: 170, y: 520, width: 20, height: 96, rx: 6, fill: '#B8C3CE', stroke: '#7C8A99', 'stroke-width': 2 }),
        L(`M180 520V${520 - j}`, '#BFE6FA', 8), ...[-1, 1].map((s) => L(`M180 ${520 - j}q${s * 40} -20 ${s * 70} ${j + 70}`, '#BFE6FA', 4)))]; },
    car: (d, k, t) => G({}, ...k, G({ class: 'r-drops', opacity: Math.abs(Math.sin(t * TAU * 2)).toFixed(2) },
      E(-30, -60, 4, 6, '#BFE6FA'), E(10, -70, 4, 6, '#BFE6FA'), E(36, -56, 4, 6, '#BFE6FA'))),
    act: { yellowDog: ['calmSplash', 'calm'], chocolateDog: ['shySplash', 'back'], gingerDog: ['earsDrip', 'ears'], blackDog: ['ballSplash', 'ball'],
      puppy: ['splashHowl', 'howl'], kitty: ['kingSplash', 'king'], bunny: ['pawsSplash', 'paws'], bunny2: ['pawsSplash', 'paws'] } },
  // the striped tents (coaster): she ducks behind the tent flap and pops out again, peekaboo, twice over the ride
  tents: { park: 'coaster', T: 2.4, ps: 0.7,
    at: (t) => { const u = Math.max(0, Math.sin(t * TAU * 2)); return [180 + u * 40, 664 - u * 4, 1.3, 0]; },
    set: () => [G({ class: 'r-tents' }, P('M40 690L130 540L220 690Z', '#F2C230', '#C99A1E'), P('M160 690L250 560L340 690Z', '#4AA3DF', '#2A5BAF'),
      ...[0, 1, 2].map((i) => L(`M${100 + i * 30} ${590 + i * 0}L${70 + i * 30} 690`, '#FFFFFF', 4)), L('M130 540V520M250 560V540', '#8A6A3A', 3),
      P('M130 520l16 6l-16 6z', '#E5484D'), P('M250 540l16 6l-16 6z', '#E5484D'), E(190, 694, 160, 10, '#5DBB63'))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmPeek', 'calm'], chocolateDog: ['shyHide', 'back'], gingerDog: ['earsPeek', 'ears'], blackDog: ['ballPeek', 'ball'],
      puppy: ['peekHowl', 'howl'], kitty: ['kingPeek', 'king'], bunny: ['pawsPeek', 'open'], bunny2: ['pawsPeek', 'open'] } },
  // the far hills (coaster): she sits on a grassy rise and waves at the hills and the little windmill turning on top
  hills: { park: 'coaster', T: 2.6, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 650 - u * 6, 1.3, 0]; },
    set: (d, t) => [G({ class: 'r-hills' }, P('M0 640Q90 520 180 600Q270 500 360 620V720H0Z', '#8FCB7A', '#5DBB63'), P('M0 690Q120 630 240 680Q300 660 360 690V720H0Z', '#6FB35F'),
      L('M290 560V510', '#FFFFFF', 4), L(Array.from({ length: 4 }, (_, i) => { const a = t * TAU + (i * TAU) / 4; return `M290 510l${(Math.cos(a) * 22).toFixed(1)} ${(Math.sin(a) * 22).toFixed(1)}`; }).join(''), '#E5484D', 4))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmView', 'calm'], chocolateDog: ['snoozeHill', 'snooze'], gingerDog: ['earsBreeze', 'ears'], blackDog: ['ballRoll', 'ball'],
      puppy: ['hillHowl', 'howl'], kitty: ['kingHill', 'king'], bunny: ['pawsWave', 'paws'], bunny2: ['pawsWave', 'paws'] } },
  // the target game (coaster): she tosses a soft bean bag at the round target and it wobbles when it lands; twice
  target: { park: 'coaster', T: 2.4, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [120, 662 - u * 6, 1.3, 0]; },
    set: (d, t) => { const r = Math.sin(t * TAU * 4) * 3;
      return [G({ class: 'r-target', transform: `rotate(${r.toFixed(1)} 270 600)` }, L('M270 640V700', '#8A6A3A', 8),
        ...[[60, '#E5484D'], [44, '#FFFFFF'], [28, '#E5484D'], [12, '#FFFFFF']].map(([q, c]) => E(270, 580, q, q, c, '#B8313A'))),
        E(270 - (1 - (t * 2) % 1) * 120, 580 - Math.sin(((t * 2) % 1) * Math.PI) * 60, 8, 7, '#F2C230', '#C99A1E')]; },
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmToss', 'calm'], chocolateDog: ['shyToss', 'back'], gingerDog: ['earsToss', 'ears'], blackDog: ['ballToss', 'ball'],
      puppy: ['tossHowl', 'howl'], kitty: ['kingToss', 'king'], bunny: ['pawsToss', 'paws'], bunny2: ['pawsToss', 'paws'] } },
  // the fair snack stand (coaster): popcorn pops out of the striped tub while she munches; twice over the ride
  fairSnacks: { park: 'coaster', T: 2.2, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 3)); return [180, 654 - u * 6, 1.3, 0]; },
    set: (d, t) => [G({ class: 'r-popcorn' }, T('rect', { x: 80, y: 600, width: 200, height: 70, rx: 10, fill: '#F2C230', stroke: '#C99A1E', 'stroke-width': 6 }),
      P('M70 600q110 -40 220 0z', '#4AA3DF', '#2A5BAF'), P('M250 596l8 -40h30l8 40z', '#FFFFFF', '#E5484D'), L('M262 560l4 36M278 560l-2 36', '#E5484D', 4),
      ...[0, 1, 2, 3].map((i) => E(258 + i * 9, 552 - Math.abs(Math.sin(t * TAU * 3 + i)) * 14, 6, 5, '#FFF7E0', '#E8C783', { 'stroke-width': 1 })))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmMunch', 'calm'], chocolateDog: ['napMunch', 'snooze'], gingerDog: ['earsPop', 'ears'], blackDog: ['ballCrunch', 'ball'],
      puppy: ['popHowl', 'howl'], kitty: ['kingMunch', 'king'], bunny: ['pawsMunch', 'paws'], bunny2: ['pawsMunch', 'paws'] } },
  // the bench (coaster): she sits on the bench and swings her feet, a balloon tied to the arm bobbing; a rest
  bench: { park: 'coaster', T: 2.6, ps: 0.7,
    at: (t) => { const u = Math.sin(t * TAU * 2); return [170, 610 + u * 3, 1.25, u * 2]; },
    set: (d, t) => [G({ class: 'r-bench' }, ...[0, 1, 2].map((i) => T('rect', { x: 60, y: 560 + i * 18, width: 240, height: 12, rx: 4, fill: '#C98B4E', stroke: '#8A5A2A', 'stroke-width': 2 })),
      T('rect', { x: 60, y: 624, width: 240, height: 14, rx: 4, fill: '#C98B4E', stroke: '#8A5A2A', 'stroke-width': 2 }), L('M80 638V700M280 638V700', '#5C6B7A', 8),
      L(`M296 624Q${300 + Math.sin(t * TAU) * 8} 560 300 520`, '#8A6A3A', 2), E(300 + Math.sin(t * TAU) * 6, 500, 20, 24, '#B9A3F0', '#8A73C9'))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmSit', 'calm'], chocolateDog: ['napBench', 'snooze'], gingerDog: ['earsSit', 'ears'], blackDog: ['ballSit', 'ball'],
      puppy: ['benchHowl', 'howl'], kitty: ['kingThrone', 'king'], bunny: ['pawsSwing', 'paws'], bunny2: ['pawsSwing', 'paws'] } },
  // the fair flower bed (coaster): she sniffs along the bright tulips, a bee looping over them; twice
  fairFlowers: { park: 'coaster', T: 2.2, ps: 0.72,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 660 - u * 6, 1.3, 0]; },
    set: (d, t) => [G({ class: 'r-tulips' }, E(180, 690, 160, 22, '#8A6A3A', '#5C4420'),
      ...[0, 1, 2, 3, 4, 5].map((i) => { const x = 50 + i * 52, c = ['#E5484D', '#F2C230', '#B9A3F0', '#FF9EBB', '#E5484D', '#F2C230'][i];
        return G({}, L(`M${x} 690V630`, '#2F7D3B', 4), P(`M${x - 12} 630q0 -26 12 -30q12 4 12 30q-12 8 -24 0z`, c)); }),
      E(180 + Math.cos(t * TAU * 2) * 100, 560 + Math.sin(t * TAU * 4) * 20, 7, 5, '#F2C230', '#2A2F36'))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmSniff', 'calm'], chocolateDog: ['shySniff', 'back'], gingerDog: ['earsSniff', 'ears'], blackDog: ['ballSniff', 'ball'],
      puppy: ['sniffHowl', 'howl'], kitty: ['kingSniff', 'king'], bunny: ['pawsSniff', 'paws'], bunny2: ['pawsSniff', 'paws'] } },
  // the tipping cups (water park): the top cup fills, tips and pours over her; she dries off; twice
  dumpCups: { park: 'water', T: 2.4, wet: true, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [180, 664 - u * 6, 1.3, 0]; },
    set: (d, t) => { const a = Math.max(0, Math.sin(t * TAU * 2)) * 70;
      return [G({ class: 'r-cups' }, L('M90 700V430M270 700V430M90 430H270', '#4AA3DF', 10), E(180, 700, 140, 12, '#7FC8F0'),
        G({ transform: `rotate(${a.toFixed(1)} 180 450)` }, P('M150 450h60l-8 50h-44z', '#F2C230', '#C99A1E')),
        a > 40 && L('M200 480Q196 540 186 590', '#BFE6FA', 10))]; },
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmShower', 'calm'], chocolateDog: ['shyShower', 'back'], gingerDog: ['earsShower', 'ears'], blackDog: ['ballShower', 'ball'],
      puppy: ['showerHowl', 'howl'], kitty: ['kingShower', 'king'], bunny: ['pawsShower', 'paws'], bunny2: ['pawsShower', 'paws'] } },
  // the beach umbrellas (water park): she lies in the shade on a striped towel, the umbrella's fringe swaying; a rest
  umbrellas: { park: 'water', T: 2.6, ps: 0.7,
    at: (t) => { const u = Math.sin(t * TAU * 2); return [180, 662 + u * 2, 1.25, 0]; },
    set: (d, t) => [G({ class: 'r-umbrella' }, L('M180 690V470', '#8A6A3A', 6), P('M60 480Q180 380 300 480Z', '#E5484D', '#B8313A'), P('M140 480Q180 400 220 480Z', '#FFFFFF'),
      L(Array.from({ length: 9 }, (_, i) => `M${70 + i * 28} 480l${(Math.sin(t * TAU * 2 + i) * 3).toFixed(1)} 10`).join(''), '#F2C230', 3),
      T('rect', { x: 90, y: 660, width: 180, height: 40, rx: 6, fill: '#4AA3DF' }), L('M90 674H270M90 688H270', '#FFFFFF', 4))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmShade', 'calm'], chocolateDog: ['napShade', 'snooze'], gingerDog: ['earsShade', 'ears'], blackDog: ['ballShade', 'ball'],
      puppy: ['shadeHowl', 'howl'], kitty: ['kingShade', 'king'], bunny: ['pawsShade', 'paws'], bunny2: ['pawsShade', 'paws'] } },
  // the life rings (water park): she spins a red-and-white ring on the hook rack and it twirls; twice
  lifeRings: { park: 'water', T: 2.4, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [130, 662 - u * 6, 1.3, 0]; },
    set: (d, t) => { const s = Math.cos(t * TAU * 2);
      return [G({ class: 'r-rings' }, L('M260 700V470M230 480H290', '#8A6A3A', 8),
        E(260, 560, Math.max(4, Math.abs(s) * 40), 40, 'none', '#E5484D', { 'stroke-width': 14 }), E(260, 560, Math.max(2, Math.abs(s) * 40), 40, 'none', '#FFFFFF', { 'stroke-width': 14, 'stroke-dasharray': '20 30' }))]; },
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmSpin', 'calm'], chocolateDog: ['shySpin', 'back'], gingerDog: ['earsSpin', 'ears'], blackDog: ['ballSpin', 'ball'],
      puppy: ['ringHowl', 'howl'], kitty: ['kingRing', 'king'], bunny: ['pawsSpin', 'paws'], bunny2: ['pawsSpin', 'paws'] } },
  // the towels (water park): she rolls up in a fluffy towel, wiggles dry and peeks out; twice
  towels: { park: 'water', T: 2.4, ps: 0.7,
    at: (t) => { const u = Math.sin(t * TAU * 3); return [180, 660 - Math.abs(u) * 4, 1.3, u * 4]; },
    set: () => [G({ class: 'r-towels' }, L('M50 520H310', '#8A6A3A', 6), L('M60 520V700M300 520V700', '#8A6A3A', 6),
      ...[['#E5484D', 70], ['#F2C230', 140], ['#4AA3DF', 210]].map(([c, x]) => T('rect', { x, y: 522, width: 60, height: 80, rx: 4, fill: c })),
      T('rect', { x: 100, y: 670, width: 160, height: 34, rx: 8, fill: '#B9A3F0' }))],
    car: (d, k) => G({}, ...k, P('M-40 10q40 20 80 0v20q-40 16 -80 0z', '#B9A3F0', '#8A73C9')),
    act: { yellowDog: ['calmDry', 'calm'], chocolateDog: ['snuggleDry', 'snooze'], gingerDog: ['earsDry', 'ears'], blackDog: ['ballDry', 'ball'],
      puppy: ['dryHowl', 'howl'], kitty: ['kingRobe', 'king'], bunny: ['pawsDry', 'open'], bunny2: ['pawsDry', 'open'] } },
  // the cooler (water park): the lid pops up and she pulls out a cold watermelon slice and munches; twice
  cooler: { park: 'water', T: 2.4, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 2)); return [150, 660 - u * 6, 1.3, 0]; },
    set: (d, t) => { const a = Math.max(0, Math.sin(t * TAU * 2)) * -40;
      return [G({ class: 'r-cooler' }, T('rect', { x: 210, y: 610, width: 120, height: 80, rx: 10, fill: '#4AA3DF', stroke: '#2A5BAF', 'stroke-width': 4 }),
        T('rect', { x: 210, y: 660, width: 120, height: 30, rx: 8, fill: '#FFFFFF' }),
        G({ transform: `rotate(${a.toFixed(1)} 210 610)` }, T('rect', { x: 206, y: 596, width: 128, height: 16, rx: 6, fill: '#FFFFFF', stroke: '#C9D6E2', 'stroke-width': 2 })),
        P('M240 600a30 30 0 0 0 60 0z', '#E5484D', '#2F7D3B'))]; },
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmMelon', 'calm'], chocolateDog: ['napMelon', 'snooze'], gingerDog: ['earsMelon', 'ears'], blackDog: ['ballMelon', 'ball'],
      puppy: ['melonHowl', 'howl'], kitty: ['kingMelon', 'king'], bunny: ['pawsMelon', 'paws'], bunny2: ['pawsMelon', 'paws'] } },
  // the pool snack hut (water park): she licks a fruit pop under the hut's palm-leaf roof, drips sparkling; twice
  poolSnacks: { park: 'water', T: 2.2, ps: 0.7,
    at: (t) => { const u = Math.abs(Math.sin(t * TAU * 3)); return [180, 656 - u * 6, 1.3, 0]; },
    set: () => [G({ class: 'r-hut' }, T('rect', { x: 80, y: 600, width: 200, height: 72, rx: 8, fill: '#E9D8A6', stroke: '#B98F5A', 'stroke-width': 5 }),
      P('M60 604L180 540L300 604Z', '#5DBB63', '#2F7D3B'), L('M80 604l20 14M120 604l20 14M160 604l20 14M200 604l20 14M240 604l20 14', '#2F7D3B', 3))],
    car: (d, k, t) => G({}, ...k, P('M30 -40h14v26h-14z', '#FF9EBB', '#E5484D'), L('M37 -14v14', '#C98B4E', 3),
      E(37, 6 + ((t * 3) % 1) * 20, 2, 3, '#FF9EBB')),
    act: { yellowDog: ['calmLick', 'calm'], chocolateDog: ['napLick', 'snooze'], gingerDog: ['earsLick', 'ears'], blackDog: ['ballLick', 'ball'],
      puppy: ['lickHowl', 'howl'], kitty: ['kingLick', 'king'], bunny: ['pawsLick', 'paws'], bunny2: ['pawsLick', 'paws'] } },
  // the lifeguard chair (water park, the chair alone): she climbs up the tall white chair, waves from the seat with
  // the whistle on its cord swinging, and hops back down
  lifeguard: { park: 'water', T: 3, ps: 0.7,
    at: (t) => { const u = Math.sin(t * Math.PI); return [180, 664 - u * 150, 1.3 - u * 0.15, 0]; },
    set: (d, t) => [G({ class: 'r-chair' }, L('M130 700L150 500M230 700L210 500', '#FFFFFF', 10), L('M138 640H222M144 580H216', '#FFFFFF', 6),
      T('rect', { x: 140, y: 494, width: 80, height: 14, rx: 4, fill: '#E5484D' }), L('M150 494V440M210 494V440M150 440H210', '#FFFFFF', 6),
      P('M120 430Q180 380 240 430Z', '#F2C230', '#C99A1E'), L(`M200 470q${(Math.sin(t * TAU * 2) * 6).toFixed(1)} 20 0 30`, '#E5484D', 2), E(200, 502, 5, 5, '#F2C230'))],
    car: (d, k) => G({}, ...k),
    act: { yellowDog: ['calmWatch', 'calm'], chocolateDog: ['shyClimb', 'back'], gingerDog: ['earsWatch', 'ears'], blackDog: ['ballWatch', 'ball'],
      puppy: ['watchHowl', 'howl'], kitty: ['kingWatch', 'king'], bunny: ['pawsWatch', 'paws'], bunny2: ['pawsWatch', 'paws'] } },
};
export const actOf2 = (scene, pet) => SCENES2[scene]?.act[pet]?.[0] || 'ride';

// the shared template; k = the rides screen's kit (paint, back, pp, ghostAt, loop, leave, svgPt)
export function build(k, { main, stage, pet, fx, first, reduced, zone, scene }) {
  const S = SCENES2[scene]; const [act, pk] = S.act[pet]; const dur = S.T || 3;
  let t = 0, ph = 'idle', ghost = first && !reduced, drag = null, auto = false;
  const at = () => S.at(t);
  function draw() {
    main.dataset.phase = ph;
    const defs = []; const [x, y, s, rot] = at();
    const o = { ...(ph === 'idle' ? {} : POSE[pk]), ...(ph === 'after' ? { mouth: 'open', pawsUp: true } : {}), ...(S.wet ? { wet: true } : {}) };
    const rider = G({ class: 'rd-rider', 'data-act': act, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)}) rotate(${rot || 0})` },
      S.car(defs, [G({ transform: `scale(${S.ps || 0.62})` }, k.pp(pet, o))], t), ph === 'idle' ? A.grabRing(50, -60) : null, ph === 'after' ? A.stars(3) : null);
    k.paint(stage, [...k.back(zone, defs), ...S.set(defs, t), rider, ...(S.front ? S.front(defs, t) : []), ghost && ph === 'idle' ? k.ghostAt(x, y - 60, 'M0 0h110m-14 -12l14 12l-14 12', 0.8) : null].filter(Boolean), defs);
  }
  draw();
  const done = () => { ph = 'after'; auto = false; drag = null; fx(R.TRAIT[pet].sound); draw(); };
  stage.onpointerdown = (ev) => { ghost = false; if (ph === 'after') { ph = 'idle'; t = 0; draw(); return; } if (auto) return;
    drag = { p: k.svgPt(stage.firstChild, ev), moved: false }; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ } };
  stage.onpointermove = (ev) => { if (!drag || auto) return; const q = k.svgPt(stage.firstChild, ev); const d = Math.hypot(q[0] - drag.p[0], q[1] - drag.p[1]);
    if (d < 8) return; drag.moved = true; ph = 'ride'; t = Math.min(1, t + d / 600); drag.p = q; if (t >= 1) done(); else draw(); };
  stage.onpointerup = () => { const tap = drag && !drag.moved; drag = null; if (!tap || ph === 'after' || auto) return; ph = 'ride'; auto = true; fx(R.TRAIT[pet].sound); // a tap rides it by itself
    k.loop((dt) => { if (!auto) return false; t = Math.min(1, t + dt / dur); if (t >= 1) { done(); return false; } draw(); return true; }); };
  main.rideSet = (p, v = 0) => { k.leave(); auto = false; ghost = p === 'ghost'; ph = ghost ? 'idle' : p; t = p === 'ride' ? v : p === 'after' ? 1 : 0; draw(); };
}

// ---- bike (park): she steers along the path; fruit and veg spin her out (no mud; the bike is dry) ------------------
const BK_POSE = { tongueFlap: { mouth: 'open', ears: 'out' }, duckLow: { half: true }, holdToy: { toy: 'ballBlue', toyAt: 'mouth' }, pedalCalm: { ears: 'back' }, leanFast: { ears: 'back', mouth: 'open' }, crownHigh: { chinUp: true }, ringBell: { mouth: 'open' }, basketRide: {} };
const BK_ITEMS = [['banana', 0.28, 0.4], ['carrot', 0.52, 0.64], ['strawberry', 0.76, 0.38]];
function bikeScene({ paint, pp, ghostAt, svgPt, leave, loop, park, near, near2, busy, H }, { main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('bike', pet);
  let p = 0, l = 0.5, ph = 'idle', ghost = first && !reduced, spin = 0, spinning = null, hit = new Set(), drag = false, tapAt = null, auto = false;
  const Y0 = 742, Y1 = 330; const yOf = (q) => Y0 - q * (Y0 - Y1); const wOf = (q) => 280 - q * 170; const xOf = (q, ll) => 180 + (ll - 0.5) * wOf(q); const sOf = (q) => 1 - q * 0.5;
  function draw() {
    main.dataset.phase = ph;
    const defs = []; const items = BK_ITEMS.map((it, i) => { const [k, q, ll] = it; const s = sOf(q);
      return ['g', { class: `rd-item${hit.has(i) ? ' hit' : ''}`, 'data-item': k, transform: `translate(${xOf(q, ll)} ${yOf(q)}) scale(${s * 1.6})` }, A.FOOD[k]()]; }).reverse();
    const o = { ...BK_POSE[act] }; if (ph === 'after') { o.mouth = 'open'; o.pawsUp = true; }
    const s = sOf(p) * 1.55; const x = xOf(p, l), y = yOf(p);
    const rider = ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${x} ${y}) scale(${s}) rotate(${spin})` }, A.bike(defs, [['g', { transform: 'scale(0.62)' }, pp(pet, o)]]),
      spinning ? A.stars(3) : null, ph === 'idle' || ph === 'ride' ? A.grabRing(52, -60) : null].filter(Boolean);
    paint(stage, [...park(defs), A.path(defs, Y1 - 40, H + 20, 90, 320), ...items, rider, ghost && ph === 'idle' ? ghostAt(x, y - 60, 'M0 -10V-160m-12 14l12 -14l12 14', 0.8) : null, near()].filter(Boolean), defs);
  }
  draw();
  const anim = () => { if (!busy()) loop((dt) => { let more = false;
    if (spinning) { spinning.t += dt / 0.8; spin = 360 * Math.min(1, spinning.t); more = true; if (spinning.t >= 1) { spinning = null; spin = 0; } } draw(); return more; }); };
  stage.onpointerdown = (ev) => { const [qx, qy] = svgPt(stage.firstChild, ev); ghost = false;
    if (ph === 'after') { ph = 'idle'; p = 0; l = 0.5; hit = new Set(); draw(); return; }
    if (busy() && auto) return; tapAt = [qx, qy]; if (!near2(xOf(p, l), yOf(p) - 50 * sOf(p), qx, qy, 70)) return; drag = true; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ } };
  const step = () => { BK_ITEMS.forEach((it, i) => { if (hit.has(i) || !R.hits(p, l, it)) return; hit.add(i);
      const so = R.spinOut(it[0]); spinning = { t: 0 }; drag = false; fx(so.sound); anim(); });
    if (p >= 0.97) { ph = 'after'; drag = false; fx(R.TRAIT[pet].sound); }
    draw(); };
  stage.onpointermove = (ev) => { if (!drag || spinning) return; const [qx, qy] = svgPt(stage.firstChild, ev); if (tapAt && Math.hypot(qx - tapAt[0], qy - tapAt[1]) < 8) return; tapAt = null; ph = 'ride';
    p = Math.max(0, Math.min(1, (Y0 - (qy + 30)) / (Y0 - Y1))); l = Math.max(0.05, Math.min(0.95, (qx - 180) / wOf(p) + 0.5)); step(); };
  stage.onpointerup = () => { drag = false; if (!tapAt || ph === 'after') return; tapAt = null; ph = 'ride'; auto = true; // a single tap rides it up the path by itself
    loop((dt) => { if (!spinning) p = Math.min(1, p + dt * 0.3); if (spinning) { spinning.t += dt / 0.8; spin = 360 * Math.min(1, spinning.t); if (spinning.t >= 1) { spinning = null; spin = 0; } }
      step(); if (ph === 'after') { auto = false; return false; } return true; }); };
  main.rideSet = (ph2, v = 0) => { leave(); ghost = ph2 === 'ghost'; ph = ghost ? 'idle' : ph2;
    if (ph2 === 'ride') { p = v || 0.3; l = 0.42; } if (ph2 === 'spin') { ph = 'ride'; p = 0.42; l = 0.62; spinning = { t: 0.4 }; spin = 144; } if (ph2 === 'after') { p = 1; l = 0.5; } draw(); };
}
export const BUILT2 = { bike: bikeScene };
