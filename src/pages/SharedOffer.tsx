import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowDown, ArrowUp, ArrowUpFromLine, BatteryCharging, ChevronRight, ExternalLink, Images, Info, MapPin, MoveVertical, SlidersHorizontal, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import {
  ExportFilterCriteria,
  filterProductsByCriteria,
} from '@/utils/exportFilterCriteria';
import {
  buildExportRows,
  EXPORT_COLUMNS,
  COMPANY,
  WAREHOUSE,
  formatPrice,
} from '@/utils/exportListModel';
import FloatingContactBubble from '@/components/contact/FloatingContactBubble';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import SharedOfferFilters, {
  EMPTY_VIEWER_FILTERS,
  ViewerFilterState,
  isViewerFilterActive,
  viewerFiltersToCriteria,
} from '@/components/shared-offer/SharedOfferFilters';
import PriceInquiryModal from '@/components/products/PriceInquiryModal';
import SpecIconTile from '@/components/shared-offer/SpecIconTile';
import OfferPhotoBrowser from '@/components/shared-offer/OfferPhotoBrowser';


import ProductStickyBar from '@/components/products/ProductStickyBar';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import { useScrollState } from '@/hooks/useScrollDirection';
import {
  getGroupCommonParams,
  COMMON_PARAM_KEYS,
  COMMON_PARAM_LABELS,
} from '@/utils/sharedOffer/groupCommonParams';
import {
  SortKey,
  DEFAULT_SORT,
  SORT_OPTIONS,
  SORT_FIELDS,
  sortExportRows,
  toSortKey,
  fromSortKey,
} from '@/utils/sharedOffer/sortRows';

/** Wysokość przyklejonego paska filtrów — offset nagłówka grupy (mobile). */
const STICKY_GROUP_TOP = 60;

const SortControl = ({
  value,
  onChange,
  className,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  className?: string;
}) => (
  <label className={cn('inline-flex items-center gap-2 text-xs text-gray-700', className)}>
    <span className="sr-only md:not-sr-only">Sortowanie</span>
    <select
      aria-label="Sortowanie listy"
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="h-11 w-full md:w-auto rounded-md border border-gray-300 bg-white px-3 text-sm text-stakerpol-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

/** Mobile: trzy przyciski sortowania z odwracaniem kierunku. */
const SortButtons = ({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) => {
  const active = fromSortKey(value);
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Sortowanie listy">
      {SORT_FIELDS.map(({ field, label }) => {
        const isActive = active.field === field;
        return (
          <button
            key={field}
            type="button"
            aria-pressed={isActive}
            onClick={() =>
              onChange(toSortKey(field, isActive && active.dir === 'asc' ? 'desc' : 'asc'))
            }
            className={cn(
              'inline-flex shrink-0 items-center gap-1 h-11 px-3 rounded-md border text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange',
              isActive
                ? 'border-stakerpol-navy bg-stakerpol-navy text-white'
                : 'border-gray-300 bg-white text-stakerpol-navy'
            )}
          >
            {label}
            {isActive &&
              (active.dir === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              ))}
          </button>
        );
      })}
    </div>
  );
};




type LinkState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'ok'; criteria: ExportFilterCriteria; expiresAt: string };

const formatDateTime = (d: Date) =>
  d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const NoIndexHead = () => (
  <Helmet>
    <title>Lista magazynowa — FHU Stakerpol</title>
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <meta name="googlebot" content="noindex, nofollow, noarchive" />
  </Helmet>
);

const StatusTag = ({ value }: { value: string }) => {
  const tone =
    value === 'Sprzedany'
      ? 'bg-gray-200 text-gray-700'
      : value === 'Zarezerwowany'
      ? 'bg-amber-100 text-amber-900'
      : 'bg-emerald-100 text-emerald-900';
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-[11px] font-semibold', tone)}>
      {value}
    </span>
  );
};

const PriceCell = ({
  showPrice,
  netPrice,
  currency,
  onInquiry,
}: {
  showPrice: boolean;
  netPrice: number;
  currency: string;
  onInquiry?: () => void;
}) =>
  showPrice ? (
    <span className="font-semibold text-stakerpol-navy whitespace-nowrap">
      {formatPrice(netPrice)} {currency}
    </span>
  ) : (
    <button
      type="button"
      onClick={onInquiry}
      className="text-gray-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
    >
      Cena na zapytanie — skontaktuj się z nami
    </button>
  );

