import React from 'react';
import { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400">No transactions yet.</p>
      </div>
    );
  }

  // Sort by newest
  const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
      </div>
      <ul className="divide-y divide-gray-100">
        {sorted.map((t) => (
          <li key={t.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${t.type === 'outgoing' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                {t.type === 'outgoing' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                   </svg>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                   </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.type === 'outgoing' ? `Payment to ${t.recipientName}` : `Received from ${t.recipientName}`}
                </p>
                <p className="text-xs text-gray-500">{t.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {t.date.toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${t.type === 'outgoing' ? 'text-gray-900' : 'text-green-600'}`}>
                {t.type === 'outgoing' ? '-' : '+'}${t.amount.toFixed(2)}
              </p>
              <p className={`text-xs ${t.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;
