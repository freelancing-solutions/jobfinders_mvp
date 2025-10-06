/**
 * File Validator Utility
 *
 * Comprehensive file validation for resume uploads including
 * MIME type verification, file size limits, and security checks.
 */

import { resumeBuilderConfig } from '@/services/resume-builder/config';
import { ResumeBuilderErrorFactory } from '@/services/resume-builder/errors';

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    extension: string;
    detectedMimeType?: string;
    isSuspicious: boolean;
  };
}

export interface SecurityCheckResult {
  isSafe: boolean;
  threats: string[];
  suspiciousPatterns: string[];
  recommendation: 'accept' | 'quarantine' | 'reject';
}

export class FileValidator {
  private readonly allowedMimeTypes: Set<string>;
  private readonly allowedExtensions: Set<string>;
  private readonly maxFileSize: number;
  private readonly suspiciousPatterns: RegExp[];

  constructor() {
    this.allowedMimeTypes = new Set(resumeBuilderConfig.fileUpload.allowedMimeTypes);
    this.allowedExtensions = new Set(resumeBuilderConfig.fileUpload.allowedExtensions);
    this.maxFileSize = resumeBuilderConfig.fileUpload.maxFileSize;
    this.suspiciousPatterns = [
      // Executable signatures
      /MZ\x90\x00/, // PE executable
      /\x7fELF/, // ELF executable
      /\xca\xfe\xba\xbe/, // Java class
      /\xfe\xed\xfa[\xce\xcf]/, // Mach-O executable

      // Script signatures
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,

      // Suspicious content patterns
      /eval\s*\(/i,
      /document\.write/i,
      /window\.location/i,
      /redirect/i,

      // Macros and embedded content
      /vbaProject/i,
      /macro/i,
      /autoexec/i,
      /document_open/i,

      // Binary patterns in text files
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,
    ];
  }

  async validateFile(file: File): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata = {
      originalName: file.name,
      fileName: this.sanitizeFileName(file.name),
      fileSize: file.size,
      mimeType: file.type,
      extension: this.getFileExtension(file.name),
      detectedMimeType: await this.detectMimeType(file),
      isSuspicious: false,
    };

    // 1. Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`);
    }

    // 2. Check file extension
    if (!this.allowedExtensions.has(metadata.extension)) {
      errors.push(`File extension .${metadata.extension} is not allowed. Allowed extensions: ${Array.from(this.allowedExtensions).join(', ')}`);
    }

    // 3. Check MIME type
    if (!this.allowedMimeTypes.has(metadata.mimeType)) {
      errors.push(`MIME type ${metadata.mimeType} is not allowed`);
    }

    // 4. Verify MIME type matches file content
    if (metadata.detectedMimeType && metadata.detectedMimeType !== metadata.mimeType) {
      warnings.push(`Declared MIME type (${metadata.mimeType}) differs from detected type (${metadata.detectedMimeType})`);
    }

    // 5. Security scan
    const securityCheck = await this.performSecurityCheck(file);
    metadata.isSuspicious = !securityCheck.isSafe;

    if (!securityCheck.isSafe) {
      errors.push(`Security scan detected threats: ${securityCheck.threats.join(', ')}`);
    }

    if (securityCheck.suspiciousPatterns.length > 0) {
      warnings.push(`Suspicious patterns detected: ${securityCheck.suspiciousPatterns.join(', ')}`);
    }

