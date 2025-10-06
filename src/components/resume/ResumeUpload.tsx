/**
 * Resume Upload Component
 *
 * React component for uploading resume files with progress tracking,
 * validation feedback, and error handling.
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, File, AlertCircle, CheckCircle, X, Shield, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UploadResult {
  upload: {
    id: string;
    originalName: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata: any;
  };
  virusScan?: {
    isClean: boolean;
    threats: Array<{
      type: string;
      name: string;
      description: string;
      severity: string;
    }>;
    recommendation: string;
    confidence: number;
  };
  recommendations: string[];
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: UploadResult;
}

interface ResumeUploadProps {
  userId: string;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
  showAdvanced?: boolean;
}

export function ResumeUpload({
  userId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  className,
  showAdvanced = false,
}: ResumeUploadProps) {
  const { toast } = useToast();
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [isDragActive, setIsDragActive] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (mimeType: string) => {
    switch (mimeType) {
      case 'application/pdf':
        return '📄';
      case 'application/msword':
        return '📝';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return '📄';
      case 'text/plain':
        return '📃';
      default:
        return '📄';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];

    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return errors;
  };

  const uploadFile = async (file: File) => {
    const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create abort controller for this upload
    abortControllerRef.current = new AbortController();

    try {
      setUploadState({ status: 'uploading', progress: 0 });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requestId', requestId);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadState(prev => ({ ...prev, progress }));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setUploadState({
                status: 'completed',
                progress: 100,
                result: response.data
              });
              onUploadComplete?.(response.data);

              toast({
                title: 'Upload successful',
                description: `${file.name} has been uploaded and processed successfully.`,
              });
            } else {
              throw new Error(response.error?.message || 'Upload failed');
            }
          } catch (error) {
            throw new Error('Invalid response from server');
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            throw new Error(errorResponse.error?.message || `Upload failed with status ${xhr.status}`);
          } catch {
            throw new Error(`Upload failed with status ${xhr.status}`);
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });

      xhr.addEventListener('abort', () => {
        throw new Error('Upload was cancelled');
      });

      // Configure and send request
      xhr.open('POST', '/api/resume-builder/upload');
      xhr.setRequestHeader('X-Request-ID', requestId);
      xhr.timeout = 300000; // 5 minutes timeout

      // Check for abort signal
      abortControllerRef.current.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      xhr.send(formData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      setUploadState({
        status: 'error',
        progress: 0,
        error: errorMessage
      });

      onUploadError?.(errorMessage);

      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragActive(false);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.flatMap(({ file, errors }) =>
        errors.map((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              return `${file.name} is too large (max ${formatFileSize(maxFileSize)})`;
            case 'file-invalid-type':
              return `${file.name} is not a supported file type`;
            default:
              return `${file.name}: ${error.message}`;
          }
        })
      );

      toast({
        title: 'Invalid files',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]; // Only handle first file for now

      const validationErrors = validateFile(file);
      if (validationErrors.length > 0) {
        toast({
          title: 'Validation error',
          description: validationErrors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      uploadFile(file);
    }
  }, [maxFileSize, allowedTypes, onUploadComplete, onUploadError, toast]);

  const { getRootProps, getInputProps, isDragActive: isDropzoneActive } = useDropzone({
    onDrop: handleDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [`.${type.split('/').pop()}`];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    multiple: false,
    disabled: uploadState.status === 'uploading' || uploadState.status === 'processing',
  });

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploadState({ status: 'idle', progress: 0 });
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0 });
    abortControllerRef.current = null;
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5" />
          Upload Resume
        </CardTitle>
        <CardDescription>
          Upload your resume in PDF, DOC, DOCX, or TXT format.
          Maximum file size: {formatFileSize(maxFileSize)}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area */}
        {uploadState.status === 'idle' && (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive || isDropzoneActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
          >
            <input {...getInputProps()} />
            <CloudUpload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive || isDropzoneActive
                ? 'Drop your resume here'
                : 'Drag and drop your resume here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['PDF', 'DOC', 'DOCX', 'TXT'].map(type => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {uploadState.status === 'uploading' ? 'Uploading...' : 'Processing...'}
              </span>
              <span className="text-sm text-muted-foreground">
                {uploadState.progress}%
              </span>
            </div>
            <Progress value={uploadState.progress} className="w-full" />
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelUpload}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadState.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>{uploadState.error}</AlertDescription>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={resetUpload}>
                Try again
              </Button>
            </div>
          </Alert>
        )}

        {/* Upload Success */}
        {uploadState.status === 'completed' && uploadState.result && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Upload successful</AlertTitle>
              <AlertDescription>
                Your resume has been uploaded and processed successfully.
              </AlertDescription>
            </Alert>

            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(uploadState.result.validation.metadata.mimeType)}</span>
                <div>
                  <p className="font-medium">{uploadState.result.upload.originalName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadState.result.upload.fileSize)} •
                    Uploaded at {new Date(uploadState.result.upload.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Validation Results */}
            {showAdvanced && (
              <div className="space-y-3">
                <h4 className="font-medium">Validation Results</h4>

                {/* Warnings */}
                {uploadState.result.validation.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {uploadState.result.validation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Virus Scan Results */}
                {uploadState.result.virusScan && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Security Scan</span>
                      <Badge variant={uploadState.result.virusScan.isClean ? 'default' : 'destructive'}>
                        {uploadState.result.virusScan.isClean ? 'Clean' : 'Threats Detected'}
                      </Badge>
                    </div>

                    {!uploadState.result.virusScan.isClean && (
                      <div className="space-y-2">
                        {uploadState.result.virusScan.threats.map((threat, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-destructive/10 rounded">
                            <Badge variant={getSeverityColor(threat.severity)}>
                              {threat.severity}
                            </Badge>
                            <span className="text-sm">{threat.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {uploadState.result.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Recommendations</h5>
                    <ul className="space-y-1">
                      {uploadState.result.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Button onClick={resetUpload} className="w-full">
              Upload Another Resume
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}