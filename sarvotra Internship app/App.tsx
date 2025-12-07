
import React, { useState, useCallback } from 'react';
import { UserState, Transaction, ConnectionState, Tab } from './types';
import { MOCK_CONTACTS, INITIAL_BALANCE } from './constants';
import VoiceAgent from './components/VoiceAgent';
import BalanceCard from './components/BalanceCard';
import ContactList from './components/ContactList';
import TransactionList from './components/TransactionList';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pay');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [userState, setUserState] = useState<UserState>({
    balance: INITIAL_BALANCE,
    transactions: [],
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);

  const handlePaymentRequest = useCallback(async (contactName: string, amount: number): Promise<{ success: boolean; message: string }> => {
    console.log(`Processing payment: ${amount} to ${contactName}`);
    
    // 1. Find Contact (Simple fuzzy match logic)
    const contact = MOCK_CONTACTS.find(c => 
      c.name.toLowerCase().includes(contactName.toLowerCase()) || 
      contactName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
    );

    if (!contact) {
      return { 
        success: false, 
        message: `I couldn't find a contact named ${contactName}.` 
      };
    }

    // 2. Check Balance
    if (userState.balance < amount) {
      return {
        success: false,
        message: `Transaction failed. Insufficient funds. Balance is $${userState.balance.toFixed(2)}.`
      };
    }

    // 3. Execute Transaction
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      recipientId: contact.id,
      recipientName: contact.name,
      amount: amount,
      date: new Date(),
      type: 'outgoing',
      status: 'completed'
    };

    setUserState(prev => ({
      balance: prev.balance - amount,
      transactions: [newTransaction, ...prev.transactions]
    }));

    return {
      success: true,
      message: `Payment of $${amount} to ${contact.name} successful.`
    };

  }, [userState.balance]);

  const renderContent = () => {
    switch (activeTab) {
      case 'pay':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-indigo-200 text-sm mb-1">Quick Actions</p>
                <h2 className="text-2xl font-bold">Who do you want to pay?</h2>
                <div className="mt-4 bg-white/10 rounded-lg p-3 flex items-center space-x-2 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-100" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <span className="text-indigo-100 text-sm">Search name or ID...</span>
                </div>
            </div>
            <ContactList contacts={MOCK_CONTACTS} />
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2">Scan & Pay</h3>
                <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
                    <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span className="text-xs">Scan QR Code</span>
                    </div>
                </div>
            </div>
          </div>
        );
      case 'balance':
        return (
          <div className="space-y-6 animate-fade-in">
             <BalanceCard balance={userState.balance} />
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                     <div className="p-2 bg-green-100 text-green-600 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                     </div>
                     <span className="text-sm font-medium text-gray-700">Add Money</span>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                     </div>
                     <span className="text-sm font-medium text-gray-700">Bank Transfer</span>
                 </div>
             </div>
          </div>
        );
      case 'history':
        return (
           <div className="space-y-4 animate-fade-in">
             <TransactionList transactions={userState.transactions} />
           </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden font-sans">
      
      {/* Top Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">S</div>
          <span className="font-bold text-gray-800 text-lg tracking-tight">Sarvotra Pay</span>
        </div>
        
        {/* Voice Mode Toggle */}
        <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold uppercase ${isVoiceMode ? 'text-indigo-600' : 'text-gray-400'}`}>Voice</span>
            <button 
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isVoiceMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isVoiceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-10">
        <button 
            onClick={() => setActiveTab('pay')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'pay' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Pay</span>
        </button>
        <button 
            onClick={() => setActiveTab('balance')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'balance' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-xs font-medium">Balance</span>
        </button>
        <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'history' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">History</span>
        </button>
      </nav>

      {/* Voice Mode Overlay */}
      <VoiceAgent 
        isOpen={isVoiceMode}
        onClose={() => setIsVoiceMode(false)}
        onPaymentRequest={handlePaymentRequest} 
        connectionState={connectionState}
        setConnectionState={setConnectionState}
      />

    </div>
  );
};

export default App;
