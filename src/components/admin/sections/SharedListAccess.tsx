import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, Ban, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ExportFilterCriteria } from '@/utils/exportFilterCriteria';
import { SITE_URL, ROUTES } from '@/config/routes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  criteria: ExportFilterCriteria;
  matchedCount: number;
}

interface SharedLinkRow {
  id: string;
  token: string;
  label: string | null;
  expires_at: string;
  view_count: number;
}

const WEEK_OPTIONS = [1, 2, 3, 4] as const;

/** Alfabet bez znaków mylących: brak l, I, O oraz 0 i 1. */
const SUFFIX_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const SUFFIX_LENGTH = 6;
const MAX_TOKEN_ATTEMPTS = 5;

const DIACRITICS: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

/** Sprowadza opis do bezpiecznej podstawy tokenu (max 20 znaków). */
const slugifyLabel = (raw: string): string => {
  const base = raw
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => DIACRITICS[ch] ?? ch)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20)
    .replace(/-$/, '');
  return base || 'oferta';
};

/** Losowy przyrostek z CSPRNG. */
const randomSuffix = (): string => {
  const bytes = new Uint8Array(SUFFIX_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SUFFIX_ALPHABET[b % SUFFIX_ALPHABET.length]).join('');
};

const buildToken = (label: string): string => `${slugifyLabel(label)}-${randomSuffix()}`;

