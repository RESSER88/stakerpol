import { Zap, Package, Inbox, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSection } from './types';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}

const items: { id: AdminSection; label: string; icon: typeof Zap }[] = [
  { id: 'start', label: 'Start', icon: Zap },
  { id: 'products', label: 'Produkty', icon: Package },
  { id: 'inquiries', label: 'Zapytania', icon: Inbox },
  { id: 'export', label: 'Eksport', icon: Download },
];

const AdminBottomNav = ({ active, onChange }: Props) => {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-admin-border h-16 grid grid-cols-4 z-40">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 transition-colors relative',
              isActive ? 'text-admin-orange' : 'text-admin-muted'
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-4 right-4 h-0.5 bg-admin-orange" />
            )}
            <Icon className="h-5 w-5" />
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default AdminBottomNav;
