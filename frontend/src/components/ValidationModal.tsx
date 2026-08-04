import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, missingFields }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden relative transform animate-in zoom-in-95 duration-200">
        
        {/* Header com tom de alerta sutil */}
        <div className="bg-rose-500/10 dark:bg-rose-500/15 border-b border-rose-500/20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                {t.modalValidationTitle}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                {t.modalValidationSubtitle}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Campos */}
        <div className="p-5">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800/80">
            <ul className="space-y-2.5">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-all"
          >
            {t.btnGotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
