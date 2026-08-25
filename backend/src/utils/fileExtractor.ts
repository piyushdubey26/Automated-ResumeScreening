import Tesseract from 'tesseract.js';

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const pdfModule = require('pdf-parse');

  if (typeof pdfModule === 'function') {
    const result = await pdfModule(buffer);
    return result.text || '';
  }

  if (pdfModule && typeof pdfModule.default === 'function') {
    const result = await pdfModule.default(buffer);
    return result.text || '';
  }

  if (pdfModule && typeof pdfModule.PDFParse === 'function') {
    const instance = new pdfModule.PDFParse({ data: new Uint8Array(buffer) });
    const result = await instance.getText();
    if (typeof instance.destroy === 'function') {
      await instance.destroy();
    }
    return result.text || (typeof result === 'string' ? result : '');
  }

  throw new Error('PDF parsing library is unavailable.');
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
