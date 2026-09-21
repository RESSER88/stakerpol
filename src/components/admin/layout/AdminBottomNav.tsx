import { cn } from '@/lib/utils';
import { adminSections, sectionNumber, type AdminSection } from './types';
import { useNewLeadsCount } from '@/hooks/useNewLeadsCount';
import PulseDot from '../editorial/PulseDot';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}

const AdminBottomNav = ({ active, onChange }: Props) => {
  const items = adminSections.slice(0, 5);
  const { count: newLeadsCount } = useNewLeadsCount();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-editorial-bg border-t border-editorial-ink min-h-12 h-[calc(3rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] grid grid-cols-5 z-50">
      {items.map((item, i) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="relative min-w-0 flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            {item.id === 'inquiries' && newLeadsCount > 0 && (
              <PulseDot className="absolute top-1 right-[18%]" />
            )}
            <span
              className={cn(
                'text-[9px] font-bold tracking-[0.2em]',
                isActive ? 'text-editorial-accent' : 'text-editorial-muted'
              )}
            >
              {sectionNumber(i)}
            </span>
            <span
              className={cn(
                'font-editorial text-[10px] leading-none truncate max-w-full px-0.5',
                isActive ? 'text-editorial-ink' : 'text-editorial-muted'
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default AdminBottomNav;
