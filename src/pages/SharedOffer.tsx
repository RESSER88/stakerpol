import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowDown, ArrowUp, ArrowUpFromLine, BatteryCharging, Calendar, ChevronRight, Clock, Image as ImageIcon, Info, LayoutGrid, List as ListIcon, Mail, MapPin, MoveVertical, Package, Phone, ShoppingCart, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import OfferPhotoListCard from '@/components/shared-offer/OfferPhotoListCard';
import OfferOrderSheet from '@/components/shared-offer/OfferOrderSheet';


import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { COMPANY_PHONE_TEL } from '@/lib/contact';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import { useScrollState } from '@/hooks/useScrollDirection';
import {
  getGroupCommonParams,
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

/** Miniatura pierwszego zdjęcia produktu w widoku listy. */
const Thumb = ({ src, className }: { src?: string; className?: string }) =>
  src ? (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={cn('shrink-0 rounded-md object-cover bg-gray-100', className)}
      draggable={false}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 rounded-md bg-gray-100 inline-flex items-center justify-center text-gray-300',
        className
      )}
    >
      <ImageIcon className="h-4 w-4" />
    </span>
  );

/** Status pokazujemy tylko wtedy, gdy wymaga uwagi klienta. */
const StatusTag = ({ value }: { value: string }) => {
  if (value === 'Dostępny') return null;
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

const displayMobilePrice = (showPrice: boolean, netPrice: number, currency: string) => {
  if (!showPrice) return 'Cena na zapytanie';
  const label = currency === 'PLN' ? 'zł' : currency;
  return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(netPrice)} ${label}`;
};

const displayMobileMetric = (value: string) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === '—' || normalized === '-') return null;
  const spaced = normalized
    .replace('.', ',')
    .replace(/(\d)(kg|m|Ah)\b/i, '$1 $2');
  const unitMatch = spaced.match(/^(\d+)\s*(kg|Ah)$/i);
  if (unitMatch) {
    return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(Number(unitMatch[1]))} ${unitMatch[2]}`;
  }
  return spaced;
};

const availableUnitsLabel = (count: number) => {
  if (count === 1) return '1 dostępna sztuka';
  if (count >= 2 && count <= 4) return `${count} dostępne sztuki`;
  return `${count} dostępnych sztuk`;
};

const MobileListSpec = ({
  Icon,
  label,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  value?: string | null;
}) => (
  <div className="flex min-w-0 items-start gap-1.5">
    <Icon aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stakerpol-navy/60" />
    <span className="min-w-0 leading-tight">
      <span className="block truncate text-[8px] font-medium text-gray-500 min-[390px]:text-[9px]">{label}</span>
      <span className="mt-0.5 block whitespace-nowrap text-[11px] font-semibold text-stakerpol-navy min-[390px]:text-xs">
        {value || '—'}
      </span>
    </span>
  </div>
);

const MobileAvailability = ({ value }: { value: string }) => {
  const dotTone =
    value === 'Dostępny'
      ? 'bg-green-500'
      : value === 'Zarezerwowany'
      ? 'bg-amber-500'
      : 'bg-gray-400';

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-gray-600">
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotTone)} />
      <span className="truncate">{value}</span>
    </span>
  );
};

