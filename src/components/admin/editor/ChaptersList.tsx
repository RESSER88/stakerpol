import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChapterStatus } from './useChapterCompletion';

interface Props {
  chapters: ChapterStatus[];
  active: number;
  onSelect: (id: number) => void;
}

const ChaptersList = ({ chapters, active, onSelect }: Props) => {
  return (
    <nav className="border-t border-editorial-line">
      {chapters.map((c) => {
        const isActive = c.id === active;
        const disabled = !c.enabled;
        return (
          <button
            key={c.id}
            onClick={() => c.enabled && onSelect(c.id)}
            disabled={disabled}
            title={disabled ? 'Najpierw zapisz dane podstawowe (rozdział 02)' : undefined}
            className={cn(
              'w-full flex items-center gap-3 py-4 px-3 border-b border-editorial-line text-left transition-colors',
              isActive && 'bg-editorial-line/40',
              !isActive && c.enabled && 'hover:bg-editorial-line/20',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'text-[10px] font-bold tracking-[0.2em] w-7 shrink-0',
                isActive ? 'text-editorial-accent' : 'text-editorial-muted'
              )}
            >
              {c.number}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'font-editorial text-sm',
                  isActive ? 'text-editorial-ink' : 'text-editorial-ink/80'
                )}
              >
                {c.title}
              </div>
              <div className="text-[11px] text-editorial-muted truncate">{c.description}</div>
            </div>
            <span className="shrink-0 w-4 h-4 flex items-center justify-center">
              {disabled ? (
                <Lock className="h-3 w-3 text-editorial-muted" />
              ) : c.complete ? (
                <Check className="h-3.5 w-3.5 text-editorial-ok" strokeWidth={2.5} />
              ) : (
                <span className="h-2 w-2 rounded-full border border-editorial-muted" />
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default ChaptersList;
