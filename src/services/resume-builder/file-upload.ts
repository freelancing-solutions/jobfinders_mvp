/**
 * File Upload Service
 *
 * Comprehensive file upload service for resume documents with validation,
 * virus scanning, secure storage, and cleanup mechanisms.
 */

import { v4 as uuidv4 } from 'uuid';
import { ResumeBuilderErrorFactory, withServiceErrorHandling } from './errors';
import { fileValidator } from '@/lib/file-validator';
import { virusScanner } from '@/lib/virus-scanner';
import { ResumeUpload, ParsedResume } from '@/types/resume';

export interface UploadOptions {
  userId: string;
  sessionId?: string;
  requestId?: string;
  skipVirusScan?: boolean;
  quarantineIfSuspicious?: boolean;
}

export interface UploadResult {
  upload: ResumeUpload;
  validation: any;
  virusScan?: any;
  recommendations: string[];
}

export interface StoredFileInfo {
  id: string;
  originalName: string;
  storedName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  userId: string;
  metadata: Record<string, any>;
}

export class FileUploadService {
  private readonly uploadDir: string;
  private readonly cleanupInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.uploadDir = resumeBuilderConfig.fileUpload.uploadDir;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Ensure upload directory exists
    await this.ensureUploadDirectory();

    // Start cleanup timer
    this.startCleanupTimer();
  }

  private async ensureUploadDirectory(): Promise<void> {
    if (typeof window !== 'undefined') {
      console.log('[FileUploadService] Running in browser environment, skipping directory creation');
      return;
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      // Create upload directory and subdirectories
      const directories = [
        this.uploadDir,
        path.join(this.uploadDir, 'temp'),
        path.join(this.uploadDir, 'processed'),
        path.join(this.uploadDir, 'quarantine'),
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      console.log('[FileUploadService] Upload directories created successfully');
    } catch (error) {
      console.error('[FileUploadService] Failed to create upload directories:', error);
    }
  }

  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      console.log('[FileUploadService] Running in browser environment, skipping cleanup timer');
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup().catch(error => {
        console.error('[FileUploadService] Cleanup failed:', error);
      });
    }, this.cleanupInterval);

    console.log('[FileUploadService] Cleanup timer started');
  }

  async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    const requestId = options.requestId || uuidv4();
    const uploadId = uuidv4();

    try {
      // 1. Validate file
      const validation = await fileValidator.validateUploadedFile(file);
      if (!validation.isValid) {
        throw ResumeBuilderErrorFactory.validationError(
          'file_validation',
          `File validation failed: ${validation.errors.join(', ')}`,
          requestId
        );
      }

      // 2. Perform virus scan if enabled
      let virusScan;
      if (!options.skipVirusScan) {
        virusScan = await virusScanner.scanFile(file);

        if (!virusScan.isClean) {
          if (options.quarantineIfSuspicious || virusScan.recommendation === 'reject') {
            // Quarantine the file
            if (typeof window !== 'undefined') {
              throw ResumeBuilderErrorFactory.validationError(
                'virus_detected',
                `File contains threats: ${virusScan.threats.map(t => t.name).join(', ')}`,
                requestId
              );
            } else {
              await virusScanner.quarantineFile(file, `Threats detected: ${virusScan.threats.map(t => t.name).join(', ')}`);
              throw ResumeBuilderErrorFactory.validationError(
                'virus_quarantined',
                `File quarantined due to threats: ${virusScan.threats.map(t => t.name).join(', ')}`,
                requestId
              );
            }
          }
        }
      }

      // 3. Store file securely
      const storedFile = await this.storeFile(file, uploadId, options.userId);

      // 4. Create upload record
      const upload: ResumeUpload = {
        id: uploadId,
        userId: options.userId,
        originalName: file.name,
        fileName: storedFile.storedName,
        fileUrl: storedFile.storagePath,
        fileSize: file.size,
        mimeType: file.type,
        status: 'completed',
        uploadedAt: new Date(),
        processedAt: new Date(),
      };

      // 5. Generate recommendations
      const recommendations = this.generateRecommendations(validation, virusScan);

      return {
        upload,
        validation,
        virusScan,
        recommendations,
      };

    } catch (error) {
      // Create failed upload record for tracking
      const failedUpload: ResumeUpload = {
        id: uploadId,
        userId: options.userId,
        originalName: file.name,
        fileName: '',
        fileUrl: '',
        fileSize: file.size,
        mimeType: file.type,
        status: 'failed',
        uploadedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      throw error;
    }
  }

  private async storeFile(
    file: File,
    uploadId: string,
    userId: string
  ): Promise<StoredFileInfo> {
    const storedName = this.generateSecureFileName(file.name, uploadId);
    const storagePath = await this.getStoragePath(storedName, userId);

    if (typeof window === 'undefined') {
      // Node.js environment - store to filesystem
      const fs = await import('fs/promises');
      const buffer = await this.fileToArrayBuffer(file);
      await fs.writeFile(storagePath, new Uint8Array(buffer));
    } else {
      // Browser environment - store to temporary storage or upload to cloud
      // For now, return a placeholder URL
      console.log('[FileUploadService] Browser environment - file would be uploaded to cloud storage');
    }

    const storedFile: StoredFileInfo = {
      id: uploadId,
      originalName: file.name,
      storedName,
      storagePath,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      userId,
      metadata: {
        uploadId,
        validationPassed: true,
        virusScanned: true,
      },
    };

    return storedFile;
  }

  private generateSecureFileName(originalName: string, uploadId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || 'file';

    // Sanitize filename
    const sanitizedName = baseName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 50); // Limit length

    return `${timestamp}_${uploadId}_${sanitizedName}.${extension}`;
  }

  private async getStoragePath(fileName: string, userId: string): Promise<string> {
    if (typeof window === 'undefined') {
      const path = await import('path');
      const userDir = path.join(this.uploadDir, 'processed', userId);

      // Ensure user directory exists
      const fs = await import('fs/promises');
      await fs.mkdir(userDir, { recursive: true });

      return path.join(userDir, fileName);
    } else {
      // Return a URL or path for cloud storage
      return `/uploads/resumes/${userId}/${fileName}`;
    }
  }

  private generateRecommendations(validation: any, virusScan?: any): string[] {
    const recommendations: string[] = [];

    // Validation-based recommendations
    if (validation.warnings.length > 0) {
      recommendations.push(...validation.warnings.map((warning: string) => `Warning: ${warning}`));
    }

    // Virus scan-based recommendations
    if (virusScan && !virusScan.isClean) {
      if (virusScan.recommendation === 'quarantine') {
        recommendations.push('File has been quarantined due to suspicious content');
      } else {
        recommendations.push('File contains potential threats and has been blocked');
      }
    }

    // File type-specific recommendations
    if (validation.metadata.extension === 'pdf') {
      recommendations.push('Ensure PDF is not password-protected for better processing');
    }

    if (validation.metadata.extension === 'txt') {
      recommendations.push('Consider saving as PDF for better formatting preservation');
    }

    // Size-based recommendations
    if (validation.metadata.fileSize > 5 * 1024 * 1024) { // > 5MB
      recommendations.push('Large file detected. Consider optimizing file size for faster processing');
    }

    return recommendations;
  }

  async retrieveFile(uploadId: string, userId: string): Promise<{
    file: Buffer | null;
    metadata: StoredFileInfo | null;
  }> {
    try {
      if (typeof window === 'undefined') {
        const fs = await import('fs/promises');
        const path = await import('path');

        // Find file in user's processed directory
        const userDir = path.join(this.uploadDir, 'processed', userId);
        const files = await fs.readdir(userDir);

        const targetFile = files.find(file => file.includes(uploadId));
        if (!targetFile) {
          return { file: null, metadata: null };
        }

        const filePath = path.join(userDir, targetFile);
        const fileBuffer = await fs.readFile(filePath);

        const metadata: StoredFileInfo = {
          id: uploadId,
          originalName: targetFile.replace(/^\d+_([^_]+)_.*/, '$1'),
          storedName: targetFile,
          storagePath: filePath,
          fileSize: fileBuffer.length,
          mimeType: this.getMimeTypeFromExtension(targetFile),
          uploadedAt: new Date(),
          userId,
          metadata: {},
        };

        return { file: fileBuffer, metadata };
      } else {
        throw new Error('File retrieval not supported in browser environment');
      }
    } catch (error) {
      console.error('[FileUploadService] Failed to retrieve file:', error);
      return { file: null, metadata: null };
    }
  }

  async deleteFile(uploadId: string, userId: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        const fs = await import('fs/promises');
        const path = await import('path');

        // Find and delete file
        const userDir = path.join(this.uploadDir, 'processed', userId);
        const files = await fs.readdir(userDir);

        const targetFile = files.find(file => file.includes(uploadId));
        if (targetFile) {
          await fs.unlink(path.join(userDir, targetFile));
          return true;
        }

        return false;
      } else {
        throw new Error('File deletion not supported in browser environment');
      }
    } catch (error) {
      console.error('[FileUploadService] Failed to delete file:', error);
      return false;
    }
  }

  private async performCleanup(): Promise<void> {
    if (typeof window !== 'undefined') {
      return;
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      // Clean up temp directory
      await this.cleanupDirectory(path.join(this.uploadDir, 'temp'), now, maxAge);

      // Clean up old processed files
      await this.cleanupDirectory(path.join(this.uploadDir, 'processed'), now, maxAge);

      console.log('[FileUploadService] Cleanup completed successfully');
    } catch (error) {
      console.error('[FileUploadService] Cleanup failed:', error);
    }
  }

  private async cleanupDirectory(
    directoryPath: string,
    now: number,
    maxAge: number
  ): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        const stats = await fs.stat(fullPath);

        if (entry.isDirectory()) {
          // Recursively cleanup subdirectories
          await this.cleanupDirectory(fullPath, now, maxAge);

          // Remove empty directories
          try {
            const remainingEntries = await fs.readdir(fullPath);
            if (remainingEntries.length === 0) {
              await fs.rmdir(fullPath);
            }
          } catch {
            // Directory might have been deleted already
          }
        } else if (now - stats.mtime.getTime() > maxAge) {
          // Delete old files
          await fs.unlink(fullPath);
          console.log(`[FileUploadService] Deleted old file: ${fullPath}`);
        }
      }
    } catch (error) {
      console.error(`[FileUploadService] Failed to cleanup directory ${directoryPath}:`, error);
    }
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private getMimeTypeFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  async getUploadStats(userId?: string): Promise<{
    totalUploads: number;
    totalSize: number;
    averageSize: number;
    fileTypes: { [type: string]: number };
    recentUploads: number;
  }> {
    try {
      if (typeof window === 'undefined') {
        const fs = await import('fs/promises');
        const path = await import('path');

        const baseDir = userId ?
          path.join(this.uploadDir, 'processed', userId) :
          path.join(this.uploadDir, 'processed');

        const stats = {
          totalUploads: 0,
          totalSize: 0,
          averageSize: 0,
          fileTypes: {} as { [type: string]: number },
          recentUploads: 0,
        };

        try {
          const entries = await fs.readdir(baseDir, { withFileTypes: true });
          const now = Date.now();
          const recentThreshold = 24 * 60 * 60 * 1000; // 24 hours

          for (const entry of entries) {
            if (entry.isFile()) {
              const fullPath = path.join(baseDir, entry.name);
              const fileStats = await fs.stat(fullPath);

              stats.totalUploads++;
              stats.totalSize += fileStats.size;

              const extension = entry.name.split('.').pop()?.toLowerCase();
              if (extension) {
                stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
              }

              if (now - fileStats.mtime.getTime() < recentThreshold) {
                stats.recentUploads++;
              }
            }
          }

          if (stats.totalUploads > 0) {
            stats.averageSize = Math.round(stats.totalSize / stats.totalUploads);
          }
        } catch {
          // Directory doesn't exist or is empty
        }

        return stats;
      } else {
        // Browser environment - return mock stats
        return {
          totalUploads: 0,
          totalSize: 0,
          averageSize: 0,
          fileTypes: {},
          recentUploads: 0,
        };
      }
    } catch (error) {
      console.error('[FileUploadService] Failed to get upload stats:', error);
      return {
        totalUploads: 0,
        totalSize: 0,
        averageSize: 0,
        fileTypes: {},
        recentUploads: 0,
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();

// Export error-wrapped methods for use in routes
export const wrappedFileUploadService = {
  uploadFile: withServiceErrorHandling(fileUploadService.uploadFile.bind(fileUploadService), 'uploadFile'),
  retrieveFile: withServiceErrorHandling(fileUploadService.retrieveFile.bind(fileUploadService), 'retrieveFile'),
  deleteFile: withServiceErrorHandling(fileUploadService.deleteFile.bind(fileUploadService), 'deleteFile'),
  getUploadStats: withServiceErrorHandling(fileUploadService.getUploadStats.bind(fileUploadService), 'getUploadStats'),
};