    // 6. Additional checks for specific file types
    await this.performFileTypeSpecificChecks(file, metadata, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  private async detectMimeType(file: File): Promise<string | null> {
    try {
      // Read first 512 bytes to detect MIME type
      const buffer = await this.readFileChunk(file, 0, 512);
      return this.detectMimeTypeFromBuffer(buffer, this.getFileExtension(file.name));
    } catch (error) {
      console.warn('[FileValidator] Failed to detect MIME type:', error);
      return null;
    }
  }

  private async readFileChunk(file: File, start: number, length: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const blob = file.slice(start, start + length);

      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  private detectMimeTypeFromBuffer(buffer: ArrayBuffer, extension: string): string | null {
    const bytes = new Uint8Array(buffer);

    // PDF signature: %PDF-
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return 'application/pdf';
    }

    // DOC signature: D0 CF 11 E0 (OLE2 header)
    if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
      return 'application/msword';
    }

    // DOCX signature: PK (ZIP archive)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Text file - check if it's mostly printable ASCII
    const printableChars = Array.from(bytes).filter(byte =>
      (byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13
    ).length;

    if (printableChars > bytes.length * 0.9) {
      return 'text/plain';
    }

    return null;
  }

  private async performSecurityCheck(file: File): Promise<SecurityCheckResult> {
    const threats: string[] = [];
    const suspiciousPatterns: string[] = [];
    let recommendation: 'accept' | 'quarantine' | 'reject' = 'accept';

    try {
      // Read file content for security analysis
      const buffer = await this.readFileChunk(file, 0, Math.min(file.size, 1024 * 1024)); // First 1MB
      const content = this.arrayBufferToString(buffer);

      // Check for suspicious patterns
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(content)) {
          suspiciousPatterns.push(pattern.source);

          // Escalate recommendation based on threat level
          if (pattern.source.includes('script') || pattern.source.includes('javascript')) {
            recommendation = 'reject';
            threats.push('Potential script injection detected');
          } else if (pattern.source.includes('eval') || pattern.source.includes('document.write')) {
            recommendation = 'quarantine';
            threats.push('Suspicious code pattern detected');
          }
        }
      }

      // Check for excessive binary content in text files
      if (file.type.startsWith('text/')) {
        const binaryContentRatio = this.calculateBinaryContentRatio(content);
        if (binaryContentRatio > 0.1) {
          suspiciousPatterns.push('High binary content in text file');
          recommendation = 'quarantine';
        }
      }

      // Check file name for suspicious patterns
      const suspiciousNamePatterns = [
        /\.(exe|bat|cmd|scr|pif|com)$/i,
        /(password|secret|confidential|private)/i,
        /(admin|root|system|privilege)/i,
        /(hack|crack|exploit|malware|virus)/i,
      ];

      for (const pattern of suspiciousNamePatterns) {
        if (pattern.test(file.name)) {
          suspiciousPatterns.push(`Suspicious filename: ${pattern.source}`);
          recommendation = recommendation === 'accept' ? 'quarantine' : recommendation;
        }
      }

      // Check for encrypted or password-protected files
      await this.checkForEncryption(file, threats, suspiciousPatterns);

    } catch (error) {
      console.error('[FileValidator] Security check failed:', error);
      threats.push('Security check failed');
      recommendation = 'quarantine';
    }

