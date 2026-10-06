// The activity engines (plan f3 / l1). Each quiz activity is one module with makeQuestion(...).
// Games (games.json) are ladders of these steps. Story Time is not a quiz: its tile opens #stories.
import letters from './letters.js';
import count from './count.js';
import add from './add.js';
import pattern from './pattern.js';

export const ACTS = { letters, count, add, pattern };

// Games that are not a quiz and have their own screen (Amendment p: Puppy Says). The ladder's act
// names the screen. A game is built when its first act is a quiz act or one of these.
export const SCREENS = { says: 'says' };
export const PLAYABLE = { ...ACTS, ...SCREENS };

// Compatibility for older tests: activity list in the old home order. Home itself reads games.json.
export const TILES = [
  { id: 'letters', name: 'Letters', clip: 'homeLetters', route: '#play/letters' },
  { id: 'count', name: 'Counting', clip: 'homeCount', route: '#play/count' },
  { id: 'add', name: 'Adding', clip: 'homeAdd', route: '#play/add' },
  { id: 'pattern', name: 'Patterns', clip: 'homePattern', route: '#play/pattern' },
  { id: 'stories', name: 'Stories', clip: 'homeStories', route: '#stories', noLevels: true },
];
export const SOON = [];
