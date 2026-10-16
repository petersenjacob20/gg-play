// Ride Close-Up Scenes (the pure parts): which park item opens which close-up scene, how each pet behaves on each
// ride (by pet id and trait only; spoken names come from petName / the phone-typed names), the scooter's mud that stays
// on a pet until the splash pad, and the fruit-and-veg spin-out. No timer, no score, nothing to lose.
export const PETS = ['yellowDog', 'chocolateDog', 'gingerDog', 'blackDog', 'puppy', 'kitty', 'bunny', 'bunny2'];
// park -> its scenes, in the order the park lists the item; `piece` is the park item that opens it
export const PARKS = {
  park: [['slide', 'slide'], ['swings', 'swings'], ['merry', 'merry'], ['scooter', 'scooter'], ['splash', 'splash']],
  coaster: [['coaster', 'dragonCoaster'], ['teacups', 'teapots']],
  water: [['curly', 'curlySlide'], ['bucket', 'bucket'], ['river', 'lazyPool'], ['sprayers', 'sprayers'], ['frisbee', 'floatTargets']],
};
export const SCENES = Object.fromEntries(Object.entries(PARKS).flatMap(([park, l]) => l.map(([id, piece]) => [id, { id, park, piece }])));
export const sceneFor = (zone, piece) => (PARKS[zone] || []).find((s) => s[1] === piece)?.[0] || null;
// the splash pad is in the park and the water park; either one opens the same scene (the water park's own backdrop)
export const sceneOfPiece = (zone, piece) => sceneFor(zone, piece) || (piece === 'splash' && zone === 'water' ? 'splash' : null);

// each pet's personality: its sound, a toy it carries, how it rides (a word per ride the art and motion read)
export const TRAIT = {
  puppy: { sound: 'fx-yip', loud: true },
  chocolateDog: { sound: 'fx-woof', cozy: true },
  blackDog: { sound: 'fx-woof', toy: 'ballBlue', frisbee: 'blue' },
  yellowDog: { sound: 'fx-woof', calm: true, frisbee: 'yellow' },
  gingerDog: { sound: 'fx-woof', toy: 'frisbeeGreen', frisbee: 'green', ears: true },
  kitty: { sound: 'fx-meow', king: true },
  bunny: { sound: 'fx-giggle', bunny: true, pair: 'bunny2' },
  bunny2: { sound: 'fx-giggle', bunny: true, pair: 'bunny' },
};
// the FINAL Dad-approved actions, one word per pet per ride (the scene's art and motion for that word)
export const ACT = {
  slide: { puppy: 'headfirst', chocolateDog: 'curlSpin', blackDog: 'holdBall', yellowDog: 'slowCalm', gingerDog: 'zoomFrisbee', kitty: 'kingTail', bunny: 'bunnyPile', bunny2: 'bunnyPile' },
  scooter: { puppy: 'aimPuddles', chocolateDog: 'zipQuiet', blackDog: 'grabRock', yellowDog: 'slowSteady', gingerDog: 'leanEars', kitty: 'swerveMud', bunny: 'zoom', bunny2: 'sniffFlowers' },
  merry: { puppy: 'hangHowl', chocolateDog: 'snuggleMiddle', blackDog: 'ballRolls', yellowDog: 'chinRest', gingerDog: 'earsOut', kitty: 'ownsCenter', bunny: 'bounceDizzy', bunny2: 'bounceDizzy' },
  coaster: { puppy: 'howl', chocolateDog: 'coverPeek', blackDog: 'hugBall', yellowDog: 'calmWise', gingerDog: 'earsFlap', kitty: 'pawsWave', bunny: 'earsBack', bunny2: 'earsBack' },
  swings: { puppy: 'barkUp', chocolateDog: 'curlCozy', blackDog: 'jumpOff', yellowDog: 'gentle', gingerDog: 'jumpOff', kitty: 'tailWave', bunny: 'shareSwing', bunny2: 'shareSwing' },
  splash: { puppy: 'tiptoeDry', chocolateDog: 'launchWiggle', blackDog: 'bounceBall', yellowDog: 'lieMist', gingerDog: 'snapStreams', kitty: 'hopJets', bunny: 'startleHop', bunny2: 'startleHop' },
  curly: { puppy: 'cannonball', chocolateDog: 'spinPopUp', blackDog: 'ballUp', yellowDog: 'drift', gingerDog: 'bellyFlop', kitty: 'barelyWet', bunny: 'littleWave', bunny2: 'littleWave' },
  bucket: { puppy: 'mouthOpen', chocolateDog: 'dodgeBack', blackDog: 'ballUp', yellowDog: 'sitCalm', gingerDog: 'catchWater', kitty: 'kingDry', bunny: 'hopCircles', bunny2: 'hopCircles' },
  river: { puppy: 'paddleCircles', chocolateDog: 'stretchOut', blackDog: 'ballBelly', yellowDog: 'napRing', gingerDog: 'chaseFrisbee', kitty: 'royalBoat', bunny: 'onHead', bunny2: 'ringSinks' },
  sprayers: { puppy: 'biteStream', chocolateDog: 'hidePeek', blackDog: 'chaseDrops', yellowDog: 'blinkHappy', gingerDog: 'spin', kitty: 'glareLaugh', bunny: 'earsFlop', bunny2: 'earsFlop' },
  frisbee: { puppy: 'cheer', chocolateDog: 'cheer', blackDog: 'diveBlue', yellowDog: 'diveYellow', gingerDog: 'diveGreen', kitty: 'cheer', bunny: 'cheer', bunny2: 'cheer' },
  teacups: null,
};
ACT.teacups = ACT.merry; // the teacups ride the way the merry-go-round does (FINAL: "Merry-go-round + Teacups")
export const actOf = (scene, pet) => (ACT[scene] && ACT[scene][pet]) || 'ride';
// the bunnies ride together where the FINAL list pairs them
export const riders = (scene, pet) => (TRAIT[pet]?.bunny && /bunnyPile|shareSwing|bounceDizzy|earsBack|startleHop|onHead|ringSinks|hopCircles|littleWave|earsFlop/.test(actOf(scene, pet)) ? [pet, TRAIT[pet].pair] : [pet]);

