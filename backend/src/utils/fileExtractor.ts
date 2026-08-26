import Tesseract from 'tesseract.js';

function fallbackPdfTextExtraction(buffer: Buffer): string {
  try {
    const raw = buffer.toString('binary');
    const textMatches: string[] = [];
    const streamRegex = /stream[\r\n]+([\s\S]*?)endstream/g;
    let match;
    while ((match = streamRegex.exec(raw)) !== null) {
      const streamContent = match[1];
      const tjMatches = streamContent.match(/\(([^)]+)\)\s*Tj/g);
      if (tjMatches) {
        for (const tj of tjMatches) {
          const content = tj.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
          if (content.trim()) textMatches.push(content);
        }
      }
    }
    return textMatches.join(' ');
  } catch (e) {
    return '';
  }
}

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = require('pdf-parse');

    if (typeof pdfModule === 'function') {
      const result = await pdfModule(buffer);
      if (result && typeof result.text === 'string' && result.text.trim()) {
        return result.text;
      }
    } else if (pdfModule && typeof pdfModule.default === 'function') {
      const result = await pdfModule.default(buffer);
      if (result && typeof result.text === 'string' && result.text.trim()) {
        return result.text;
      }
    } else if (pdfModule && typeof pdfModule.PDFParse === 'function') {
      const instance = new pdfModule.PDFParse({ data: new Uint8Array(buffer) });
      const result = await instance.getText();
      if (typeof instance.destroy === 'function') {
        await instance.destroy();
      }
      const extracted = result.text || (typeof result === 'string' ? result : '');
      if (extracted && extracted.trim()) {
        return extracted;
      }
    }
  } catch (err: any) {
    console.warn('pdf-parse module error, attempting fallback text extraction:', err?.message || err);
  }

  const fallbackText = fallbackPdfTextExtraction(buffer);
  if (fallbackText && fallbackText.trim()) {
    return fallbackText;
  }

  return '';
}

/**
 * Extract text from a file buffer on the server.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const cleanMime = mimeType.toLowerCase();

  if (ext === 'pdf' || cleanMime === 'application/pdf') {
    return await parsePdfBuffer(buffer);
  }

  if (
    ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext) ||
    cleanMime.startsWith('image/')
  ) {
    const result = await Tesseract.recognize(buffer, 'eng');
    return result.data.text || '';
  }

  if (ext === 'txt' || cleanMime.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${ext || cleanMime}. Please upload a PDF, JPG, PNG, or TXT file.`);
}
