import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' };

export function Button({ className, variant = 'primary', ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50';
  const variants: Record<typeof variant, string> = {
    primary: 'bg-primary text-white hover:bg-secondary focus:ring-primary',
    outline: 'border border-slate-700 text-slate-100 hover:bg-slate-800 focus:ring-slate-700',
    ghost: 'text-slate-200 hover:bg-slate-800 focus:ring-slate-700',
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