// mud: a puddle hit on the scooter adds a splat that stays on that pet (every scene, this session) until the splash pad
export const mudOf = (mud, pet) => (mud && mud[pet]) || 0;
export function splat(mud, pet) { mud[pet] = Math.min(6, mudOf(mud, pet) + 1); return mud[pet]; }
export function wash(mud, pet) { const had = mudOf(mud, pet); delete mud[pet]; return had; }

// scooter path items: fruit and veg only; a hit is a cartoon spin-out (a twirl, stars, a giggle, back up), never a crash
export const PATH_ITEMS = ['banana', 'carrot', 'strawberry'];
export const PATH = [['puddle', 0.24, 0.36], ['banana', 0.42, 0.62], ['puddle', 0.55, 0.3], ['carrot', 0.68, 0.7], ['strawberry', 0.82, 0.42], ['puddle', 0.92, 0.6]];
// the swerving pet (the cat) steers round mud on his own unless she drives straight into it
export const hits = (x, y, item, r = 0.09) => Math.abs(x - item[1]) < r && Math.abs(y - item[2]) < r * 1.4;
export function spinOut(kind) { return PATH_ITEMS.includes(kind) ? { twirl: 360, stars: 3, sound: 'fx-giggle', after: 'popUp' } : null; }

// the swing: each push goes a little higher, never scary (a low cap); the jumpers hop off at the top onto soft grass
export const SWING_MAX = 34; // degrees
export const push = (a) => Math.min(SWING_MAX, a + 8);
export const jumper = (pet) => actOf('swings', pet) === 'jumpOff';
// the slide: drag up the ladder (0 = ground, 1 = the top), then a tap sends the pet down
export const atTop = (t) => t >= 0.92;
// spin rides (merry-go-round, teacups): the finger sets the speed, kept gentle; all wobble off after
export const SPIN_MAX = 2.4; // turns a second at most
export const spinSpeed = (v) => Math.max(0, Math.min(SPIN_MAX, v));
// the tipping bucket fills one drop a tap; at FULL it tips and everyone cheers (counting along, never a score)
export const FULL = 5;
export const fill = (n) => (n + 1 >= FULL ? 0 : n + 1);

// #ride/<ride>/<pet> (Security): both parts are checked against fixed allowlists (Maps, never a plain-object lookup, so
// __proto__ or constructor match nothing); anything else gives null and the screen falls back to the park
export const RIDE_IDS = ['slide', 'swings', 'merry', 'teacups', 'scooter', 'splash', 'coaster', 'curly', 'bucket', 'river', 'sprayers', 'frisbee'];
const RIDE_OK = new Map(RIDE_IDS.map((k) => [k, k])), PET_OK = new Map(PETS.map((k) => [k, k]));
export function parseRide(hash) {
  const m = /^#ride\/([A-Za-z0-9]{1,20})\/([A-Za-z0-9]{1,20})$/.exec(String(hash || ''));
  if (!m) return null;
  const scene = RIDE_OK.get(m[1]), pet = PET_OK.get(m[2]);
  return scene && pet ? { scene, pet } : null;
}
// where Back (and a bad ride link) goes: the park it came from, only if it is a plain park route
// a bad ride link: a known pet lands on its own park (the park it came from if that was its), else the pet picker
export function fallbackTo(hash, from) {
  const m = /^#ride\/[^/]{0,80}\/([A-Za-z0-9]{1,20})$/.exec(String(hash || '')), pet = m && PET_OK.get(m[1]);
  if (!pet) return '#playground';
  const b = backTo(from);
  return b === `#playground/${pet}` || b.startsWith(`#playground/${pet}/`) ? b : `#playground/${pet}`;
}
export const backTo = (from) => (/^#playground(\/[A-Za-z0-9]{1,20}){0,2}$/.test(String(from || '')) ? from : '#playground');
