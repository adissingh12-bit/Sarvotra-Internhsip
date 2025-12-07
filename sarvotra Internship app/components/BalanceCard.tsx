import React from 'react';

interface BalanceCardProps {
  balance: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-indigo-100 text-sm font-medium mb-1">Total Balance</p>
          <h1 className="text-4xl font-bold tracking-tight">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
        </div>
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>
      <div className="mt-8 flex space-x-4">
        <div className="flex items-center space-x-1 text-sm bg-white/10 px-3 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Active</span>
        </div>
        <div className="flex items-center space-x-1 text-sm text-indigo-100">
           <span>**** 4291</span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
