import { cn } from '@/lib/utils';
import { adminSections, sectionNumber, type AdminSection } from './types';
import { useNewLeadsCount } from '@/hooks/useNewLeadsCount';
import PulseDot from '../editorial/PulseDot';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}

const AdminBottomNav = ({ active, onChange }: Props) => {
  const items = adminSections.slice(0, 4);
  const { count: newLeadsCount } = useNewLeadsCount();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-editorial-bg border-t border-editorial-ink h-12 grid grid-cols-4 z-50">
      {items.map((item, i) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="relative flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            {item.id === 'offers' && newLeadsCount > 0 && (
              <PulseDot className="absolute top-1 right-[22%]" />
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
                'font-editorial text-[10px] leading-none',
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
