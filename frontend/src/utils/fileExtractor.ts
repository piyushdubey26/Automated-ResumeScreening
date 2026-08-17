import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n\n');
}

/**
 * Extract text from an image file (JPG/PNG) using Tesseract.js OCR
 */
export async function extractTextFromImage(file: File): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  
  const worker = await createWorker('eng');
  
  const imageUrl = URL.createObjectURL(file);
  
  try {
    const { data: { text } } = await worker.recognize(imageUrl);
    return text;
  } finally {
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);
  }
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
    return file.text();
  }
  
  throw new Error(`Unsupported file type: ${ext || mimeType}`);
}
