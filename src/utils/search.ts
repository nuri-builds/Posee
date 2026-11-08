/**
 * Offline, dependency-free pose search tuned for Indian and global occasions.
 * It understands Hinglish and transliteration variants ("shaadi", "mehndi",
 * "lehnga"), tolerates single-letter typos, and ranks title and tag hits above
 * loose matches. It runs entirely on the device, and no query leaves the phone.
 */

export type Searchable = {
  id: string;
  title: string;
  occasion: string;
  group: string;
  tags: string[];
};

/** Maps each variant to a canonical term. Both are indexed. */
const SYNONYMS: Record<string, string> = {
  // wedding
  shaadi: 'wedding', shadi: 'wedding', vivah: 'wedding', biyah: 'wedding', marriage: 'wedding', nikah: 'wedding', reception: 'wedding',
  dulhan: 'bride', dulha: 'groom', dulhe: 'groom',
  jaimala: 'varmala', jaymala: 'varmala', garland: 'varmala',
  mehndi: 'mehendi', mehandi: 'mehendi', henna: 'mehendi',
  pithi: 'haldi', turmeric: 'haldi',
  lehnga: 'lehenga', lengha: 'lehenga', lahenga: 'lehenga', ghagra: 'lehenga', chaniya: 'lehenga',
  sari: 'saree', shervani: 'sherwani', kurti: 'kurta', bandhgala: 'sherwani',
  // festivals
  deepavali: 'diwali', divali: 'diwali', deepawali: 'diwali', diya: 'diwali',
  phagwa: 'holi', rang: 'holi', gulal: 'holi', colours: 'holi', colors: 'holi',
  garba: 'navratri', dandiya: 'navratri', navaratri: 'navratri',
  ramzan: 'eid', ramadan: 'eid', bakrid: 'eid',
  // travel and groups
  trip: 'travel', vacation: 'travel', holiday: 'travel', backpacking: 'travel', wanderlust: 'travel',
  dost: 'friends', squad: 'friends', gang: 'friends', yaar: 'friends', bffs: 'friends', bff: 'friends', cousins: 'friends', group: 'friends',
  parivar: 'family', fam: 'family', parents: 'family',
  alone: 'solo', myself: 'solo', selfie: 'solo',
  partner: 'couple', couples: 'couple',
};

const OCCASION_KEYWORDS: Record<string, string[]> = {
  wedding: ['wedding', 'bride', 'groom', 'varmala'],
  mehendi: ['mehendi', 'haldi'],
  sangeet: ['sangeet', 'dance'],
  diwali: ['diwali'],
  holi: ['holi'],
  navratri: ['navratri', 'durga'],
  eid: ['eid'],
  'solo-travel': ['travel', 'solo'],
  'group-trip': ['travel', 'friends', 'family'],
  everyday: ['casual', 'everyday'],
};

export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((t) => SYNONYMS[t] ?? t);
}

/**
 * Edit distance that counts an adjacent swap ("mountians") as one edit.
 * Exits early once the distance passes `max`.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

type Indexed<T> = { item: T; titleTokens: Set<string>; tagTokens: Set<string> };

export function buildIndex<T extends Searchable>(items: T[]): Indexed<T>[] {
  return items.map((item) => ({
    item,
    titleTokens: new Set(normalize(item.title)),
    tagTokens: new Set([
      ...item.tags.flatMap(normalize),
      ...normalize(item.group),
      ...(OCCASION_KEYWORDS[item.occasion] ?? normalize(item.occasion)),
    ]),
  }));
}

function scoreToken(q: string, tokens: Set<string>, weight: number): number {
  if (tokens.has(q)) return weight;
  let best = 0;
  for (const t of tokens) {
    if (q.length >= 2 && t.startsWith(q)) best = Math.max(best, weight * 0.6); // still typing
    else if (q.length >= 5 && editDistance(q, t, 1) <= 1) best = Math.max(best, weight * 0.5); // typo
  }
  return best;
}

export type SearchFilters = { occasion?: string | null; group?: string | null };

export function searchPoses<T extends Searchable>(
  index: Indexed<T>[],
  query: string,
  filters: SearchFilters = {},
): T[] {
  const qTokens = normalize(query);
  const results: { item: T; score: number; order: number }[] = [];

  index.forEach(({ item, titleTokens, tagTokens }, order) => {
    if (filters.occasion && item.occasion !== filters.occasion) return;
    if (filters.group && item.group !== filters.group) return;

    if (qTokens.length === 0) {
      results.push({ item, score: 0, order });
      return;
    }

    let score = 0;
    let matched = 0;
    for (const q of qTokens) {
      const s = Math.max(scoreToken(q, titleTokens, 3), scoreToken(q, tagTokens, 2));
      if (s > 0) matched++;
      score += s;
    }
    // Every query word must match something, so "holi solo" narrows the results.
    if (matched === qTokens.length) results.push({ item, score, order });
  });

  return results.sort((a, b) => b.score - a.score || a.order - b.order).map((r) => r.item);
}
