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
