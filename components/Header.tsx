import React from 'react';

interface HeaderProps {
    hasApiKey: boolean;
    onClearKey: () => void;
}

export const Header: React.FC<HeaderProps> = ({ hasApiKey, onClearKey }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">PDF2MD</h1>
        </div>
        
        <div className="flex items-center gap-4">
            {hasApiKey && (
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        API Key Set
                    </span>
                    <button 
                        onClick={onClearKey}
                        className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                    >
                        Change Key
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};