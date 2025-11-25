import { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string };

export function Select({ label, className, children, error, ...props }: Props) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-200">
      {label}
      <select className={cn('input', className)} {...props}>
        {children}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}
