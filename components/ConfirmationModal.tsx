import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText, cancelText }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-slate-100 mb-4">{title}</h2>
        <div className="text-slate-300 mb-6">{children}</div>
        <div className="flex justify-end gap-4">
          {cancelText && (
            <button 
                onClick={onClose} 
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {cancelText}
            </button>
          )}
          {confirmText && onConfirm && (
            <button 
                onClick={onConfirm} 
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {confirmText}
            </button>
          )}
          {/* For "OK" only modals */}
          {!cancelText && !confirmText && (
              <button 
                onClick={onClose} 
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
              >
                  OK
              </button>
          )}
        </div>
      </div>
    </div>
  );
};
