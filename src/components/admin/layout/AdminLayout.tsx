import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import AdminBottomNav from './AdminBottomNav';
import { AdminSection, sectionTitles } from './types';
import { useAdminTheme } from '@/hooks/useAdminTheme';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  onSignOut: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
}

const AdminLayout = ({ active, onChange, onSignOut, children }: Props) => {
  const title = sectionTitles[active];
  // Jedno źródło prawdy o motywie dla całego panelu.
  const { isDark, toggleTheme } = useAdminTheme();

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-ink">
      <AdminSidebar
        active={active}
        onChange={onChange}
        onSignOut={onSignOut}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <AdminTopBar
        title={title}
        onChange={onChange}
        onSignOut={onSignOut}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <div className="lg:ml-[240px] min-h-screen flex flex-col">
        <main className="flex-1 px-5 py-8 lg:px-12 lg:py-12 pb-20 lg:pb-12">
          {children}
        </main>
      </div>
      <AdminBottomNav active={active} onChange={onChange} />
    </div>
  );
};

export default AdminLayout;