const formatMobileHours = (value: string | number) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(numeric)} mth`;
  }
  const text = String(value || '').trim();
  return text ? `${text} mth` : '—';
};


const SharedOffer = () => {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<LinkState>({ status: 'loading' });
  const [viewerFilters, setViewerFilters] = useState<ViewerFilterState>(EMPTY_VIEWER_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fetchedAt] = useState(() => new Date());
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT);
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'photo'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'photo' : 'list'
  );
  const [activeOrderProductId, setActiveOrderProductId] = useState<string | null>(null);
  const [orderProductId, setOrderProductId] = useState<string | null>(null);
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

  const orderRow = useMemo(
    () => photoRows.find((row) => row.productId === orderProductId) ?? null,
    [orderProductId, photoRows]
  );

  const activeOrderRow = useMemo(
    () => photoRows.find((row) => row.productId === activeOrderProductId) ?? photoRows[0],
    [activeOrderProductId, photoRows]
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

  useEffect(() => {
    const el = stickySentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setFilterBarPinned(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isLoading]);

  useEffect(() => {
    if (viewMode !== 'photo' || typeof IntersectionObserver === 'undefined') return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-offer-product-id]'));
    if (!cards.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = (visibleEntries[0]?.target as HTMLElement | undefined)?.dataset.offerProductId;
        if (id) setActiveOrderProductId(id);
      },
      { threshold: [0.3, 0.55, 0.8], rootMargin: '-20% 0px -35% 0px' }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [viewMode, photoRows]);

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
        {/* Nagłówek — zwarty */}
        <header className="bg-stakerpol-navy text-white">
          <div className="container-custom px-4 md:px-8 py-3 md:py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-5">
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                aria-expanded={detailsOpen}
                className="text-left inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange rounded-sm"
              >
                <h1 className="text-lg md:text-xl font-bold">{COMPANY.name}</h1>
                <Info className="h-4 w-4 text-white/70 shrink-0" />
              </button>
              <a
                href={WAREHOUSE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-md px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="font-semibold truncate">{WAREHOUSE.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto shrink-0 text-white/70" />
              </a>
            </div>
            {detailsOpen && (
              <div className="mt-2 text-xs text-white/80 space-y-0.5">
                <p>{COMPANY.tagline}</p>
                <p>
                  {COMPANY.person} · {COMPANY.address}
                </p>
                <p>
                  {COMPANY.email} · {COMPANY.site}
                </p>
                <p>{WAREHOUSE.address}</p>
                <p>
                  Dane pobrane {formatDateTime(fetchedAt)}. Lista jest odczytywana na żywo, więc
                  jej zawartość może różnić się od wcześniej przesłanego pliku.
                </p>
              </div>
            )}
          </div>
        </header>

        <main className="container-custom px-4 md:px-8 py-4 md:py-8">
          {/* Status danych — jedna linijka */}
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
            className="mb-3 inline-flex items-center gap-2 text-xs text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange rounded-sm"
          >
            <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
            <span>
              Dane na żywo
              {link.status === 'ok' && <> · ważne do {formatDate(link.expiresAt)}</>}
            </span>
            <Info className="h-3.5 w-3.5 text-gray-500" />
          </button>

          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-700 py-16 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Ładowanie listy…
            </div>
          ) : (
            <>
              {/* Punkt odniesienia — pasek uznajemy za przyklejony dopiero po jego minięciu */}
              <div ref={stickySentinelRef} aria-hidden="true" className="md:hidden h-px" />

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
                     <p className="text-sm text-gray-700">
                       <span className="md:hidden">{model.total} maszyn · {model.availableCount} dostępne</span>
                       <span className="hidden md:inline">{model.summary}</span>
                     </p>
                    <div
                      role="group"
                      aria-label="Tryb prezentacji listy"
                       className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1"
                    >
                      <button
                        type="button"
                        aria-label="Widok zdjęciowy"
                        aria-pressed={viewMode === 'photo'}
                        onClick={() => setViewMode('photo')}
                        className={cn(
                           'inline-flex h-9 items-center justify-center gap-1.5 rounded px-2.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange md:w-9 md:px-0',
                          viewMode === 'photo'
                            ? 'bg-stakerpol-navy text-white'
                            : 'text-stakerpol-navy'
                        )}
                      >
                        <LayoutGrid className="h-4 w-4" />
                         <span className="md:hidden">Zdjęcia</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Widok listy"
                        aria-pressed={viewMode === 'list'}
                        onClick={() => setViewMode('list')}
                        className={cn(
                           'inline-flex h-9 items-center justify-center gap-1.5 rounded px-2.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange md:w-9 md:px-0',
                          viewMode === 'list'
                            ? 'bg-stakerpol-navy text-white'
                            : 'text-stakerpol-navy'
                        )}
                      >
                        <ListIcon className="h-4 w-4" />
                         <span className="md:hidden">Lista</span>
                      </button>
                    </div>
                  </div>


                  {viewMode === 'photo' && (
                    <div className="space-y-6 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                      {photoRows.map((row, i) => (
                        <OfferPhotoListCard
                          key={row.productId}
                          row={row}
                          images={imageById.get(row.productId) ?? []}
                          eager={i < 2}
                           onActivate={() => setActiveOrderProductId(row.productId)}
                          onOrder={() => setOrderProductId(row.productId)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Desktop: tabela */}
                  <div className={cn('md:block space-y-8', viewMode === 'photo' ? 'hidden md:hidden' : 'hidden')}>
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
                                    <span className="inline-flex items-center gap-2">
                                      <Thumb src={imageById.get(row.productId)?.[0]} className="h-11 w-11" />
                                      {row.model}
                                    </span>
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
                                      aria-label="Karta produktu"
                                      title="Karta produktu"
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stakerpol-navy/10 text-stakerpol-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
                                    >
                                      <ChevronRight className="h-4 w-4" />
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

                  {/* Mobile: lekka lista handlowa pogrupowana według modeli */}
                  <div className={cn('md:hidden space-y-6 pb-[calc(72px+env(safe-area-inset-bottom))]', viewMode === 'photo' && 'hidden')}>
                    {sortedGroups.map((group) => {
                      const availableInGroup = group.rows.filter((row) => row.availability === 'Dostępny').length;
                      return (
                      <section
                        key={group.key}
                        aria-labelledby={`grpm-${group.key}`}
                      >
                        <div
                          id={`grpm-${group.key}`}
                          className="mb-2 border-b border-gray-200 pb-2"
                        >
                          <h2 className="text-base font-bold text-stakerpol-navy">{group.label}</h2>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {availableUnitsLabel(availableInGroup)}
                          </p>
                        </div>
                        <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
                          {group.rows.map((row) => {
                            const product = productById.get(row.productId);
                            const description =
                              product?.shortDescription?.trim() ||
                              product?.shortMarketingDescription?.trim() ||
                              product?.aboutDescription?.trim() ||
                              '';
                            const images = imageById.get(row.productId) ?? [];
                            const productName = product?.model?.trim() || row.model;

                            return (
                              <article key={row.productId} className="py-3">
                                <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)_76px] gap-2.5 min-[390px]:grid-cols-[90px_minmax(0,1fr)_82px]">
                                  <a
                                    href={row.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    className="relative h-[86px] w-[86px] overflow-hidden rounded-md bg-gray-100 min-[390px]:h-[90px] min-[390px]:w-[90px]"
                                  >
                                    <Thumb src={images[0]} className="h-full w-full object-contain" />
                                    {images.length > 1 && (
                                      <span className="absolute bottom-1 left-1 rounded bg-stakerpol-navy/85 px-1.5 py-0.5 text-[8px] font-semibold text-white">
                                        {images.length} zdjęć
                                      </span>
                                    )}
                                  </a>

                                  <div className="min-w-0">
                                    <a
                                      href={row.productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`Karta produktu ${productName}`}
                                      onPointerDown={() => setActiveOrderProductId(row.productId)}
                                      className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
                                    >
                                      <h3 className="truncate text-[17px] font-bold leading-tight text-stakerpol-navy min-[390px]:text-lg">
                                        {productName}
                                      </h3>
                                      {description && (
                                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-[1.25] text-gray-600">
                                          {description}
                                        </p>
                                      )}
                                    </a>

                                    <a
                                      href={row.productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`Parametry ${productName}`}
                                      onPointerDown={() => setActiveOrderProductId(row.productId)}
                                      className="mt-1.5 grid grid-cols-2 gap-x-1.5 gap-y-1.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange min-[390px]:gap-x-2"
                                    >
                                      <MobileListSpec Icon={Calendar} label="Rok" value={row.productionYear || '—'} />
                                      <MobileListSpec Icon={Clock} label="Motogodziny" value={formatMobileHours(row.workingHours)} />
                                      <MobileListSpec Icon={Package} label="Udźwig" value={displayMobileMetric(row.mastLiftingCapacity) || '—'} />
                                      <MobileListSpec Icon={ArrowUpFromLine} label="Podnoszenie" value={displayMobileMetric(row.liftHeight) || '—'} />
                                      <MobileListSpec Icon={MoveVertical} label="Konstrukcyjna" value={displayMobileMetric(row.minHeight) || '—'} />
                                      <MobileListSpec Icon={BatteryCharging} label="Bateria" value={displayMobileMetric(row.battery) || '—'} />
                                    </a>

                                    <div className="mt-1.5">
                                      <MobileAvailability value={row.availability} />
                                    </div>
                                  </div>

                                  <div className="flex min-w-0 flex-col items-end justify-between gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      onClick={() => setOrderProductId(row.productId)}
                                      aria-label={`Zamawiam ${row.model}${row.serialNumber ? ` nr ${row.serialNumber}` : ''}`}
                                      className="h-10 w-10 shrink-0 rounded-full bg-stakerpol-orange text-white hover:bg-stakerpol-orange/90 focus-visible:ring-stakerpol-navy"
                                    >
                                      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                    <span className="shrink-0 text-right">
                                      <span className={cn('block font-bold leading-tight text-stakerpol-navy', row.showPrice ? 'text-[15px] min-[390px]:text-base' : 'max-w-[76px] text-[10px] leading-tight min-[390px]:max-w-[82px]')}>
                                        {displayMobilePrice(row.showPrice, row.netPrice, row.priceCurrency)}
                                      </span>
                                      {row.showPrice && <span className="mt-0.5 block text-[9px] leading-none text-gray-500">netto</span>}
                                    </span>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                      );
                    })}
                  </div>

                  {/* Adnotacja prawna — na końcu listy tekstowej */}
                   <p className={cn('mt-8 pt-4 border-t border-gray-200 text-[12px] leading-relaxed text-gray-500 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0', viewMode === 'photo' && 'hidden')}>
                    Prezentowana oferta ma charakter poglądowy. Dostępność towaru oraz podana cena
                    są gwarantowane wyłącznie po bezpośrednim kontakcie ze Sprzedającym i
                    indywidualnym potwierdzeniu warunków. Zgłoszenie lub rezerwacja bez takiego
                    potwierdzenia nie stanowi zobowiązania cenowego ani magazynowego.
                  </p>
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

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.15)] md:hidden">
          <div className={cn('grid gap-2', viewMode === 'photo' ? 'grid-cols-[0.8fr_1.2fr]' : 'grid-cols-1')}>
            <Button asChild variant="outline" className="min-h-[48px] border-stakerpol-navy text-stakerpol-navy">
              <a href={`tel:${COMPANY_PHONE_TEL}`}>
                <Phone aria-hidden="true" />
                Zadzwoń
              </a>
            </Button>
            {viewMode === 'photo' && (
              <Button
                type="button"
                onClick={() => activeOrderRow && setOrderProductId(activeOrderRow.productId)}
                className="min-h-[48px] bg-stakerpol-orange font-bold text-white hover:bg-stakerpol-orange/90"
              >
                <ShoppingCart aria-hidden="true" />
                Zamawiam
              </Button>
            )}
          </div>
        </div>

        <OfferOrderSheet
          row={orderRow}
          image={orderRow ? imageById.get(orderRow.productId)?.[0] : undefined}
          onClose={() => setOrderProductId(null)}
        />

        <FloatingContactBubble />
      </div>
    </>
  );
};

export default SharedOffer;
