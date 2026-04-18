import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
}

const EditorialButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'solid', children, ...props }, ref) => {
    const styles =
      variant === 'solid'
        ? 'bg-editorial-ink text-white hover:bg-editorial-ink/90'
        : variant === 'outline'
        ? 'border border-editorial-ink text-editorial-ink hover:bg-editorial-ink hover:text-white'
        : 'text-editorial-ink hover:bg-editorial-line/50';
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 h-10 text-xs font-bold tracking-[0.15em] uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          styles,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
EditorialButton.displayName = 'EditorialButton';
export default EditorialButton;
