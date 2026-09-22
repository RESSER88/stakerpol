/**
 * Jedyne źródło logiki statusu oferty. Stan wynika wyłącznie z pól
 * shared_lists: archived_at > revoked_at > expires_at. Znaczenie statusów
 * pozostaje takie samo jak w poprzednich, rozproszonych implementacjach
 * (stateOf w SentOffersView i offerState w ContactCard).
 */
export interface OfferStateSource {
  expires_at: string;
  revoked_at?: string | null;
  archived_at?: string | null;
}

export type OfferStateKind = 'archiwalna' | 'zatrzymana' | 'wygasla' | 'wygasa' | 'aktywna';

export interface OfferStateInfo {
  kind: OfferStateKind;
  /** Etykieta dla UI, np. „aktywna”, „wygasa za 2 dni”. */
  label: string;
  className: string;
}

const DAY = 24 * 60 * 60 * 1000;
const MUTED = 'text-editorial-muted border-editorial-line';

export const offerState = (row: OfferStateSource): OfferStateInfo => {
  if (row.archived_at) return { kind: 'archiwalna', label: 'archiwalna', className: MUTED };
  if (row.revoked_at) return { kind: 'zatrzymana', label: 'zatrzymana', className: MUTED };

  const left = new Date(row.expires_at).getTime() - Date.now();
  if (left <= 0) return { kind: 'wygasla', label: 'wygasła', className: MUTED };

  const days = Math.ceil(left / DAY);
  if (days <= 3) {
    return {
      kind: 'wygasa',
      label: days === 1 ? 'wygasa dziś' : `wygasa za ${days} dni`,
      className: 'text-editorial-ink border-editorial-ink',
    };
  }
  return { kind: 'aktywna', label: 'aktywna', className: 'text-editorial-accent border-editorial-accent' };
};

/** Oferta wciąż działająca (link otwiera się u klienta). */
export const isOfferActive = (row: OfferStateSource): boolean => {
  const { kind } = offerState(row);
  return kind === 'aktywna' || kind === 'wygasa';
};
