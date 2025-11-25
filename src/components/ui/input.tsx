import { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export function Input({ label, className, error, ...props }: Props) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-200">
      {label}
      <input className={cn('input', className)} {...props} />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}
