import { MoreVertical, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { AdminSection } from './types';

interface Props {
  title: string;
  onChange: (section: AdminSection) => void;
  onSignOut: () => void;
}

const AdminTopBar = ({ title, onChange, onSignOut }: Props) => {
  return (
    <header className="lg:hidden sticky top-0 bg-white border-b border-editorial-line px-4 h-12 flex items-center justify-between z-40">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-bold tracking-[0.25em] text-editorial-muted">STAKERPOL</span>
        <span className="font-editorial text-sm text-editorial-ink">· {title}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2 -mr-2 text-editorial-ink">
          <MoreVertical className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onChange('seo')}>05 — SEO &amp; Schema</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('faq')}>06 — FAQ</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
            Wyloguj
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default AdminTopBar;
