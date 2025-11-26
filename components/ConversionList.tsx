import React from 'react';
import { ConvertedFile, ConversionStatus } from '../types';

interface ConversionListProps {
  files: ConvertedFile[];
  onConvert: (id: string) => void;
  onRemove: (id: string) => void;
  onPreview: (id: string) => void;
}

export const ConversionList: React.FC<ConversionListProps> = ({ files, onConvert, onRemove, onPreview }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Your Documents</h2>
      {files.map((file) => (
        <div 
          key={file.id} 
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md"
        >
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Icon based on status */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${file.status === ConversionStatus.IDLE ? 'bg-slate-100 text-slate-500' : ''}
                ${file.status === ConversionStatus.PROCESSING ? 'bg-indigo-50 text-indigo-600' : ''}
                ${file.status === ConversionStatus.SUCCESS ? 'bg-emerald-50 text-emerald-600' : ''}
                ${file.status === ConversionStatus.ERROR ? 'bg-red-50 text-red-600' : ''}
              `}>
                {file.status === ConversionStatus.PROCESSING ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : file.status === ConversionStatus.SUCCESS ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                ) : file.status === ConversionStatus.ERROR ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM12.75 12a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V18a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V12Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-slate-800 truncate block max-w-[200px] sm:max-w-md" title={file.file.name}>
                  {file.file.name}
                </span>
                <span className="text-xs text-slate-500">
                  {(file.file.size / (1024 * 1024)).toFixed(2)} MB • {
                    file.status === ConversionStatus.PROCESSING && file.statusMessage ? (
                        <span className="text-indigo-600 font-medium">{file.statusMessage}</span>
                    ) : (
                        file.status === ConversionStatus.IDLE ? 'Ready' : 
                        file.status === ConversionStatus.PROCESSING ? 'Converting...' : 
                        file.status === ConversionStatus.SUCCESS ? 'Completed' : 'Error'
                    )
                  }
                </span>
                {file.status === ConversionStatus.ERROR && (
                  <span className="text-xs text-red-500 mt-1">{file.error}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {file.status === ConversionStatus.IDLE && (
                <button 
                  onClick={() => onConvert(file.id)}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 whitespace-nowrap"
                >
                  Convert
                </button>
              )}

              {file.status === ConversionStatus.SUCCESS && (
                 <button 
                 onClick={() => onPreview(file.id)}
                 className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 whitespace-nowrap"
               >
                 View Markdown
               </button>
              )}

              <button 
                onClick={() => onRemove(file.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          {file.status === ConversionStatus.PROCESSING && (
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${file.progress}%` }}
                ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};