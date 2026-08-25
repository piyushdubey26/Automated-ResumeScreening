import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

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
    const parsed = await (pdfParse as any)(buffer);
    return parsed.text || '';
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
