import { PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type Props = PropsWithChildren<{ variant?: 'info' | 'success' | 'warning'; className?: string }>;

export function Badge({ children, variant = 'info', className }: Props) {
  const colors: Record<typeof variant, string> = {
    info: 'bg-blue-900 text-blue-100',
    success: 'bg-emerald-900 text-emerald-100',
    warning: 'bg-amber-900 text-amber-100',
  };
  return <span className={cn('badge', colors[variant], className)}>{children}</span>;
}
