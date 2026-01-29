"use client";

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera
} from 'lucide-react';

interface MediaUploaderProps {
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  value?: File[];
  disabled?: boolean;
}

export function MediaUploader({
  onChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.webm'],
  },
  value = [],
  disabled = false,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>(value);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`;
    }
    
    const isValidType = Object.values(accept).some(types => 
      types.some(type => file.name.toLowerCase().endsWith(type))
    );
    
    if (!isValidType) {
      return `File "${file.name}" has an unsupported format`;
    }
    
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles: File[] = [];
    const newErrors: string[] = [];
    const newPreviews: string[] = [];

    Array.from(newFiles).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
        
        // Generate preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          newPreviews.push(''); // Placeholder for non-image files
        }
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors([]), 5000);
    }

    if (validFiles.length > 0) {
      const totalFiles = files.length + validFiles.length;
      if (totalFiles > maxFiles) {
        setErrors([`Maximum ${maxFiles} files allowed`]);
        return;
      }

      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onChange(updatedFiles);
    }
  }, [files, maxFiles, onChange]);

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(previews.filter((_, i) => i !== index));
    onChange(updatedFiles);
  }, [files, previews, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) {
      return <Video className="h-8 w-8 text-blue-500" />;
    }
    return <ImageIcon className="h-8 w-8 text-green-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors hover:border-primary/50 hover:bg-primary/5
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.values(accept).flat().join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
          aria-label="Upload media files"
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-primary/10">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Click or drag files to upload</p>
            <p className="text-sm text-muted-foreground">
              Photos: PNG, JPG, GIF, WebP • Videos: MP4, MOV, WebM
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {formatFileSize(maxSize)} per file, up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading... {uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress || 0} />
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="flex flex-col gap-1 p-3 bg-destructive/10 rounded-lg">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              {file.type.startsWith('image/') && previews[index] ? (
                <img
                  src={previews[index]}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {getFileIcon(file)}
                </div>
              )}
              
              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* File Info */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-xs text-white truncate">
                  {file.name.length > 15 ? file.name.slice(0, 15) + '...' : file.name}
                </p>
                <p className="text-[10px] text-white/70">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Complete Indicator */}
      {files.length > 0 && !uploading && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>{files.length} file(s) ready to upload</span>
        </div>
      )}
    </div>
  );
}
