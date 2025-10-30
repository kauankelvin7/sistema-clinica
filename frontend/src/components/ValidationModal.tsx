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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-500 to-rose-600 rounded-t-2xl p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Atenção!
              </h3>
              <p className="text-rose-100 text-sm mt-1">
                Campos obrigatórios não preenchidos
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Por favor, preencha os seguintes campos antes de gerar o documento:
          </p>
          
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
            <ul className="space-y-2.5">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></div>
                  <span className="font-semibold">{field}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
