import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Bottom sheet used for pickers, confirmations, and detail drill-downs on mobile-style screens. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-cream-50 p-5 shadow-luxury"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-900/15" />
            {title && <h2 className="mb-3 font-display text-lg font-semibold text-ink-950">{title}</h2>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
