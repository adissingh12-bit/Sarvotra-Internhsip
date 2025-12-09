import React, { useState } from 'react';
import { Contact, Transaction } from '../types';

interface ContactDetailProps {
  contact: Contact;
  transactions: Transaction[];
  onBack: () => void;
  onPayment: (amount: number) => Promise<void>;
}

const ContactDetail: React.FC<ContactDetailProps> = ({ contact, transactions, onBack, onPayment }) => {
  const [amount, setAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Sort transactions by date (oldest at top for chat-like feel, or newest at bottom)
  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    setIsPaying(true);
    await onPayment(parseFloat(amount));
    setIsPaying(false);
    setAmount('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-slide-in-right absolute inset-0 z-10">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center space-x-3 shadow-sm border-b border-gray-100 sticky top-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
           </svg>
        </button>
        <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full border border-gray-200" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 leading-tight">{contact.name}</h3>
          <p className="text-xs text-gray-500">{contact.username}</p>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 text-indigo-600">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
           </svg>
        </button>
      </div>

      {/* Chat/Transaction History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center text-xs text-gray-400 my-4">Payment History with {contact.name.split(' ')[0]}</div>
        
        {sortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
            <p>No previous payments.</p>
            <p>Start sending money securely.</p>
          </div>
        ) : (
          sortedTransactions.map((t) => (
            <div key={t.id} className={`flex w-full ${t.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                 t.type === 'outgoing' 
                   ? 'bg-indigo-600 text-white rounded-br-none' 
                   : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
               }`}>
                  <p className="text-xs opacity-80 mb-1">{t.type === 'outgoing' ? 'You paid' : 'You received'}</p>
                  <p className="text-2xl font-bold">${t.amount.toFixed(2)}</p>
                  <p className="text-[10px] opacity-70 mt-1 text-right">
                    {t.date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {t.date.toLocaleDateString()}
                  </p>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Pay Action Bar */}
      <div className="bg-white p-4 border-t border-gray-100 shadow-lg sticky bottom-0">
        <form onSubmit={handlePay} className="flex items-center space-x-3">
          <div className="relative flex-1">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
             <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="Enter amount"
               min="1"
               step="0.01"
               className="w-full bg-gray-100 rounded-full py-3 pl-8 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
             />
          </div>
          <button 
             type="submit"
             disabled={!amount || isPaying}
             className={`rounded-full p-3 transition-all ${
               amount && !isPaying 
               ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95' 
               : 'bg-gray-200 text-gray-400 cursor-not-allowed'
             }`}
          >
             {isPaying ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
             )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactDetail;