/** Mobile: skrócony komunikat ceny, odsyłacz do formularza zapytania. */
const PriceCellMobile = ({
  showPrice,
  netPrice,
  currency,
  onInquiry,
}: {
  showPrice: boolean;
  netPrice: number;
  currency: string;
  onInquiry: () => void;
}) =>
  showPrice ? (
    <span className="font-semibold text-stakerpol-navy whitespace-nowrap">
      {formatPrice(netPrice)} {currency}
    </span>
  ) : (
    <button
      type="button"
      onClick={onInquiry}
      className="whitespace-nowrap text-stakerpol-navy underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
    >
      Cena na zapytanie
    </button>
  );


const SharedOffer = () => {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<LinkState>({ status: 'loading' });
  const [viewerFilters, setViewerFilters] = useState<ViewerFilterState>(EMPTY_VIEWER_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fetchedAt] = useState(() => new Date());
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT);
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
  const [barInquiryOpen, setBarInquiryOpen] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  /** Czujnik: pasek filtrów jest realnie przyklejony dopiero po minięciu tego punktu. */
  const stickySentinelRef = useRef<HTMLDivElement | null>(null);
  const [filterBarPinned, setFilterBarPinned] = useState(false);

  const { direction: scrollDirection, y: scrollY } = useScrollState(8);
  /** Ukrywanie tylko wtedy, gdy pasek jest przyklejony — inaczej nachodziłby na treść nad nim. */
  const hideFilterBar =
    filterBarPinned && scrollDirection === 'down' && scrollY > STICKY_GROUP_TOP * 2 && !sheetOpen;


  const { products, isLoading: productsLoading } = usePublicSupabaseProducts();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('shared-list', {
          body: { token },
        });
        if (!active) return;
        if (error || !data?.filters) {
          setLink({ status: 'denied' });
          return;
        }
        setLink({
          status: 'ok',
          criteria: data.filters as ExportFilterCriteria,
          expiresAt: data.expires_at as string,
        });
      } catch (e) {
        logger.warn('shared offer lookup failed');
        if (active) setLink({ status: 'denied' });
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const scope = useMemo(() => {
    if (link.status !== 'ok') return [];
    return filterProductsByCriteria(products, link.criteria);
  }, [link, products]);

  const visible = useMemo(() => {
    if (!isViewerFilterActive(viewerFilters)) return scope;
    return filterProductsByCriteria(scope, viewerFiltersToCriteria(viewerFilters));
  }, [scope, viewerFilters]);

  const model = useMemo(() => buildExportRows(visible), [visible]);

  /** Mapa produktów po id — potrzebna formularzowi zapytania. */
  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    visible.forEach((p) => map.set(p.id, p));
    return map;
  }, [visible]);

  const openInquiry = (productId: string) => {
    const p = productById.get(productId);
    if (p) setInquiryProduct(p);
  };



  /** Sortowanie i parametry wspólne wyłącznie na potrzeby renderu. */
  const sortedGroups = useMemo(
    () =>
      model.groups.map((g) => ({
        ...g,
        rows: sortExportRows(g.rows, sortKey),
        common: getGroupCommonParams({ rows: g.rows, label: g.label }),
      })),
    [model, sortKey]
  );

  /** Płaska lista wierszy w kolejności widocznej na liście — dla trybu zdjęć. */
  const photoRows = useMemo(
    () => sortedGroups.flatMap((g) => g.rows),
    [sortedGroups]
  );

  /** productId -> wszystkie zdjęcia produktu (galeria trybu zdjęć). */
  const imageById = useMemo(() => {
    const map = new Map<string, string[]>();
    visible.forEach((p) => {
      const list = (p.images?.length ? p.images : p.image ? [p.image] : []).filter(Boolean);
      map.set(p.id, list as string[]);
    });
    return map;
  }, [visible]);



  const isLoading = link.status === 'loading' || productsLoading;

  if (link.status === 'denied') {
    return (
      <>
        <NoIndexHead />
        <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-stakerpol-navy mb-3">Link jest nieaktywny</h1>
            <p className="text-gray-700 mb-6">
              Ta lista nie jest już dostępna. Skontaktuj się z nami, chętnie prześlemy aktualną
              ofertę.
            </p>
            <div className="space-y-2 text-sm">
              <a
                href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}
                className="block font-semibold text-stakerpol-orange"
              >
                {COMPANY.phone}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="block text-stakerpol-navy underline">
                {COMPANY.email}
              </a>
              <Link to={ROUTES.home} className="block text-stakerpol-navy underline">
                stakerpol.pl
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <NoIndexHead />
      <div className="min-h-screen bg-gray-50">
        {/* Nagłówek */}
        <header className="bg-stakerpol-navy text-white">
          <div className="container-custom px-4 md:px-8 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{COMPANY.name}</h1>
                <p className="text-sm text-white/80 mt-1">{COMPANY.tagline}</p>
                <p className="text-sm text-white/70 mt-3">
                  {COMPANY.person} · {COMPANY.address}
                </p>
                <p className="text-sm text-white/70">
                  {COMPANY.email} · {COMPANY.site}
                </p>
              </div>
              <a
                href={WAREHOUSE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-md px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-sm">
                  <span className="block font-semibold">{WAREHOUSE.label}</span>
                  <span className="block text-white/80">{WAREHOUSE.address}</span>
                </span>
              </a>
            </div>
          </div>
        </header>

        <main className="container-custom px-4 md:px-8 py-6 md:py-10">
          {/* Meta informacje */}
          <div className="text-sm text-gray-700 mb-6 space-y-1">
            {link.status === 'ok' && (
              <p>
                Link aktywny do <strong>{formatDate(link.expiresAt)}</strong>
              </p>
            )}
            <p>
              Dane pobrane {formatDateTime(fetchedAt)}. Lista jest odczytywana na żywo, więc jej
              zawartość może różnić się od wcześniej przesłanego pliku.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-700 py-16 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Ładowanie listy…
            </div>
          ) : (
            <>
              {/* Główna akcja — własny rząd, NIE przyklejony przy przewijaniu */}
              {photoRows.length > 0 && (
                <div className="md:hidden mb-4">
                  <button
                    type="button"
                    onClick={() => setPhotoMode(true)}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 px-4 rounded-md bg-stakerpol-orange text-white text-base font-bold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-navy"
                  >
                    <Images className="h-5 w-5" />
                    Przeglądaj ze zdjęciami
                  </button>
                </div>
              )}

              {/* Filtry — pasek mobilny poza wrapperem, aby przyklejenie działało w całym obszarze listy */}
              <div
                className={cn(
                  'md:hidden sticky top-0 z-30 -mx-4 mb-4 px-4 py-2 bg-gray-50 border-b border-gray-200 transition-transform duration-200 motion-reduce:transition-none',
                  hideFilterBar ? '-translate-y-[150%]' : 'translate-y-0'
                )}
              >


                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger className="inline-flex shrink-0 items-center gap-2 border border-gray-300 rounded-md px-4 h-11 text-sm font-semibold text-stakerpol-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtry
                      {isViewerFilterActive(viewerFilters) && (
                        <span className="ml-1 text-xs text-stakerpol-orange">aktywne</span>
                      )}
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filtry listy</SheetTitle>
                      </SheetHeader>
                      <div className="mt-5">
                        <SharedOfferFilters
                          scope={scope}
                          value={viewerFilters}
                          onChange={setViewerFilters}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                  <SortButtons value={sortKey} onChange={setSortKey} />
                </div>
              </div>




              <details className="hidden md:block mb-6 bg-white border border-gray-200 rounded-md">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-stakerpol-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange">
                  Filtry listy
                </summary>
                <div className="px-4 pb-5 pt-2 border-t border-gray-200">
                  <div className="mb-5 max-w-xs">
                    <SortControl value={sortKey} onChange={setSortKey} />
                  </div>
                  <SharedOfferFilters
                    scope={scope}
                    value={viewerFilters}
                    onChange={setViewerFilters}
                  />
                </div>
              </details>



              {/* Puste stany */}
              {scope.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-md p-8 text-center">
                  <h2 className="text-lg font-bold text-stakerpol-navy mb-2">
                    Brak pozycji w tym zestawieniu
                  </h2>
                  <p className="text-gray-700">
                    Aktualnie nie mamy wózków spełniających te kryteria. Zadzwoń — dobierzemy
                    maszynę pod Twoje potrzeby.
                  </p>
                </div>
              ) : visible.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-md p-8 text-center">
                  <h2 className="text-lg font-bold text-stakerpol-navy mb-2">
                    Twoje filtry nie pasują do żadnej pozycji
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Zmień kryteria lub wyczyść filtry, aby zobaczyć całą udostępnioną listę.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewerFilters(EMPTY_VIEWER_FILTERS)}
                    className="inline-flex items-center h-11 px-5 rounded-md bg-stakerpol-orange text-white text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-navy"
                  >
                    Wyczyść filtry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-gray-700">{model.summary}</p>
                    <button
                      type="button"
                      onClick={() => setPhotoMode(true)}
                      className="hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-md bg-stakerpol-orange text-white text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-navy"
                    >
                      <Images className="h-4 w-4" />
                      Przeglądaj ze zdjęciami
                    </button>
                  </div>


                  {/* Desktop: tabela */}
                  <div className="hidden md:block space-y-8">
                    {sortedGroups.map((group) => (
                      <section key={group.key} aria-labelledby={`grp-${group.key}`}>
                        <h2
                          id={`grp-${group.key}`}
                          className="sticky top-0 z-10 bg-stakerpol-navy text-white text-sm font-bold px-4 py-2 rounded-t-md"
                        >
                          {group.label} · {group.rows.length}
                        </h2>
                        <div className="overflow-x-auto bg-white border border-gray-200 border-t-0 rounded-b-md">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100 text-gray-800">
                                {EXPORT_COLUMNS.map((c) => (
                                  <th
                                    key={c.key}
                                    scope="col"
                                    className={cn(
                                      'px-3 py-2 font-semibold whitespace-nowrap',
                                      c.align === 'right'
                                        ? 'text-right'
                                        : c.align === 'center'
                                        ? 'text-center'
                                        : 'text-left'
                                    )}
                                  >
                                    {c.header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {group.rows.map((row) => (
                                <tr key={row.productId} className="border-t border-gray-200">
                                  <td className="px-3 py-2 text-center text-gray-700">{row.index}</td>
                                  <th scope="row" className="px-3 py-2 text-left font-semibold text-stakerpol-navy">
                                    {row.model}
                                  </th>
                                  <td className="px-3 py-2 text-center">{row.serialNumber}</td>
                                  <td className="px-3 py-2 text-center">{row.productionYear}</td>
                                  <td className="px-3 py-2 text-center">{row.workingHours}</td>
                                  <td className="px-3 py-2 text-center">{row.mastLiftingCapacity}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                      <ArrowUpFromLine aria-hidden="true" className="h-3.5 w-3.5 text-stakerpol-navy" />
                                      {row.liftHeight || '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                      <MoveVertical aria-hidden="true" className="h-3.5 w-3.5 text-stakerpol-navy" />
                                      {row.minHeight || '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">{row.mast}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                      <BatteryCharging aria-hidden="true" className="h-3.5 w-3.5 text-stakerpol-navy" />
                                      {row.battery || '—'}
                                    </span>
                                  </td>

                                  <td className="px-3 py-2 text-center">
                                    <StatusTag value={row.availability} />
                                  </td>
                                  <td className="px-3 py-2 text-right" colSpan={2}>
                                    <PriceCell
                                      showPrice={row.showPrice}
                                      netPrice={row.netPrice}
                                      currency={row.priceCurrency}
                                      onInquiry={() => openInquiry(row.productId)}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <a
                                      href={row.productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-stakerpol-navy underline focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
                                    >
                                      Karta produktu
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))}
                  </div>

                  {/* Mobile: niskie wiersze scalone z nagłówkiem grupy */}
                  <div className="md:hidden space-y-6 pb-[calc(72px+env(safe-area-inset-bottom))]">
                    {sortedGroups.map((group) => {
                      const common = group.common;
                      const commonKeys = COMMON_PARAM_KEYS.filter((k) => common[k]);
                      return (
                      <section
                        key={group.key}
                        aria-labelledby={`grpm-${group.key}`}
                      >
                        <h2
                          id={`grpm-${group.key}`}
                          className="sticky z-20 bg-stakerpol-navy text-white px-3 py-2 rounded-t-md"
                          style={{ top: hideFilterBar ? 0 : STICKY_GROUP_TOP }}
                        >
                          <span className="block text-sm font-bold">
                            {group.label} · {group.rows.length}
                          </span>
                          {commonKeys.length > 0 && (
                            <span className="block mt-1 text-[11px] font-medium text-white/85">
                              {commonKeys
                                .map((k) => `${COMMON_PARAM_LABELS[k]}: ${common[k]}`)
                                .join(' · ')}
                            </span>
                          )}
                        </h2>
                        <div className="divide-y divide-gray-200 bg-white border border-t-0 border-gray-200 rounded-b-md">
                          {group.rows.map((row) => {
                            const tileKeys = ['minHeight', 'liftHeight', 'battery'] as const;
                            const tiles = [
                              { key: 'minHeight', Icon: MoveVertical, label: 'Wys. konstr.' },
                              { key: 'liftHeight', Icon: ArrowUpFromLine, label: 'Podnoszenie' },
                              { key: 'battery', Icon: BatteryCharging, label: 'Bateria' },
                            ].filter((t) => !common[t.key as (typeof tileKeys)[number]]);

                            const mainLine = [
                              row.productionYear ? String(row.productionYear) : null,
                              row.serialNumber ? row.serialNumber : null,
                              row.workingHours ? `${row.workingHours} mth` : null,
                              ...COMMON_PARAM_KEYS.filter(
                                (k) => !common[k] && !(tileKeys as readonly string[]).includes(k)
                              ).map((k) => {
                                const v = String(row[k] ?? '').trim();
                                return v && v !== '—' ? v : null;
                              }),
                            ].filter(Boolean) as string[];

                            return (
                              <article key={row.productId} className="px-3 py-2">
                                <div className="flex items-center justify-between gap-2 text-sm text-stakerpol-navy">
                                  <p className="min-w-0">
                                    <span className="font-bold">{row.index}.</span>{' '}
                                    <span>{mainLine.join(' · ')}</span>
                                  </p>
                                  <a
                                    href={row.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex shrink-0 items-center gap-1 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
                                  >
                                    Zdjęcia
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                                {tiles.length > 0 && (
                                  <div className="mt-1.5 pl-5 grid grid-cols-3 gap-x-2">
                                    {tiles.map((t) => (
                                      <SpecIconTile
                                        key={t.key}
                                        Icon={t.Icon}
                                        label={t.label}
                                        value={row[t.key as (typeof tileKeys)[number]]}
                                      />
                                    ))}
                                  </div>
                                )}
                                <div className="mt-1.5 pl-5 flex items-center justify-end gap-2 text-xs text-gray-700">
                                  <StatusTag value={row.availability} />
                                  <PriceCellMobile
                                    showPrice={row.showPrice}
                                    netPrice={row.netPrice}
                                    currency={row.priceCurrency}
                                    onInquiry={() => openInquiry(row.productId)}
                                  />
                                </div>
                              </article>
                            );

                          })}
                        </div>
                      </section>
                      );
                    })}
                  </div>


                </>
              )}
            </>
          )}
        </main>

        {inquiryProduct && (
          <PriceInquiryModal
            isOpen={!!inquiryProduct}
            onClose={() => setInquiryProduct(null)}
            product={inquiryProduct}
          />
        )}

        {photoMode && photoRows.length > 0 && (
          <OfferPhotoBrowser
            rows={photoRows}
            imageById={imageById}
            onClose={() => setPhotoMode(false)}
          />
        )}


        {barInquiryOpen && (
          <PriceInquiryModal isOpen onClose={() => setBarInquiryOpen(false)} />
        )}

        {/* Pasek kontaktowy — ten sam komponent co na podstronie produktu */}
        <ProductStickyBar variant="fixed" onInquiryClick={() => setBarInquiryOpen(true)} />

        <FloatingContactBubble />
      </div>
    </>
  );
};

export default SharedOffer;
