import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ConversionList } from './components/ConversionList';
import { MarkdownPreview } from './components/MarkdownPreview';
import { ApiKeyInput } from './components/ApiKeyInput';
import { ConvertedFile, ConversionStatus } from './types';
import { convertPdfToMarkdown } from './services/gemini';
import { getProgress, getFileId, getUnfinishedWork, clearProgress, ConversionProgress } from './services/progressCache';
import { ResumePrompt } from './components/ResumePrompt';

const App: React.FC = () => {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const conversionQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const [unfinishedWork, setUnfinishedWork] = useState<ConversionProgress[]>([]);

  // Check for unfinished work on mount
  useEffect(() => {
    setUnfinishedWork(getUnfinishedWork());
  }, []);

  const handleResumeWork = (progress: ConversionProgress) => {
    // Close the prompt for this item
    setUnfinishedWork(prev => prev.filter(p => p.fileId !== progress.fileId));
  };

  const handleDiscardWork = (progress: ConversionProgress) => {
    clearProgress(progress.fileId);
    setUnfinishedWork(prev => prev.filter(p => p.fileId !== progress.fileId));
  };

  // Load API Key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
    setIsLoadingKey(false);
  }, []);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey(null);
  };

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const newConvertedFiles: ConvertedFile[] = newFiles.map(file => {
      const fileId = getFileId(file.name, file.size);
      const progress = getProgress(fileId);

      return {
        id: uuidv4(),
        file,
        status: ConversionStatus.IDLE,
        progress: progress ? Math.round((progress.completedChunks.length / progress.totalChunks) * 100) : 0,
        resumeProgress: progress || undefined,
        statusMessage: progress ? `Ready to resume (${Math.round((progress.completedChunks.length / progress.totalChunks) * 100)}% done)` : undefined
      };
    });
    setFiles(prev => [...prev, ...newConvertedFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleConvert = useCallback(async (id: string) => {
    if (!apiKey) return;

    const fileEntry = files.find(f => f.id === id);
    if (!fileEntry) {
      console.error("File not found:", id);
      return;
    }

    const fileToConvert = fileEntry.file;

    // Update status to processing
    setFiles(prev => prev.map(f =>
      f.id === id
        ? { ...f, status: ConversionStatus.PROCESSING, progress: 1, error: undefined, statusMessage: 'Starting...' }
        : f
    ));

    try {
      const result = await convertPdfToMarkdown(
        fileToConvert,
        apiKey,
        (msg, percent) => {
          setFiles(prev => prev.map(f =>
            f.id === id
              ? { ...f, statusMessage: msg, progress: percent }
              : f
          ));
        },
        fileEntry.resumeProgress
      );

      setFiles(prev => prev.map(f =>
        f.id === id
          ? { ...f, status: ConversionStatus.SUCCESS, markdownContent: result, progress: 100, statusMessage: 'Done' }
          : f
      ));
    } catch (error: unknown) {
      let errorMsg = "Conversion failed.";

      // Handle Authentication Errors Specifically
      if (error instanceof Error) {
        const errorString = JSON.stringify(error);
        if (error.message?.includes("401") || errorString.includes("401") || errorString.includes("INVALID_ARGUMENT") || errorString.includes("credentials")) {
          errorMsg = "Authentication failed. Please check your API key.";
        } else if (error.message) {
          errorMsg = error.message;
        }
      }

      setFiles(prev => prev.map(f =>
        f.id === id
          ? { ...f, status: ConversionStatus.ERROR, error: errorMsg, progress: 0 }
          : f
      ));
    }
  }, [apiKey, files]);

  // Process conversion queue sequentially
  const processNextInQueue = useCallback(async () => {
    if (isProcessingRef.current || conversionQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const fileId = conversionQueueRef.current.shift();

    if (fileId) {
      await handleConvert(fileId);
    }

    isProcessingRef.current = false;

    // Process next file if queue has more
    if (conversionQueueRef.current.length > 0) {
      processNextInQueue();
    }
  }, [handleConvert]);

  const handleConvertAll = useCallback(() => {
    // Get all files that need conversion
    const filesToConvert = files.filter(f =>
      f.status === ConversionStatus.IDLE || f.status === ConversionStatus.ERROR
    );

    // Add to queue
    conversionQueueRef.current = filesToConvert.map(f => f.id);

    // Start processing
    processNextInQueue();
  }, [files, processNextInQueue]);

  const handlePreview = (id: string) => {
    setPreviewFileId(id);
  };

  const closePreview = () => {
    setPreviewFileId(null);
  };

  const previewFile = files.find(f => f.id === previewFileId);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-[#f8fafc]">
      <Header hasApiKey={!!apiKey} onClearKey={handleClearApiKey} />

      <ResumePrompt
        unfinishedWork={unfinishedWork}
        onResume={handleResumeWork}
        onDiscard={handleDiscardWork}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Convert Large PDFs to <span className="text-indigo-600">Markdown</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powered by <strong>Gemini 2.5 Flash</strong>.
            <br />All processing happens in your browser. No files are stored on our servers.
          </p>
        </div>

        {/* Main Content Area: Loading, Key Input, or App Interface */}
        {isLoadingKey ? (
          <div className="text-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500 mt-4">Loading...</p>
          </div>
        ) : !apiKey ? (
          <ApiKeyInput onSaveKey={handleSaveApiKey} />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Upload Area */}
            <DropZone onFilesAdded={handleFilesAdded} />

            {/* Action Bar (only if files exist) */}
            {files.length > 0 && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleConvertAll}
                  disabled={files.every(f => f.status === ConversionStatus.SUCCESS || f.status === ConversionStatus.PROCESSING)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  Convert All Pending
                </button>
              </div>
            )}

            {/* List */}
            <ConversionList
              files={files}
              onConvert={handleConvert}
              onRemove={handleRemoveFile}
              onPreview={handlePreview}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <p>© 2025 PDF2MD. Build by Liuchunchun with Google Gemini 2.5 Flash & React.</p>
      </footer>

      {/* Modal */}
      {previewFile && previewFile.markdownContent && (
        <MarkdownPreview
          content={previewFile.markdownContent}
          filename={previewFile.file.name}
          onClose={closePreview}
        />
      )}
    </div>
  );
};

export default App;