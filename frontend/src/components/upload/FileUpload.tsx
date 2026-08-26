import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, X, Loader2, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { extractTextFromFile } from '../../utils/fileExtractor';

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
  label?: string;
  accept?: string;
  helpText?: string;
  disabled?: boolean;
  disabledMessage?: string;
  onUpgradeClick?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onTextExtracted,
  label = 'Upload Resume',
  accept = '.pdf,.jpg,.jpeg,.png,.txt',
  helpText = 'Supports PDF, JPG, PNG, TXT files',
  disabled = false,
  disabledMessage = "Monthly resume review limit reached. You've used all 5 free resume reviews this month. Upgrade your plan to continue.",
  onUpgradeClick
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

    // Extension/Type check
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'bmp', 'txt'];
    if (!allowedExts.includes(ext)) {
      setError('Unsupported file type.');
      setIsProcessing(false);
      return;
    }

    // Size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be 10MB or smaller.');
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
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDrop={disabled ? undefined : handleDrop}
        onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
          disabled
            ? 'border-amber-500/30 bg-amber-500/5 cursor-not-allowed'
            : isDragging
            ? 'border-indigo-500 bg-indigo-500/10 cursor-pointer'
            : fileName && !error
            ? 'border-emerald-500/50 bg-emerald-500/5 cursor-pointer'
            : error
            ? 'border-rose-500/50 bg-rose-500/5 cursor-pointer'
            : 'border-slate-700 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-900/50 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleFileSelect}
          className="hidden"
        />

        {disabled ? (
          <div className="flex flex-col items-center space-y-3 text-center p-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">Monthly resume review limit reached</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{disabledMessage}</p>
            </div>
            {onUpgradeClick && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUpgradeClick(); }}
                className="mt-1 inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-[#a84c38] text-white text-xs font-bold rounded-xl hover:opacity-95 transition-opacity"
              >
                <span>Upgrade Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : isProcessing ? (
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
