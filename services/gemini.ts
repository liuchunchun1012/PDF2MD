
import { GoogleGenAI } from "@google/genai";
import { PDFDocument } from 'pdf-lib';

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

const callGeminiWithChunk = async (base64Data: string, mimeType: string, apiKey: string, partIndex: number, totalParts: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    // Customize prompt based on if it's a part of a larger document
    const promptText = totalParts > 1
      ? `Convert this section (Part ${partIndex + 1} of ${totalParts}) of a PDF document into clean, structured Markdown. 
             Preserve headers, tables, and lists. 
             Do NOT start page numbers from 1 if this looks like the middle of a chapter. 
             Do NOT include front matter or table of contents if this is a later section.`
      : "Convert the attached PDF document into clean, well-structured Markdown. Preserve headers, tables, and lists exactly as they appear.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        systemInstruction: `You are a precise document conversion assistant. 
            Your task is to extract text from PDF files and format it as Markdown.
            
            Rules:
            - Do not strip out content.
            - Format tables using Markdown table syntax.
            - Do not include 'Here is the markdown' preamble.
            - Do not use markdown code fences (\`\`\`markdown) in the output.
            - Ignore images (do not describe them).`
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No content generated from the model.");
    }

    // Cleanup
    return text.replace(/^```markdown\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
  } catch (error) {
    console.error("[Gemini Service] Error in callGeminiWithChunk:", error);
    throw error;
  }
}


export const convertPdfToMarkdown = async (
  file: File,
  apiKey: string,
  onProgress?: (message: string, percent: number) => void
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // 1. Determine if splitting is needed
  // Safe limit for Base64 payload is roughly 14-15MB. We set a conservative 10MB limit per chunk for the split.
  // The API allows 20MB, but Base64 overhead (x1.33) means file size must be smaller.
  const CHUNK_SIZE_LIMIT = 10 * 1024 * 1024;

  if (file.size <= CHUNK_SIZE_LIMIT) {
    if (onProgress) onProgress("Uploading...", 20);
    const base64 = await blobToBase64(file);

    if (onProgress) onProgress("Gemini is reading...", 50);

    // Fix MIME type
    let mimeType = file.type;
    if (!mimeType || mimeType === '' || mimeType === 'application/octet-stream') {
      mimeType = 'application/pdf';
    }

    try {
      const result = await callGeminiWithChunk(base64, mimeType, apiKey, 0, 1);
      if (onProgress) onProgress("Done", 100);
      return result;
    } catch (error: unknown) {
      // Enhance error message for 400s
      if (error instanceof Error) {
        if (error.toString().includes("400") || (error.message && error.message.includes("INVALID_ARGUMENT"))) {
          throw new Error("Invalid request format. This usually happens if the PDF is encrypted, corrupted, or has an unrecognized format.");
        }
      }
      throw error;
    }
  } else {
    // --- LARGE FILE HANDLING (MEMORY OPTIMIZED) ---
    if (onProgress) onProgress("Large file detected. Analyzing...", 5);

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (onProgress) onProgress("Loading PDF structure...", 10);
      // Load the document. This is the heaviest memory operation.
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      // Estimate pages per chunk
      // Avg size per page = Total Size / Total Pages
      // Target chunk size = 10MB
      const avgPageSize = file.size / totalPages;
      const pagesPerChunk = Math.max(1, Math.floor(CHUNK_SIZE_LIMIT / avgPageSize));

      const numChunks = Math.ceil(totalPages / pagesPerChunk);
      let fullMarkdown = "";

      if (onProgress) onProgress(`Splitting into ${numChunks} parts...`, 15);

      // SEQUENTIAL PROCESSING LOOP (MEMORY OPTIMIZED)
      // Instead of creating all chunks at once, we create one, process it, and let it get garbage collected.
      for (let i = 0; i < totalPages; i += pagesPerChunk) {
        const chunkIndex = Math.floor(i / pagesPerChunk);
        const chunkProgress = 20 + Math.floor((chunkIndex / numChunks) * 75); // Map 20-95%

        if (onProgress) onProgress(`Converting part ${chunkIndex + 1} of ${numChunks}...`, chunkProgress);

        // 1. Create a temporary sub-document
        const subDoc = await PDFDocument.create();
        const end = Math.min(i + pagesPerChunk, totalPages);
        const pageIndices = Array.from({ length: end - i }, (_, k) => i + k);

        const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => subDoc.addPage(page));

        // 2. Save ONLY this chunk to bytes
        const pdfBytes = await subDoc.save();

        // 3. Convert to Base64
        const chunkBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const base64 = await blobToBase64(chunkBlob);

        // 4. Send to Gemini
        const chunkMarkdown = await callGeminiWithChunk(base64, 'application/pdf', apiKey, chunkIndex, numChunks);
        fullMarkdown += chunkMarkdown + "\n\n";

        // At the end of this iteration, subDoc, pdfBytes, chunkBlob, and base64 go out of scope 
        // and are eligible for garbage collection.
      }

      if (onProgress) onProgress("Finalizing...", 100);
      return fullMarkdown;

    } catch (err) {
      console.error("Splitting error", err);
      throw new Error("Failed to process large file. Ensure your device has enough memory (RAM) and the PDF is not password protected.");
    }
  }
};
