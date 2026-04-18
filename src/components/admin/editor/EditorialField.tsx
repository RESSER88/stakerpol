import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FieldWrapProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export const FieldWrap = ({ label, required, hint, children, className }: FieldWrapProps) => (
  <label className={cn('block', className)}>
    <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted mb-1.5">
      {label}
      {required && <span className="text-editorial-accent ml-1">*</span>}
    </span>
    {children}
    {hint && <span className="block text-[11px] text-editorial-muted mt-1 italic">{hint}</span>}
  </label>
);

const baseInput =
  'w-full bg-transparent border-0 border-b border-editorial-line px-0 py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/50 focus:outline-none focus:border-editorial-ink transition-colors';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
  wrapClassName?: string;
}

export const EditorialInput = ({ label, required, hint, wrapClassName, className, ...rest }: InputProps) => (
  <FieldWrap label={label} required={required} hint={hint} className={wrapClassName}>
    <input className={cn(baseInput, className)} {...rest} />
  </FieldWrap>
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  hint?: string;
  wrapClassName?: string;
}

export const EditorialTextarea = ({ label, required, hint, wrapClassName, className, rows = 3, ...rest }: TextareaProps) => (
  <FieldWrap label={label} required={required} hint={hint} className={wrapClassName}>
    <textarea rows={rows} className={cn(baseInput, 'resize-y', className)} {...rest} />
  </FieldWrap>
);

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  hint?: string;
  wrapClassName?: string;
  options: { value: string; label: string }[];
}

export const EditorialSelect = ({ label, required, hint, wrapClassName, className, options, ...rest }: SelectProps) => (
  <FieldWrap label={label} required={required} hint={hint} className={wrapClassName}>
    <select className={cn(baseInput, 'cursor-pointer', className)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </FieldWrap>
);
