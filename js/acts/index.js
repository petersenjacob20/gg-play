// The activities (plan f3). Each quiz activity is one module with makeQuestion(data, level, prev, rng);
// the shared quiz screen (screens/play.js) runs all of them. Adding arrived in piece 3, patterns in
// piece 4. Story Time (piece 5a) is not a quiz: its tile opens the shelf (screens/stories.js).
import letters from './letters.js';
import count from './count.js';
import add from './add.js';
import pattern from './pattern.js';

export const ACTS = { letters, count, add, pattern };
// Home tiles and Dad's level rows, in home order. `soon` = no content yet in this piece (none since piece 5a).
export const TILES = [
  { id: 'letters', name: 'Letters', clip: 'homeLetters', route: '#play/letters' },
  { id: 'count', name: 'Counting', clip: 'homeCount', route: '#play/count' },
  { id: 'add', name: 'Adding', clip: 'homeAdd', route: '#play/add' },
  { id: 'pattern', name: 'Patterns', clip: 'homePattern', route: '#play/pattern' },
  { id: 'stories', name: 'Stories', clip: 'homeStories', route: '#stories', noLevels: true },
];
export const SOON = TILES.filter((t) => t.soon).map((t) => t.id);
