import { PropsWithChildren } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface Props extends PropsWithChildren {
  title: string;
  open: boolean;
  onClose: () => void;
}

export function Modal({ title, open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="card w-full max-w-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <Button variant="ghost" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
