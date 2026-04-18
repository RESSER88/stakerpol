import { MoreVertical, Search, HelpCircle, LogOut } from 'lucide-react';
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
    <header className="lg:hidden sticky top-0 bg-admin-dark text-white px-4 h-14 flex items-center justify-between z-40">
      <h1 className="text-base font-semibold truncate">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2 -mr-2 rounded-md hover:bg-white/10">
          <MoreVertical className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onChange('seo')}>
            <Search className="h-4 w-4" />
            SEO & Schema
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('faq')}>
            <HelpCircle className="h-4 w-4" />
            FAQ
          </DropdownMenuItem>
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
