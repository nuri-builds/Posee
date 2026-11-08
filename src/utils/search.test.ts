import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, searchPoses, type Searchable } from './search.ts';

const items: Searchable[] = [
  { id: 'twirl', title: 'Outfit twirl reveal', occasion: 'wedding', group: 'solo', tags: ['lehenga', 'twirl'] },
  { id: 'baraat', title: 'Baraat squad', occasion: 'wedding', group: 'friends', tags: ['baraat', 'dance'] },
  { id: 'holi', title: 'Colour throw', occasion: 'holi', group: 'friends', tags: ['gulal'] },
  { id: 'holi-solo', title: 'Arms-up colour burst', occasion: 'holi', group: 'solo', tags: ['gulal'] },
  { id: 'back', title: 'Back-to-camera view', occasion: 'solo-travel', group: 'solo', tags: ['mountains', 'goa'] },
  { id: 'diya', title: 'Diya glow portrait', occasion: 'diwali', group: 'solo', tags: ['saree', 'kurta'] },
];
const idx = buildIndex(items);
const ids = (q: string, f = {}) => searchPoses(idx, q, f).map((p) => p.id);

test('Hinglish synonyms map to occasions', () => {
  assert.ok(ids('shaadi').includes('twirl'));
  assert.ok(ids('deepavali').includes('diya'));
  assert.deepEqual(ids('dost'), ['baraat', 'holi']);
});

test('transliteration variants and typos', () => {
  assert.deepEqual(ids('lehnga'), ['twirl']);
  assert.deepEqual(ids('lehenaga'), ['twirl']); // one-letter typo
  assert.deepEqual(ids('mountians'), ['back']);
});

test('multi-word queries narrow results', () => {
  assert.deepEqual(ids('holi solo'), ['holi-solo']);
  assert.deepEqual(ids('solo trip'), ['back']);
});

test('prefix matching while typing', () => {
  assert.ok(ids('wed').includes('twirl'));
});

test('filters and empty query', () => {
  assert.equal(ids('').length, items.length);
  assert.deepEqual(ids('', { occasion: 'holi', group: 'solo' }), ['holi-solo']);
});
