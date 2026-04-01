import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

/**
 * Generic confirmation modal — replaces all window.confirm calls.
 * Props:
 *  - isOpen: boolean
 *  - title: string
 *  - message: ReactNode
 *  - confirmLabel?: string  (default "Delete")
 *  - confirmVariant?: "danger" | "primary"  (default "danger")
 *  - processing: boolean
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  processing = false,
  onConfirm,
  onCancel,
}) => {
  const btnClass =
    confirmVariant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-primary-600 hover:bg-primary-700 text-white';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            {message && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">{message}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={processing}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${btnClass}`}
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{confirmVariant === 'danger' && <Trash2 className="w-3.5 h-3.5" />}{confirmLabel}</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
