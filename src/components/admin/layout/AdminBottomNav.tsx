import { cn } from '@/lib/utils';
import type { AdminSection } from './types';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}

const items: { id: AdminSection; num: string; label: string }[] = [
  { id: 'start', num: '01', label: 'Start' },
  { id: 'products', num: '02', label: 'Produkty' },
  { id: 'inquiries', num: '03', label: 'Zapytania' },
  { id: 'export', num: '04', label: 'Eksport' },
];

const AdminBottomNav = ({ active, onChange }: Props) => {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-editorial-ink h-12 grid grid-cols-4 z-50">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <span
              className={cn(
                'text-[9px] font-bold tracking-[0.2em]',
                isActive ? 'text-editorial-accent' : 'text-editorial-muted'
              )}
            >
              {item.num}
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
