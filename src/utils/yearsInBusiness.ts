// Liczba lat działalności liczona od 2 sierpnia 2008 r.
// Wartość rośnie dopiero po przekroczeniu 2 sierpnia w danym roku.
export const BUSINESS_START = { year: 2008, month: 8, day: 2 };

export const getYearsInBusiness = (now: Date = new Date()): number => {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  let years = year - BUSINESS_START.year;
  const beforeAnniversary =
    month < BUSINESS_START.month ||
    (month === BUSINESS_START.month && day < BUSINESS_START.day);

  if (beforeAnniversary) years -= 1;

  return Math.max(0, years);
};

// Poprawna polska forma rzeczownika "rok" dla podanej liczby.
// Reguła: 1 -> "rok"; 2-4 (poza 12-14) -> "lata"; pozostałe -> "lat".
export const polishYearsNoun = (years: number): string => {
  const abs = Math.abs(years);
  const last = abs % 10;
  const lastTwo = abs % 100;

  if (abs === 1) return 'rok';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'lata';
  return 'lat';
};

// "18 lat", "22 lata", "25 lat"
export const yearsInBusinessLabel = (now: Date = new Date()): string => {
  const years = getYearsInBusiness(now);
  return `${years} ${polishYearsNoun(years)}`;
};
