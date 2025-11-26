
import { GoogleGenAI } from "@google/genai";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { saveProgress, getProgress, clearProgress, getFileId, ConversionProgress } from './progressCache';

// Initialize PDF.js worker - use unpkg for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;


// Helper to convert Blob/File to Base64 (data only)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Content = base64Data.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- TEXT EXTRACTION MODE (FAST) ---

const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    // Iterate over all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Simple text merging
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }
    return fullText;
  } catch (e) {
    console.error("Text extraction failed:", e);
    return ""; // Return empty to trigger fallback
  }
};

const callGeminiWithText = async (textChunk: string, apiKey: string, partIndex: number, totalParts: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [{
            text: `You are a Markdown formatter. 
                      The following is raw text extracted from a PDF (Part ${partIndex + 1}/${totalParts}). 
                      It has lost some formatting (tables might be scrambled, headers not marked).
                      
                      YOUR TASK:
                      1. Reconstruct the structure. Use # for headers, - for lists.
                      2. Detect tables from the text patterns and format them as Markdown tables.
                      3. Fix broken sentences caused by newlines.
                      4. Do NOT summarize. Keep all content.
                      
                      RAW TEXT:
                      ${textChunk}`
          }]
        }
      });
      return response.text || "";
    } catch (error: any) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await delay(2000 * (attempt + 1));
    }
  }
  return "";
};

// --- VISUAL MODE (SLOW, FOR SCANS) ---

const callGeminiWithPdfChunk = async (base64Data: string, mimeType: string, apiKey: string, partIndex: number, totalParts: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });

  const promptText = totalParts > 1
    ? `Convert this section (Part ${partIndex + 1} of ${totalParts}) of a PDF document into clean, structured Markdown. 
           Preserve headers, tables, and lists. IMPORTANT: Handle multi-column layouts correctly (read down columns, not across).`
    : "Convert the attached PDF document into clean, well-structured Markdown. Preserve headers, tables, and lists exactly as they appear. IMPORTANT: Handle multi-column layouts correctly (read down columns, not across).";

  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: promptText }
          ]
        },
        config: {
          systemInstruction: `You are a precise document conversion assistant using a multimodal model. 
                      Your task is to extract text from PDF files and format it as Markdown.
                      
                      LAYOUT HANDLING CRITICAL INSTRUCTIONS:
                      - Identify if the document uses a multi-column layout (e.g., academic paper, textbook, newsletter).
                      - ALWAYS read text in the correct logical flow: Column 1 (Top to Bottom) -> Column 2 (Top to Bottom).
                      - Do NOT merge text horizontally across the page gap unless it is a clear header spanning the page.
                      - Handle sidebars or floating text boxes by inserting them at a logical point in the flow or as a blockquote.

                      General Rules:
                      - Do not strip out content.
                      - Format tables using Markdown table syntax.
                      - Do not include 'Here is the markdown' preamble.
                      - Do not use markdown code fences (\`\`\`markdown) in the output.
                      - Ignore images (do not describe them).`
        }
      });
      return response.text || "";
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || "";
      const isRetryable = errorMsg.includes("500") || errorMsg.includes("503") || errorMsg.includes("overloaded") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("fetch");

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        console.warn(`[Gemini Service] Attempt ${attempt + 1} failed. Retrying in ${(attempt + 1) * 2}s...`);
        await delay(2000 * (attempt + 1));
        continue;
      }
      console.error("[Gemini Service] Error in callGeminiWithPdfChunk:", error);
      throw error;
    }
  }
  throw new Error("Gemini API failed after retries");
}

