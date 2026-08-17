import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, X, Loader2, CheckCircle2 } from 'lucide-react';
import { extractTextFromFile } from '../../utils/fileExtractor';

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
  label?: string;
  accept?: string;
  helpText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onTextExtracted,
  label = 'Upload Resume',
  accept = '.pdf,.jpg,.jpeg,.png,.txt',
  helpText = 'Supports PDF, JPG, PNG, TXT files'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);
    
    const ext = file.name.toLowerCase().split('.').pop() || '';
    setFileType(ext);

    // Size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      setIsProcessing(false);
      return;
    }

    try {
      if (ext === 'pdf') {
        setProgress('Extracting text from PDF...');
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        setProgress('Running OCR on image (this may take a moment)...');
      } else {
        setProgress('Reading text file...');
      }
      
      const text = await extractTextFromFile(file);
      
      if (!text || text.trim().length < 10) {
        setError('Could not extract enough text from this file. Try a different format or paste text manually.');
        setIsProcessing(false);
        return;
      }

      setProgress('');
      onTextExtracted(text);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, [onTextExtracted]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }, [processFile]);

  const clearFile = useCallback(() => {
    setFileName(null);
    setFileType(null);
    setError(null);
    setProgress('');
  }, []);

  const getFileIcon = () => {
    if (fileType && ['jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
      return <Image className="w-5 h-5 text-pink-400" />;
    }
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-400">{label}</label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : fileName && !error
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : error
            ? 'border-rose-500/50 bg-rose-500/5'
            : 'border-slate-700 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-900/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-xs text-indigo-300 font-medium">{progress}</span>
          </div>
        ) : fileName && !error ? (
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div className="text-left">
              <p className="text-xs font-bold text-white truncate max-w-[200px]">{fileName}</p>
              <p className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Text extracted successfully</span>
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-300 font-medium">
                <span className="text-indigo-400 font-bold">Click to upload</span> or drag & drop
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{helpText}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
