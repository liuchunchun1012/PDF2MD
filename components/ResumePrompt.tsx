import React from 'react';
import { ConversionProgress } from '../services/progressCache';

interface ResumePromptProps {
    unfinishedWork: ConversionProgress[];
    onResume: (progress: ConversionProgress) => void;
    onDiscard: (progress: ConversionProgress) => void;
}

export const ResumePrompt: React.FC<ResumePromptProps> = ({ unfinishedWork, onResume, onDiscard }) => {
    if (unfinishedWork.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <h3 className="text-xl font-bold text-slate-900">未完成的转换</h3>
                </div>

                <p className="text-slate-600 mb-6">
                    检测到 {unfinishedWork.length} 个未完成的转换任务。是否继续？
                </p>

                <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
                    {unfinishedWork.map((progress) => {
                        const percentComplete = Math.round((progress.completedChunks.length / progress.totalChunks) * 100);

                        return (
                            <div key={progress.fileId} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{progress.fileName}</p>
                                        <p className="text-sm text-slate-500">
                                            {progress.completedChunks.length} / {progress.totalChunks} 部分已完成 ({percentComplete}%)
                                        </p>
                                    </div>
                                    <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                                        {progress.mode === 'text' ? '文本' : '视觉'}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all"
                                        style={{ width: `${percentComplete}%` }}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onResume(progress)}
                                        className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
                                    >
                                        继续转换
                                    </button>
                                    <button
                                        onClick={() => onDiscard(progress)}
                                        className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors text-sm"
                                    >
                                        放弃
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => unfinishedWork.forEach(onDiscard)}
                    className="w-full px-4 py-2 text-slate-500 hover:text-slate-700 font-medium transition-colors text-sm"
                >
                    全部放弃
                </button>
            </div>
        </div>
    );
};
