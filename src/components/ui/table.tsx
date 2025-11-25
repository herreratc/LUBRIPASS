import { PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

export function Table({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <table className={cn('table', className)}>{children}</table>;
}

export function THead({ children }: PropsWithChildren) {
  return <thead className="bg-slate-900">{children}</thead>;
}

export function TBody({ children }: PropsWithChildren) {
  return <tbody className="divide-y divide-slate-800">{children}</tbody>;
}

export function TR({ children }: PropsWithChildren) {
  return <tr className="hover:bg-slate-900">{children}</tr>;
}
