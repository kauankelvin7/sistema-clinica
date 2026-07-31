import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, missingFields }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white dark:bg-surface-card rounded-2xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
        {/* Header */}
        <div className="bg-rose-600 dark:bg-rose-700 p-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Campos Obrigatórios Pendentes
              </h3>
              <p className="text-rose-100 text-xs">
                Preencha os dados abaixo antes de gerar o documento
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-3">
          <div className="bg-rose-500/10 dark:bg-rose-500/15 rounded-xl p-3.5 border border-rose-500/20">
            <ul className="space-y-2">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 flex-shrink-0"></div>
                  <span className="font-medium">{field}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 pt-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold font-display text-white bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl shadow-sm hover:opacity-90 transition-all"
          >
            Entendi, vou preencher
          </button>
        </div>
      </div>
    </div>
  );
};
