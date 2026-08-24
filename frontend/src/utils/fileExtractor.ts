// Polyfill for older Safari browsers where ReadableStream does not support async iteration or .values()
if (typeof ReadableStream !== 'undefined') {
  if (!ReadableStream.prototype.values) {
    ReadableStream.prototype.values = function () {
      const reader = this.getReader();
      return {
        async next() {
          return reader.read();
        },
        async return() {
          reader.releaseLock();
          return { done: true, value: undefined };
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      } as any;
    };
  }
  if (!ReadableStream.prototype[Symbol.asyncIterator]) {
    ReadableStream.prototype[Symbol.asyncIterator] = ReadableStream.prototype.values;
  }
}

/**
 * Extract text from a PDF file using pdfjs-dist
 * Configured for Vite bundler compatibility
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source - use CDN for reliable loading in Vite
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  const pdf = await pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
  }).promise;
  
  const textParts: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item: any) => 'str' in item)
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n\n').trim();
}

/**
 * Extract text from an image file (JPG/PNG) using Tesseract.js OCR
 */
export async function extractTextFromImage(file: File): Promise<string> {
  const Tesseract = await import('tesseract.js');
  
  const imageUrl = URL.createObjectURL(file);
  
  try {
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: () => {}, // suppress logs
    });
    return result.data.text;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Read plain text file
 */
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Auto-detect file type and extract text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const mimeType = file.type.toLowerCase();
  
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return extractTextFromPDF(file);
  }
  
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext) || mimeType.startsWith('image/')) {
    return extractTextFromImage(file);
  }
  
  if (ext === 'txt' || mimeType.startsWith('text/')) {
    return readTextFile(file);
  }
  
  throw new Error(`Unsupported file type: ${ext || mimeType}. Please upload an image, PDF, or TXT file.`);
}
