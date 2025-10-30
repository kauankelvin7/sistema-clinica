import React from 'react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, missingFields }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Campos obrigatórios não preenchidos
            </h3>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Por favor, preencha os seguintes campos antes de gerar o documento:
            </p>
            <ul className="space-y-2">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{field}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
