import React, { useState } from 'react';

interface ActionModalProps {
  type: 'addMoney' | 'bankTransfer';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, details?: any) => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ type, isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      onSubmit(parseFloat(amount), type === 'bankTransfer' ? { accountNo, ifsc } : undefined);
      setIsLoading(false);
      setAmount('');
      setAccountNo('');
      setIfsc('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {type === 'addMoney' ? 'Add Money to Wallet' : 'Bank Transfer'}
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'bankTransfer' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="0000 0000 0000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="SBIN000..."
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-lg">$</span>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 pl-8 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg transition"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </span>
            ) : (
              type === 'addMoney' ? 'Add Money' : 'Transfer Securely'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActionModal;