    return {
      isSafe: threats.length === 0,
      threats,
      suspiciousPatterns,
      recommendation,
    };
  }

  private arrayBufferToString(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let result = '';

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      // Replace non-printable characters with dots
      if (byte >= 32 && byte <= 126) {
        result += String.fromCharCode(byte);
      } else if (byte === 10) {
        result += '\n';
      } else if (byte === 13) {
        result += '\r';
      } else if (byte === 9) {
        result += '\t';
      } else {
        result += '.';
      }
    }

    return result;
  }

  private calculateBinaryContentRatio(content: string): number {
    const binaryChars = content.split('').filter(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) > 126);
    return binaryChars.length / content.length;
  }

  private async checkForEncryption(file: File, threats: string[], suspiciousPatterns: string[]): Promise<void> {
    try {
      // Read first 4KB to check for encryption signatures
      const buffer = await this.readFileChunk(file, 0, 4096);
      const bytes = new Uint8Array(buffer);

      // Common encryption signatures
      const encryptionSignatures = [
        [0xFF, 0xD8, 0xFF], // JPEG (could contain encrypted data)
        [0x89, 0x50, 0x4E, 0x47], // PNG (could contain encrypted data)
        [0x25, 0x50, 0x44, 0x46], // PDF (could be encrypted)
      ];

      for (const signature of encryptionSignatures) {
        let matches = true;
        for (let i = 0; i < signature.length; i++) {
          if (bytes[i] !== signature[i]) {
            matches = false;
            break;
          }
        }

        if (matches) {
          suspiciousPatterns.push('File format that may contain encrypted content');
          break;
        }
      }

      // Check for password-protected files
      if (file.type === 'application/pdf') {
        const content = this.arrayBufferToString(buffer.slice(0, 1024));
        if (content.includes('/Encrypt') || content.includes('/Standard')) {
          suspiciousPatterns.push('Potentially password-protected PDF');
        }
      }

    } catch (error) {
      console.warn('[FileValidator] Encryption check failed:', error);
    }
  }

  private async performFileTypeSpecificChecks(
    file: File,
    metadata: any,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    switch (metadata.extension) {
      case 'pdf':
        await this.validatePDF(file, errors, warnings);
        break;
      case 'doc':
      case 'docx':
        await this.validateWordDocument(file, errors, warnings);
        break;
      case 'txt':
        await this.validateTextFile(file, errors, warnings);
        break;
    }
  }

  private async validatePDF(file: File, errors: string[], warnings: string[]): Promise<void> {
    try {
      const buffer = await this.readFileChunk(file, 0, 1024);
      const content = this.arrayBufferToString(buffer);

      // Check PDF header
      if (!content.startsWith('%PDF-')) {
        errors.push('Invalid PDF file header');
        return;
      }

      // Check for encrypted PDF
      if (content.includes('/Encrypt')) {
        warnings.push('PDF appears to be encrypted - content may not be accessible');
      }

      // Check for corrupted PDF
      if (content.includes('Error') || content.includes('Corrupted')) {
        warnings.push('PDF may be corrupted');
      }

    } catch (error) {
      errors.push('Failed to validate PDF file');
    }
  }

  private async validateWordDocument(file: File, errors: string[], warnings: string[]): Promise<void> {
    try {
      const buffer = await this.readFileChunk(file, 0, 512);
      const bytes = new Uint8Array(buffer);

      // Check for valid Office document signature
      if (file.type.includes('openxmlformats')) {
        // DOCX files should start with PK (ZIP signature)
        if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
          errors.push('Invalid DOCX file format');
          return;
        }
      } else {
        // DOC files should start with D0 CF 11 E0 (OLE2 signature)
        if (bytes[0] !== 0xD0 || bytes[1] !== 0xCF || bytes[2] !== 0x11 || bytes[3] !== 0xE0) {
          errors.push('Invalid DOC file format');
          return;
        }
      }

      // Check for macro warnings
      const content = this.arrayBufferToString(buffer.slice(0, 200));
      if (content.toLowerCase().includes('vba')) {
        warnings.push('Document may contain macros - they will be disabled');
      }

    } catch (error) {
      errors.push('Failed to validate Word document');
    }
  }

  private async validateTextFile(file: File, errors: string[], warnings: string[]): Promise<void> {
    try {
      const buffer = await this.readFileChunk(file, 0, 1024);
      const content = this.arrayBufferToString(buffer);

      // Check for valid text content
      const binaryRatio = this.calculateBinaryContentRatio(content);
      if (binaryRatio > 0.3) {
        errors.push('File appears to be binary, not text');
      }

      // Check file encoding
      try {
        new Blob([content]).text();
      } catch {
        errors.push('File contains invalid text encoding');
      }

    } catch (error) {
      errors.push('Failed to validate text file');
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Utility method to validate uploaded file from API request
  static async validateUploadedFile(file: File): Promise<FileValidationResult> {
    const validator = new FileValidator();
    return await validator.validateFile(file);
  }
}

// Export singleton instance
export const fileValidator = new FileValidator();