import { PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('card p-4', className)}>{children}</div>;
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-slate-400">{description}</p>}
      </div>
    </div>
  );
}
