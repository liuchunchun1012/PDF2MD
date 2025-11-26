// Progress cache for resume functionality

export interface ConversionProgress {
    fileId: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    completedChunks: number[];
    results: Record<number, string>;
    timestamp: number;
    mode: 'text' | 'visual';
}

const CACHE_PREFIX = 'pdf2md_progress_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Generate unique file ID
export function getFileId(fileName: string, fileSize: number): string {
    return `${fileName}_${fileSize}`;
}

// Save progress
export function saveProgress(progress: ConversionProgress): void {
    try {
        const key = CACHE_PREFIX + progress.fileId;
        localStorage.setItem(key, JSON.stringify(progress));
        console.log(`[Progress Cache] Saved checkpoint for ${progress.fileName}, chunk ${progress.completedChunks.length}/${progress.totalChunks}`);
    } catch (e) {
        console.error('[Progress Cache] Failed to save progress:', e);
    }
}

// Get progress for a file
export function getProgress(fileId: string): ConversionProgress | null {
    try {
        const key = CACHE_PREFIX + fileId;
        const data = localStorage.getItem(key);
        if (!data) return null;

        const progress = JSON.parse(data) as ConversionProgress;

        // Check if expired
        if (Date.now() - progress.timestamp > CACHE_EXPIRY) {
            clearProgress(fileId);
            return null;
        }

        return progress;
    } catch (e) {
        console.error('[Progress Cache] Failed to get progress:', e);
        return null;
    }
}

// Clear progress for a file
export function clearProgress(fileId: string): void {
    try {
        const key = CACHE_PREFIX + fileId;
        localStorage.removeItem(key);
        console.log(`[Progress Cache] Cleared cache for ${fileId}`);
    } catch (e) {
        console.error('[Progress Cache] Failed to clear progress:', e);
    }
}

// Get all unfinished conversions
export function getUnfinishedWork(): ConversionProgress[] {
    const unfinished: ConversionProgress[] = [];

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                const fileId = key.replace(CACHE_PREFIX, '');
                const progress = getProgress(fileId);

                if (progress && progress.completedChunks.length < progress.totalChunks) {
                    unfinished.push(progress);
                }
            }
        }
    } catch (e) {
        console.error('[Progress Cache] Failed to get unfinished work:', e);
    }

    return unfinished;
}

// Check if there's any unfinished work
export function hasUnfinishedWork(): boolean {
    return getUnfinishedWork().length > 0;
}

// Clear all expired caches
export function cleanupExpiredCaches(): void {
    try {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                const data = localStorage.getItem(key);
                if (data) {
                    const progress = JSON.parse(data) as ConversionProgress;
                    if (Date.now() - progress.timestamp > CACHE_EXPIRY) {
                        keysToRemove.push(key);
                    }
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        if (keysToRemove.length > 0) {
            console.log(`[Progress Cache] Cleaned up ${keysToRemove.length} expired cache(s)`);
        }
    } catch (e) {
        console.error('[Progress Cache] Failed to cleanup:', e);
    }
}
