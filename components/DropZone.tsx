
import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkSystemRequirements = (file: File): boolean => {
    // 1. Detect RAM (if supported by browser)
    // navigator.deviceMemory returns RAM in GB (approx). 
    // Common values: 0.5, 1, 2, 4, 8. 
    const ram = navigator.deviceMemory;

    // 2. Detect Mobile/Tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const fileSizeMB = file.size / (1024 * 1024);

    // Rule: Low RAM device (< 4GB) + Large File (> 50MB) = Warning
    if (ram && ram < 4 && fileSizeMB > 50) {
      const proceed = window.confirm(
        `Warning: This file is ${fileSizeMB.toFixed(0)}MB. Your device appears to have low memory (${ram}GB). Processing might crash the browser page. Do you want to try anyway?`
      );
      return proceed;
    }

    // Rule: Mobile Device + Very Large File (> 100MB) = Warning
    if (isMobile && fileSizeMB > 100) {
      const proceed = window.confirm(
        `Warning: Processing a ${fileSizeMB.toFixed(0)}MB file on a mobile device requires significant resources. It might cause the browser to crash. Proceed?`
      );
      return proceed;
    }

    // Rule: Desktop + Extremely Large File (> 400MB) = Warning
    if (fileSizeMB > 400) {
      const proceed = window.confirm(
        `Warning: This file is very large (${fileSizeMB.toFixed(0)}MB). It may take several minutes and significant system memory to process. Continue?`
      );
      return proceed;
    }

    return true;
  };

  const handleFiles = (filesList: File[]) => {
    const validFiles: File[] = [];
    const pdfFiles = filesList.filter(
      file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      const nonPdfNames = filesList.map(f => f.name).join(', ');
      alert(`Invalid file type. Please upload PDF files only.\n\nRejected: ${nonPdfNames}`);
      return;
    }

    if (pdfFiles.length < filesList.length) {
      const nonPdfFiles = filesList.filter(
        file => file.type !== 'application/pdf' && !file.name.endsWith('.pdf')
      );
      const nonPdfNames = nonPdfFiles.map(f => f.name).join(', ');
      alert(`Some files were skipped (not PDFs):\n${nonPdfNames}`);
    }

    for (const file of pdfFiles) {
      if (checkSystemRequirements(file)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ease-in-out
        ${isDragOver
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01] shadow-lg'
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="application/pdf"
        multiple
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`
          p-4 rounded-full transition-colors duration-200
          ${isDragOver ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}
        `}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div>
          <p className="text-lg font-medium text-slate-700">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Supports large files (200MB+).
            <br />
            We automatically split and process large documents for you.
          </p>
        </div>
      </div>
    </div>
  );
};
