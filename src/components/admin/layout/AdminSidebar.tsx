import { Zap, Package, Inbox, Download, Search, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminSection } from './types';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  onSignOut: () => void;
}

const items: { id: AdminSection; label: string; icon: typeof Zap }[] = [
  { id: 'start', label: 'Start', icon: Zap },
  { id: 'products', label: 'Produkty', icon: Package },
  { id: 'inquiries', label: 'Zapytania', icon: Inbox },
  { id: 'export', label: 'Eksport', icon: Download },
  { id: 'seo', label: 'SEO & Schema', icon: Search },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

const AdminSidebar = ({ active, onChange, onSignOut }: Props) => {
  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[220px] bg-admin-dark text-white flex-col z-40">
      <div className="px-6 py-5 flex items-center gap-2 border-b border-white/10">
        <Zap className="h-6 w-6 text-admin-orange" />
        <span className="text-xl font-bold">StakerPanel</span>
      </div>
      <nav className="flex-1 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors text-left',
                'hover:bg-white/5',
                isActive && 'bg-white/10 border-l-4 border-admin-orange pl-5 font-medium'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Wyloguj
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
