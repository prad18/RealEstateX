import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ipfsService } from '@/services/ipfs';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  ipfs_hash?: string;
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: (files: { file: File; ipfs_hash: string }[]) => void;
  propertyId?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onUploadComplete, 
  propertyId 
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    const initialUploads: UploadProgress[] = acceptedFiles.map(file => ({ file, progress: 0, status: 'uploading' }));
    setUploads(initialUploads);
    try {
      const uploadedFiles: { file: File; ipfs_hash: string }[] = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        try {
          setUploads(prev => prev.map((upload, index) => index === i ? { ...upload, progress: 50 } : upload));
          const result = await ipfsService.uploadFile(file);
          setUploads(prev => prev.map((upload, index) => index === i ? { ...upload, progress: 100, status: 'success', ipfs_hash: result.hash } : upload));
          uploadedFiles.push({ file, ipfs_hash: result.hash });
        } catch (error) {
          setUploads(prev => prev.map((upload, index) => index === i ? { ...upload, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } : upload));
        }
      }
      if (onUploadComplete && uploadedFiles.length > 0) {
        onUploadComplete(uploadedFiles);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [propertyId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 10,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-white/20 hover:border-white/40'
        } ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="text-5xl">📄</div>
          {isDragActive ? (
            <p className="text-lg font-medium text-primary-400">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium text-white">Drag & drop documents here, or click to select</p>
              <p className="text-sm text-gray-400">Supported: PDF, PNG, JPG, JPEG (max 10 files)</p>
            </div>
          )}
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-white">Upload Progress</h3>
          {uploads.map((upload, index) => (
            <div key={index} className="glass-dark rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate flex-1 text-white">{upload.file.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  upload.status === 'success' ? 'bg-green-500/20 text-green-400' :
                  upload.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>{upload.status}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5"><div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    upload.status === 'success' ? 'bg-green-500' :
                    upload.status === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${upload.progress}%` }}
                /></div>
              {upload.error && <p className="text-sm text-red-400 mt-2">{upload.error}</p>}
              {upload.ipfs_hash && <p className="text-xs text-gray-400 mt-2 break-all">IPFS: {upload.ipfs_hash}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};