import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, MapPin, SlidersHorizontal, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

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
}: {
  showPrice: boolean;
  netPrice: number;
  currency: string;
}) =>
  showPrice ? (
    <span className="font-semibold text-stakerpol-navy whitespace-nowrap">
      {formatPrice(netPrice)} {currency}
    </span>
  ) : (
    <span className="text-gray-700">Cena na zapytanie — skontaktuj się z nami</span>
  );

const SharedOffer = () => {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<LinkState>({ status: 'loading' });
  const [viewerFilters, setViewerFilters] = useState<ViewerFilterState>(EMPTY_VIEWER_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fetchedAt] = useState(() => new Date());

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
              {/* Filtry */}
              <div className="mb-6">
                <div className="md:hidden">
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger className="inline-flex items-center gap-2 border border-gray-300 rounded-md px-4 h-11 text-sm font-semibold text-stakerpol-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange">
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
                </div>
                <details className="hidden md:block bg-white border border-gray-200 rounded-md">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-stakerpol-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange">
                    Filtry listy
                  </summary>
                  <div className="px-4 pb-5 pt-2 border-t border-gray-200">
                    <SharedOfferFilters
                      scope={scope}
                      value={viewerFilters}
                      onChange={setViewerFilters}
                    />
                  </div>
                </details>
              </div>

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
                  <p className="text-sm text-gray-700 mb-4">{model.summary}</p>

                  {/* Desktop: tabela */}
                  <div className="hidden md:block space-y-8">
                    {model.groups.map((group) => (
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
                                  <td className="px-3 py-2 text-center">{row.liftHeight}</td>
                                  <td className="px-3 py-2 text-center">{row.mast}</td>
                                  <td className="px-3 py-2 text-center">{row.battery}</td>
                                  <td className="px-3 py-2 text-center">
                                    <StatusTag value={row.availability} />
                                  </td>
                                  <td className="px-3 py-2 text-right" colSpan={2}>
                                    <PriceCell
                                      showPrice={row.showPrice}
                                      netPrice={row.netPrice}
                                      currency={row.priceCurrency}
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

                  {/* Mobile: karty */}
                  <div className="md:hidden space-y-6">
                    {model.groups.map((group) => (
                      <section key={group.key} aria-labelledby={`grpm-${group.key}`}>
                        <h2
                          id={`grpm-${group.key}`}
                          className="sticky top-0 z-10 bg-stakerpol-navy text-white text-sm font-bold px-3 py-2 rounded-md"
                        >
                          {group.label} · {group.rows.length}
                        </h2>
                        <div className="mt-3 space-y-3">
                          {group.rows.map((row) => (
                            <article
                              key={row.productId}
                              className="bg-white border border-gray-200 rounded-md p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-bold text-stakerpol-navy">
                                    {row.index}. {row.model}
                                  </h3>
                                  <p className="text-xs text-gray-700">
                                    Nr seryjny: {row.serialNumber || '—'}
                                  </p>
                                </div>
                                <StatusTag value={row.availability} />
                              </div>

                              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs">
                                <div>
                                  <dt className="text-gray-700">Rok</dt>
                                  <dd className="font-medium">{row.productionYear || '—'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-700">Motogodziny</dt>
                                  <dd className="font-medium">{row.workingHours || '—'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-700">Udźwig</dt>
                                  <dd className="font-medium">{row.mastLiftingCapacity || '—'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-700">Podnoszenie</dt>
                                  <dd className="font-medium">{row.liftHeight || '—'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-700">Maszt</dt>
                                  <dd className="font-medium">{row.mast}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-700">Bateria</dt>
                                  <dd className="font-medium">{row.battery}</dd>
                                </div>
                              </dl>

                              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between gap-3">
                                <div className="text-sm">
                                  <PriceCell
                                    showPrice={row.showPrice}
                                    netPrice={row.netPrice}
                                    currency={row.priceCurrency}
                                  />
                                </div>
                                <a
                                  href={row.productUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 inline-flex items-center gap-1 text-xs text-stakerpol-navy underline focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
                                >
                                  Karta
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>

        <FloatingContactBubble />
      </div>
    </>
  );
};

export default SharedOffer;
