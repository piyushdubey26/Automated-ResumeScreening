import { api } from '../services/api';

/**
 * Read plain text file locally in browser
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
 * Auto-detect file type and extract text.
 * TXT files are parsed locally in browser.
 * PDF & Images are uploaded to backend server for parsing/OCR.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const mimeType = file.type.toLowerCase();

  // Handle plain text files locally
  if (ext === 'txt' || mimeType.startsWith('text/')) {
    return readTextFile(file);
  }

  // Handle PDF & Images server-side to avoid client-side MIME issues
  if (
    ext === 'pdf' ||
    mimeType === 'application/pdf' ||
    ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext) ||
    mimeType.startsWith('image/')
  ) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/resumes/extract-text', formData);

      // Handle HTML redirects or errors returned as HTML
      if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
        throw new Error('Resume upload service is temporarily unavailable. Please try again.');
      }

      if (response.data && response.data.success) {
        return response.data.text;
      }
      throw new Error(response.data?.error || 'Failed to extract text from file.');
    } catch (err: any) {
      console.error('Server extraction failed:', err);
      
      // Handle HTTP error responses from server
      const status = err.response?.status;
      if (status === 401) {
        throw new Error('Your session expired. Please log in again.');
      }
      if (status === 403) {
        throw new Error(err.response?.data?.error || 'Your current plan does not allow this feature.');
      }
      if (status === 413) {
        throw new Error('File is too large. File must be 10MB or smaller.');
      }
      if (status === 415) {
        throw new Error('Unsupported file type.');
      }
      if (status === 500) {
        throw new Error(err.response?.data?.error || 'Resume processing failed. Please try again.');
      }
      
      const responseData = err.response?.data;
      if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
        throw new Error('Resume upload service is temporarily unavailable. Please try again.');
      }
      
      // If network error (cannot reach server / connection refused)
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Unable to reach the server. Please check your connection or backend status.');
      }
      
      throw new Error(
        responseData?.error || 
        err.message || 
        'Resume processing failed. Please try again.'
      );
    }
  }

  throw new Error(`Unsupported file type: ${ext || mimeType}. Please upload a PDF, JPG, PNG, or TXT file.`);
}
