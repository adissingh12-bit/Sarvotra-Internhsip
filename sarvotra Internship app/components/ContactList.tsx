import React from 'react';
import { Contact } from '../types';

interface ContactListProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onSelectContact }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Recents</h3>
        <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View All</button>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add New Button First */}
        <div className="flex flex-col items-center space-y-2 min-w-[70px]">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500">New</span>
        </div>

        {contacts.map((contact) => (
          <div 
            key={contact.id} 
            onClick={() => onSelectContact(contact)}
            className="flex flex-col items-center space-y-2 min-w-[70px] cursor-pointer group"
          >
            <div className="relative">
              <img 
                src={contact.avatar} 
                alt={contact.name} 
                className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-500 transition-all shadow-sm group-active:scale-95"
              />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <span className="text-xs font-medium text-gray-700 text-center truncate w-full group-hover:text-indigo-600">
              {contact.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactList;
