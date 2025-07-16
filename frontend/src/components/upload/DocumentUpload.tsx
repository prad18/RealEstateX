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
    
    // Initialize upload progress
    const initialUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));
    
    setUploads(initialUploads);

    try {
      const uploadedFiles: { file: File; ipfs_hash: string }[] = [];

      // Upload each file to IPFS
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        
        try {
          // Update progress to show uploading
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { ...upload, progress: 50 } : upload
          ));

          // Upload to IPFS
          const result = await ipfsService.uploadFile(file);
          
          // Update progress to show success
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { 
              ...upload, 
              progress: 100, 
              status: 'success',
              ipfs_hash: result.hash 
            } : upload
          ));

          uploadedFiles.push({ file, ipfs_hash: result.hash });
        } catch (error) {
          // Update progress to show error
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { 
              ...upload, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            } : upload
          ));
        }
      }

      // Call completion callback
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
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 10,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">        <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600">
              Drop the files here...
            </p>
          ) : (
            <div>
              <p className="text-lg font-medium">
                Drag & drop documents here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supported: PDF, PNG, JPG, JPEG (max 10 files)
              </p>
            </div>
          )}
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-medium">Upload Progress</h3>
          {uploads.map((upload, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate flex-1">
                  {upload.file.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  upload.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : upload.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {upload.status}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    upload.status === 'success' 
                      ? 'bg-green-500' 
                      : upload.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              
              {upload.error && (
                <p className="text-sm text-red-600 mt-1">
                  {upload.error}
                </p>
              )}
              
              {upload.ipfs_hash && (
                <p className="text-xs text-gray-500 mt-1">
                  IPFS: {upload.ipfs_hash.slice(0, 20)}...
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
