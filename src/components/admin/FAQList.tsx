import React from 'react';
import { Pencil, Power, PowerOff, Trash2, Plus } from 'lucide-react';
import { FAQ } from '@/hooks/useSupabaseFAQ';

interface FAQListProps {
  faqs: FAQ[];
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => void;
  onHardDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onAdd: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  loading: boolean;
}

const LANGS = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'pl', label: 'PL' },
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
  { value: 'cs', label: 'CS' },
  { value: 'sk', label: 'SK' },
];

const FAQList: React.FC<FAQListProps> = ({
  faqs,
  onEdit,
  onHardDelete,
  onToggleActive,
  onAdd,
  selectedLanguage,
  onLanguageChange,
  loading,
}) => {
  const filtered = selectedLanguage === 'all'
    ? faqs
    : faqs.filter(f => f.language === selectedLanguage);

  if (loading) {
    return <div className="text-center py-12 text-editorial-muted text-sm italic">Ładowanie…</div>;
  }

  return (
    <div>
      {/* Filters bar */}
      <div className="flex items-center gap-1 border-b border-editorial-line pb-3 mb-1">
        {LANGS.map(l => (
          <button
            key={l.value}
            onClick={() => onLanguageChange(l.value)}
            className={`px-2.5 py-1 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors ${
              selectedLanguage === l.value
                ? 'text-editorial-ink border-b border-editorial-accent -mb-[1px]'
                : 'text-editorial-muted hover:text-editorial-ink'
            }`}
          >
            {l.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-editorial-muted italic">
          {filtered.length} z {faqs.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-editorial-muted text-sm italic">
          Brak pytań w tej kategorii
        </div>
      ) : (
        <ul>
          {filtered.map((faq, idx) => {
            const num = String(idx + 1).padStart(3, '0');
            return (
              <li
                key={faq.id}
                className={`group flex items-start gap-4 py-4 border-b border-editorial-line transition-colors hover:bg-editorial-line/20 ${
                  !faq.is_active ? 'opacity-60' : ''
                }`}
              >
                <span className="text-[10px] font-bold tracking-[0.2em] text-editorial-accent shrink-0 w-10 pt-1">
                  {num}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-[15px] leading-snug text-editorial-ink"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {faq.question}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-editorial-muted">
                    <span className="uppercase tracking-wider">{faq.language}</span>
                    <span>·</span>
                    <span>kolejność {faq.display_order}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          faq.is_active ? 'bg-editorial-ok' : 'bg-editorial-muted/50'
                        }`}
                      />
                      {faq.is_active ? 'Aktywne' : 'Nieaktywne'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onToggleActive(faq.id, !faq.is_active)}
                    className="p-1.5 text-editorial-muted hover:text-editorial-ink hover:bg-editorial-line/40 transition-colors"
                    title={faq.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                  >
                    {faq.is_active
                      ? <PowerOff className="h-3.5 w-3.5" />
                      : <Power className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => onEdit(faq)}
                    className="p-1.5 text-editorial-muted hover:text-editorial-ink hover:bg-editorial-line/40 transition-colors"
                    title="Edytuj"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onHardDelete(faq.id)}
                    className="p-1.5 text-editorial-muted hover:text-editorial-bad hover:bg-editorial-line/40 transition-colors"
                    title="Usuń trwale"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold tracking-[0.2em] uppercase text-editorial-ink border border-editorial-line hover:border-editorial-ink transition-colors"
        >
          <Plus className="h-3 w-3" />
          Dodaj FAQ
        </button>
      </div>
    </div>
  );
};

export default FAQList;
