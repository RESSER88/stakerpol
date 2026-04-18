import { ReactNode } from 'react';

interface Props {
  title: string;
  actions?: ReactNode;
}

const AdminPageHeader = ({ title, actions }: Props) => {
  return (
    <div className="hidden lg:flex bg-white border-b border-admin-border px-8 py-4 items-center justify-between">
      <div>
        <div className="text-xs text-admin-muted mb-1">Panel / {title}</div>
        <h1 className="text-xl font-semibold text-admin-text">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default AdminPageHeader;
