import { LogOut, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminSections, sectionNumber, type AdminSection } from './types';
import { useNewLeadsCount } from '@/hooks/useNewLeadsCount';
import PulseDot from '../editorial/PulseDot';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const AdminSidebar = ({ active, onChange, onSignOut, isDark, onToggleTheme }: Props) => {
  const { count: newLeadsCount } = useNewLeadsCount();

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-editorial-bg border-r border-editorial-line flex-col z-40">
      <div className="px-8 py-8 border-b border-editorial-line">
        <button
          type="button"
          onClick={() => onChange('start')}
          className="text-left block group"
          aria-label="Przejdź do panelu startowego"
        >
          <div className="text-[10px] font-bold tracking-[0.25em] text-editorial-muted group-hover:text-editorial-accent transition-colors">
            STAKERPOL
          </div>
          <div className="font-editorial text-xl text-editorial-ink mt-1 group-hover:text-editorial-accent transition-colors">
            Panel
          </div>
        </button>
      </div>
      <nav className="flex-1 py-4">
        {adminSections.map((item, i) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                'w-full flex items-baseline gap-4 px-8 py-3 text-left transition-colors group',
                'hover:bg-editorial-line/30'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-bold tracking-[0.2em] w-6',
                  isActive ? 'text-editorial-accent' : 'text-editorial-muted'
                )}
              >
                {sectionNumber(i)}
              </span>
              <span
                className={cn(
                  'font-editorial text-[15px]',
                  isActive ? 'text-editorial-ink' : 'text-editorial-muted group-hover:text-editorial-ink'
                )}
              >
                {item.label}
              </span>
              {item.id === 'offers' && newLeadsCount > 0 && (
                <span
                  className="ml-auto flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-editorial-accent"
                  aria-label={`Nieobsłużone zapytania: ${newLeadsCount}`}
                >
                  {newLeadsCount}
                  <PulseDot />
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-6 border-t border-editorial-line space-y-3">
        <button
          onClick={onToggleTheme}
          aria-label={isDark ? 'Włącz tryb dzienny' : 'Włącz tryb nocny'}
          className="w-full flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-editorial-muted hover:text-editorial-ink transition-colors"
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {isDark ? 'Tryb dzienny' : 'Tryb nocny'}
        </button>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-editorial-muted hover:text-editorial-ink transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
