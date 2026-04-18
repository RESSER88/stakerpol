import { cn } from '@/lib/utils';

interface Props {
  status?: 'available' | 'reserved' | 'sold' | string;
  className?: string;
}

const StatusDot = ({ status = 'available', className }: Props) => {
  const color =
    status === 'sold'
      ? 'bg-editorial-bad'
      : status === 'reserved'
      ? 'bg-editorial-accent'
      : 'bg-editorial-ok';
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', color, className)}
      aria-label={status}
    />
  );
};

export default StatusDot;
