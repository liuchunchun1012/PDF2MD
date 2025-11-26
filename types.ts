
export enum ConversionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ConvertedFile {
  id: string;
  file: File;
  status: ConversionStatus;
  markdownContent?: string;
  error?: string;
  progress: number; // 0 to 100
  statusMessage?: string; // e.g., "Splitting PDF...", "Converting part 1/5..."
}

export interface MarkdownPreviewProps {
  content: string;
  filename: string;
  onClose: () => void;
}

// Extend global navigator interface for deviceMemory
declare global {
    interface Navigator {
        deviceMemory?: number;
    }
}
