import React from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import type { ToastMessage } from '../../hooks/useToast';

const STATUS_STYLES: Record<ToastMessage['type'], string> = {
  error: 'bg-rose-950/90 text-rose-200 border-rose-500/50',
  info: 'bg-sky-950/90 text-sky-200 border-sky-500/50',
  success: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50',
};

/** Colour-coded toast banner used by the admin management modules. */
export const StatusToast: React.FC<{ toast: ToastMessage | null }> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-3 ${STATUS_STYLES[toast.type]}`}
    >
      {toast.type === 'error' ? (
        <AlertOctagon className="w-5 h-5 text-rose-400" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      )}
      <span>{toast.text}</span>
    </div>
  );
};

/**
 * Single-tone toast banner for modules that only report confirmations.
 * `panel` matches the slate/indigo dashboard panels, `highlight` the emerald metric cards.
 */
export const SimpleToast: React.FC<{ message: string | null; variant?: 'panel' | 'highlight' }> = ({
  message,
  variant = 'panel',
}) => {
  if (!message) return null;

  if (variant === 'highlight') {
    return (
      <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-xs font-bold">{message}</span>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-8 z-50 bg-slate-800 border border-indigo-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      <span className="text-xs font-semibold">{message}</span>
    </div>
  );
};
