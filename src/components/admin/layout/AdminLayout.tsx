import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import AdminBottomNav from './AdminBottomNav';
import AdminPageHeader from './AdminPageHeader';
import { AdminSection, sectionTitles } from './types';

interface Props {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  onSignOut: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
}

const AdminLayout = ({ active, onChange, onSignOut, children, headerActions }: Props) => {
  const title = sectionTitles[active];

  return (
    <div className="min-h-screen bg-admin-bg">
      <AdminSidebar active={active} onChange={onChange} onSignOut={onSignOut} />
      <AdminTopBar title={title} onChange={onChange} onSignOut={onSignOut} />
      <div className="lg:ml-[220px] min-h-screen flex flex-col">
        <AdminPageHeader title={title} actions={headerActions} />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">{children}</main>
      </div>
      <AdminBottomNav active={active} onChange={onChange} />
    </div>
  );
};

export default AdminLayout;