const buildUrl = (token: string) =>
  `${SITE_URL}${ROUTES.sharedOffer.replace(':token', token)}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const SharedListAccess = ({ criteria, matchedCount }: Props) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [weeks, setWeeks] = useState<number>(2);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState<SharedLinkRow[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<SharedLinkRow | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadLinks = useCallback(async () => {
    setLoadingLinks(true);
    const { data, error } = await supabase
      .from('shared_lists')
      .select('id, token, label, expires_at, view_count')
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) {
      toast({
        title: 'Błąd odczytu',
        description: 'Nie udało się pobrać listy aktywnych linków',
        variant: 'destructive',
      });
    } else {
      setLinks(data ?? []);
    }
    setLoadingLinks(false);
  }, [toast]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: '✓ Skopiowano', description: 'Adres linku jest w schowku' });
    } catch {
      toast({ title: 'Błąd', description: 'Nie udało się skopiować adresu', variant: 'destructive' });
    }
  };

  const handleGenerate = async () => {
    if (saving || matchedCount === 0) return;
    if (!user) {
      toast({ title: 'Brak sesji', description: 'Zaloguj się ponownie', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const labelValue = label.trim();
    const expiresAt = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      let token = '';
      let lastError: unknown = null;
      for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++) {
        const candidate = buildToken(labelValue);
        const { error } = await supabase.from('shared_lists').insert([
          {
            token: candidate,
            filters: JSON.parse(JSON.stringify(criteria)),
            label: labelValue || null,
            created_by: user.id,
            expires_at: expiresAt,
          },
        ]);
        if (!error) {
          token = candidate;
          lastError = null;
          break;
        }
        lastError = error;
        // 23505 = naruszenie unikalności → ponów z nowym przyrostkiem
        if ((error as { code?: string }).code !== '23505') break;
      }
      if (!token) {
        if (lastError && (lastError as { code?: string }).code === '23505') {
          toast({
            title: 'Nie udało się nadać adresu',
            description: 'Zbyt wiele powtórzeń adresu. Zmień opis linku i spróbuj ponownie.',
            variant: 'destructive',
          });
          return;
        }
        throw lastError;
      }
      const url = buildUrl(token);
      setLastUrl(url);
      setLabel('');
      toast({
        title: '✓ Link wygenerowany',
        description: `Ważny do ${formatDate(expiresAt)} · ${matchedCount} ${
          matchedCount === 1 ? 'pozycja' : 'pozycji'
        }`,
      });
      await loadLinks();
    } catch {
      toast({
        title: 'Błąd zapisu',
        description: 'Nie udało się wygenerować linku',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const { error } = await supabase
      .from('shared_lists')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', revokeTarget.id);
    setRevoking(false);
    if (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zatrzymać dostępu',
        variant: 'destructive',
      });
      return;
    }
    if (lastUrl && lastUrl.endsWith(revokeTarget.token)) setLastUrl(null);
    setRevokeTarget(null);
    toast({ title: '✓ Dostęp zatrzymany', description: 'Link nie jest już aktywny' });
    await loadLinks();
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={saving || matchedCount === 0}
        className="group w-full flex items-center gap-6 py-6 border-b border-editorial-line text-left transition-colors hover:bg-editorial-line/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span className="text-xs font-bold tracking-[0.2em] text-editorial-accent w-8 shrink-0">
          04
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-editorial text-base text-editorial-ink">Generuj dostęp online</div>
          <div className="text-xs text-editorial-muted mt-0.5 tracking-wide">
            Czasowy link do listy online · {matchedCount}{' '}
            {matchedCount === 1 ? 'pozycja' : 'pozycji'}
          </div>
        </div>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-editorial-muted shrink-0" />
        ) : (
          <ArrowRight className="h-4 w-4 text-editorial-muted shrink-0 transition-transform group-hover:translate-x-1" />
        )}
      </button>

      <div className="pl-0 sm:pl-14 pt-5 pb-6 space-y-4 border-b border-editorial-line">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-editorial-muted mb-2">
            Okres ważności
          </label>
          <div className="flex flex-wrap gap-2">
            {WEEK_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeeks(w)}
                className={`px-3 py-2 text-xs border transition-colors ${
                  weeks === w
                    ? 'border-editorial-ink bg-editorial-ink text-background'
                    : 'border-editorial-line text-editorial-muted hover:border-editorial-ink'
                }`}
              >
                {w} {w === 1 ? 'tydzień' : 'tygodnie'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="shared-list-label"
            className="block text-[11px] uppercase tracking-wider text-editorial-muted mb-2"
          >
            Opis linku (opcjonalnie)
          </label>
          <input
            id="shared-list-label"
            value={label}
            onChange={(e) => setLabel(e.target.value.slice(0, 120))}
            placeholder="Nazwa klienta lub firmy"
            className="w-full bg-transparent border-b border-editorial-line py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none focus:border-editorial-ink"
          />
        </div>

        {matchedCount === 0 && (
          <p className="text-xs text-editorial-muted italic">
            Nie można wygenerować linku — filtr nie zwraca żadnej pozycji.
          </p>
        )}

        {lastUrl && (
          <div className="border border-editorial-line p-3">
            <div className="text-[11px] uppercase tracking-wider text-editorial-muted mb-2">
              Wygenerowany adres
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 text-xs text-editorial-ink break-all">{lastUrl}</code>
              <button
                type="button"
                onClick={() => copy(lastUrl)}
                aria-label="Kopiuj adres linku"
                className="shrink-0 p-2 border border-editorial-line hover:border-editorial-ink"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>


      <div className="mt-8">
        <div className="text-xs font-bold tracking-[0.15em] uppercase text-editorial-muted mb-3">
          Aktywne linki
        </div>
        {loadingLinks ? (
          <Loader2 className="h-4 w-4 animate-spin text-editorial-muted" />
        ) : links.length === 0 ? (
          <p className="text-xs text-editorial-muted italic">Brak aktywnych linków.</p>
        ) : (
          <ul className="border-t border-editorial-line">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center gap-3 py-4 border-b border-editorial-line"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-editorial-ink truncate">
                    {link.label || 'Bez opisu'}
                  </div>
                  <div className="text-[11px] text-editorial-muted mt-0.5 tracking-wide">
                    do {formatDate(link.expires_at)} · {link.view_count}{' '}
                    {link.view_count === 1 ? 'otwarcie' : 'otwarć'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copy(buildUrl(link.token))}
                    aria-label="Kopiuj adres linku"
                    className="p-2 border border-editorial-line hover:border-editorial-ink"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(link)}
                    className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-muted hover:border-destructive hover:text-destructive"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Zatrzymaj dostęp
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zatrzymać dostęp?</AlertDialogTitle>
            <AlertDialogDescription>
              Link {revokeTarget?.label ? `„${revokeTarget.label}” ` : ''}przestanie działać
              natychmiast. Operacji nie da się cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRevoke();
              }}
              disabled={revoking}
            >
              Zatrzymaj dostęp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SharedListAccess;
