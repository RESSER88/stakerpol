export const FALLBACK_GROUP = 'Pozostałe';
export const SERIES_ORDER = ['SWE', 'LWE', 'SPE', 'RRE', 'LSE'];

const MODEL_ALIASES: Record<string, string> = { 'SWE 200': 'SWE 200D' };

const NOISE = /\b(toyota|bt|staxio|staker|levio|sztaplarka|elektryczny|paleciak|paletowy)\b/gi;

/** Returns { display, group } — display may include " EX", group never does. */
export const normalizeModel = (raw?: string): { display: string; group: string } => {
  const original = (raw || '').trim();
  const cleaned = original.replace(NOISE, ' ');
  const m = cleaned.match(/\b(SWE|LWE|SPE|RRE|LSE)\s*(\d+)\s*([A-Z]{0,2})\b/i);
  if (!m) return { display: original, group: FALLBACK_GROUP };
  let base = `${m[1].toUpperCase()} ${m[2]}${(m[3] || '').toUpperCase()}`;
  base = MODEL_ALIASES[base] || base;
  const isEx = /\bEX\b/i.test(original);
  return { display: isEx ? `${base} EX` : base, group: base };
};

export const normalizeModelCode = (model: string): string => normalizeModel(model).display;

export const getModelGroupKey = (model: string): string => normalizeModel(model).group;

export const seriesRank = (key: string): number => {
  if (key === FALLBACK_GROUP) return 999;
  const idx = SERIES_ORDER.indexOf(key.split(' ')[0]);
  return idx === -1 ? 500 : idx;
};

/** Sort comparator matching the XLSX export group ordering. */
export const compareModelGroups = (a: string, b: string): number => {
  const ra = seriesRank(a);
  const rb = seriesRank(b);
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b);
};

/** true = z podestem, false = bez podestu (nierozpoznane → false) */
export const hasOperatorPlatform = (raw?: string | null): boolean => {
  const v = (raw || '').trim().toLowerCase();
  return v.startsWith('tak');
};