export const convertPdfToMarkdown = async (
  file: File,
  apiKey: string,
  onProgress?: (message: string, percent: number) => void,
  resumeFromProgress?: ConversionProgress | null
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  if (onProgress) onProgress("Analyzing file type...", 5);
  const arrayBuffer = await file.arrayBuffer();

  // --- STRATEGY 1: TRY FAST TEXT EXTRACTION ---
  // Try to extract text first. If we get a good amount of text, we assume it's a digital PDF.
  // This avoids uploading 70MB files and uses tiny text payloads instead.

  let rawText = "";
  try {
    if (onProgress) onProgress("Attempting fast text extraction...", 10);
    rawText = await extractTextFromPDF(arrayBuffer);
    console.log(`[Text Extraction] Extracted ${rawText.length} characters from PDF`);
  } catch (e) {
    console.warn("Text extraction failed, falling back to visual mode.");
  }

  // Heuristic: If we extracted less than 100 characters total, it's probably a scan / image only.
  // Lowered from 500 to be more aggressive with text extraction.
  const isLikelyScanned = rawText.length < 100;

  console.log(`[Mode Selection] Text length: ${rawText.length}, Using ${isLikelyScanned ? 'VISUAL' : 'TEXT'} mode`);

  if (!isLikelyScanned) {
    // === FAST MODE (TEXT ONLY) ===
    if (onProgress) onProgress(`✨ Text detected (${Math.round(rawText.length / 1024)}KB)! Using Fast Mode...`, 15);

    // Chunk the text (Gemini has a large context, but let's be safe with ~40k chars per chunk)
    const CHUNK_SIZE = 40000;
    const totalTextParts = Math.ceil(rawText.length / CHUNK_SIZE);
    const fileId = getFileId(file.name, file.size);

    // Initialize or resume progress
    let fullMarkdown = "";
    let progress: ConversionProgress = resumeFromProgress || {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks: totalTextParts,
      completedChunks: [],
      results: {},
      timestamp: Date.now(),
      mode: 'text'
    };

    // If resuming, restore completed chunks
    if (resumeFromProgress) {
      console.log(`[Resume] Continuing from ${resumeFromProgress.completedChunks.length}/${totalTextParts} chunks`);
      if (onProgress) onProgress(`🔄 Resuming... ${resumeFromProgress.completedChunks.length}/${totalTextParts} chunks already done`, 15);
    }

    for (let i = 0; i < totalTextParts; i++) {
      // Skip if already completed
      if (progress.completedChunks.includes(i)) {
        fullMarkdown += progress.results[i] + "\n\n";
        continue;
      }

      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, rawText.length);
      const chunk = rawText.substring(start, end);

      const percent = 20 + Math.floor((i / totalTextParts) * 75);
      if (onProgress) onProgress(`Formatting text chunk ${i + 1}/${totalTextParts}...`, percent);

      const mdChunk = await callGeminiWithText(chunk, apiKey, i, totalTextParts);
      fullMarkdown += mdChunk + "\n\n";

      // Save progress after each chunk
      progress.results[i] = mdChunk;
      progress.completedChunks.push(i);
      progress.timestamp = Date.now();
      saveProgress(progress);
    }

    // Clear cache on success
    clearProgress(fileId);
    if (onProgress) onProgress("Done", 100);
    return fullMarkdown;
  }

  // === FALLBACK: SLOW MODE (VISUAL / SCANNED) ===
  if (onProgress) onProgress("⚠️ Scanned PDF detected. Switching to Visual Mode (slower)...", 15);

  const CHUNK_SIZE_LIMIT = 10 * 1024 * 1024;

  if (file.size <= CHUNK_SIZE_LIMIT) {
    if (onProgress) onProgress("Uploading...", 20);
    const base64 = await blobToBase64(file);
    if (onProgress) onProgress("Gemini is reading visually...", 50);
    const result = await callGeminiWithPdfChunk(base64, 'application/pdf', apiKey, 0, 1);
    if (onProgress) onProgress("Done", 100);
    return result;
  } else {
    // Large file splitting logic
    if (onProgress) onProgress("Large scanned file. Splitting...", 20);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();
    const avgPageSize = file.size / totalPages;
    const pagesPerChunk = Math.max(1, Math.floor(CHUNK_SIZE_LIMIT / avgPageSize));
    const numChunks = Math.ceil(totalPages / pagesPerChunk);
    const fileId = getFileId(file.name, file.size);

    // Initialize or resume progress
    let fullMarkdown = "";
    let progress: ConversionProgress = resumeFromProgress || {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks: numChunks,
      completedChunks: [],
      results: {},
      timestamp: Date.now(),
      mode: 'visual'
    };

    // If resuming, restore completed chunks
    if (resumeFromProgress) {
      console.log(`[Resume] Continuing from ${resumeFromProgress.completedChunks.length}/${numChunks} chunks`);
      if (onProgress) onProgress(`🔄 Resuming... ${resumeFromProgress.completedChunks.length}/${numChunks} chunks already done`, 25);
    }

    for (let i = 0; i < totalPages; i += pagesPerChunk) {
      const chunkIndex = Math.floor(i / pagesPerChunk);

      // Skip if already completed
      if (progress.completedChunks.includes(chunkIndex)) {
        fullMarkdown += progress.results[chunkIndex] + "\n\n";
        continue;
      }

      const chunkProgress = 25 + Math.floor((chunkIndex / numChunks) * 70);
      if (onProgress) onProgress(`Visual processing chunk ${chunkIndex + 1}/${numChunks}...`, chunkProgress);

      const subDoc = await PDFDocument.create();
      const end = Math.min(i + pagesPerChunk, totalPages);
      const copyIndices = Array.from({ length: end - i }, (_, k) => i + k);
      const copiedPages = await subDoc.copyPages(pdfDoc, copyIndices);
      copiedPages.forEach((p) => subDoc.addPage(p));

      const pdfBytes = await subDoc.save();
      const chunkBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const base64 = await blobToBase64(chunkBlob);

      const chunkRes = await callGeminiWithPdfChunk(base64, 'application/pdf', apiKey, chunkIndex, numChunks);
      fullMarkdown += chunkRes + "\n\n";

      // Save progress after each chunk
      progress.results[chunkIndex] = chunkRes;
      progress.completedChunks.push(chunkIndex);
      progress.timestamp = Date.now();
      saveProgress(progress);
    }

    // Clear cache on success
    clearProgress(fileId);
    if (onProgress) onProgress("Done", 100);
    return fullMarkdown;
  }
};
