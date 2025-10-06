/**
 * Text Extractor Utility
 *
 * Extracts text content from various file formats including PDF, DOC, DOCX,
 * and TXT files with error handling and format-specific optimizations.
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractionResult {
  text: string;
  metadata: {
    pageCount?: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    format: string;
    extractedAt: Date;
    processingTime: number;
  };
  errors: string[];
  warnings: string[];
}

export interface ExtractionOptions {
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  maxPages?: number;
  quality?: 'fast' | 'balanced' | 'accurate';
}

export class TextExtractor {
  private readonly defaultOptions: ExtractionOptions = {
    preserveFormatting: false,
    includeMetadata: true,
    maxPages: 50,
    quality: 'balanced',
  };

  async extractText(
    file: File | Buffer,
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };
    const result: ExtractionResult = {
      text: '',
      metadata: {
        format: 'unknown',
        extractedAt: new Date(),
        processingTime: 0,
      },
      errors: [],
      warnings: [],
    };

    try {
      // Determine file format
      const format = this.detectFileFormat(file);
      result.metadata.format = format;

      // Extract text based on format
      switch (format) {
        case 'pdf':
          await this.extractFromPDF(file, result, mergedOptions);
          break;
        case 'docx':
          await this.extractFromDOCX(file, result, mergedOptions);
          break;
        case 'doc':
          await this.extractFromDOC(file, result, mergedOptions);
          break;
        case 'txt':
          await this.extractFromText(file, result, mergedOptions);
          break;
        default:
          result.errors.push(`Unsupported file format: ${format}`);
      }

      // Post-process extracted text
      result.text = this.postProcessText(result.text, mergedOptions);

    } catch (error) {
      result.errors.push(
        `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    result.metadata.processingTime = Date.now() - startTime;
    return result;
  }

  private detectFileFormat(file: File | Buffer): string {
    if (file instanceof File) {
      const mimeType = file.type.toLowerCase();
      const extension = file.name.split('.').pop()?.toLowerCase();

      // Check MIME type first
      if (mimeType === 'application/pdf') return 'pdf';
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
      if (mimeType === 'application/msword') return 'doc';
      if (mimeType === 'text/plain') return 'txt';

      // Fallback to extension
      if (extension === 'pdf') return 'pdf';
      if (extension === 'docx') return 'docx';
      if (extension === 'doc') return 'doc';
      if (extension === 'txt') return 'txt';
    }

    // For Buffer, check magic bytes
    if (file instanceof Buffer) {
      if (file.length >= 4) {
        // PDF signature: %PDF-
        if (file[0] === 0x25 && file[1] === 0x50 && file[2] === 0x44 && file[3] === 0x46) {
          return 'pdf';
        }

        // DOC signature: D0 CF 11 E0
        if (file[0] === 0xD0 && file[1] === 0xCF && file[2] === 0x11 && file[3] === 0xE0) {
          return 'doc';
        }

        // DOCX signature: PK (ZIP)
        if (file[0] === 0x50 && file[1] === 0x4B) {
          return 'docx';
        }
      }

      // Check if it's text content
      const textContent = file.toString('utf8', 0, Math.min(1024, file.length));
      const printableChars = textContent.replace(/[^\x20-\x7E\r\n\t]/g, '').length;
      if (printableChars / textContent.length > 0.9) {
        return 'txt';
      }
    }

    return 'unknown';
  }

  private async extractFromPDF(
    file: File | Buffer,
    result: ExtractionResult,
    options: ExtractionOptions
  ): Promise<void> {
    try {
      const buffer = await this.fileToBuffer(file);

      // Configure PDF parsing options based on quality setting
      const pdfOptions: any = {
        normalizeWhitespace: true,
        disableCombineTextItems: options.quality === 'fast',
      };

      if (options.maxPages) {
        pdfOptions.max = options.maxPages;
      }

      const data = await pdfParse(buffer, pdfOptions);

      result.text = data.text;

      if (options.includeMetadata && data.info) {
        result.metadata = {
          ...result.metadata,
          pageCount: data.numpages,
          title: data.info.Title,
          author: data.info.Author,
          subject: data.info.Subject,
          creator: data.info.Creator,
          producer: data.info.Producer,
          creationDate: data.info.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modificationDate: data.info.ModDate ? new Date(data.info.ModDate) : undefined,
        };
      }

      // Check for encrypted PDFs
      if (data.info?.Encrypted) {
        result.warnings.push('PDF is encrypted - some content may not be accessible');
      }

      // Check for scanned images (low text ratio)
      if (data.text && data.text.length < 100 && data.numpages > 1) {
        result.warnings.push('PDF may contain scanned images - OCR may be required');
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('password')) {
          result.errors.push('PDF is password protected and cannot be processed');
        } else if (error.message.includes('corrupted')) {
          result.errors.push('PDF file appears to be corrupted');
        } else {
          result.errors.push(`PDF processing error: ${error.message}`);
        }
      }
    }
  }

  private async extractFromDOCX(
    file: File | Buffer,
    result: ExtractionResult,
    options: ExtractionOptions
  ): Promise<void> {
    try {
      const buffer = await this.fileToBuffer(file);

      const mammothOptions = {
        convertImage: mammoth.images.imgElement(() => ({ src: '' })), // Ignore images
        styleMap: [
          'p[style-name=\'Heading 1\'] => h1:fresh',
          'p[style-name=\'Heading 2\'] => h2:fresh',
          'p[style-name=\'Heading 3\'] => h3:fresh',
          'p[style-name=\'Title\'] => h1:title:fresh',
          'r[style-name=\'Strong\'] => strong',
          'r[style-name=\'Emphasis\'] => em',
        ],
        includeDefaultStyleMap: true,
        ignoreEmptyParagraphs: true,
      };

      const mammothResult = await mammoth.extractRawText({ arrayBuffer: buffer }, mammothOptions);

      result.text = mammothResult.value;

      // Extract metadata if available
      if (options.includeMetadata) {
        try {
          const metadataResult = await mammoth.extractRawText({ arrayBuffer: buffer });
          // DOCX metadata extraction would require additional processing
          // For now, we'll add basic metadata
          result.metadata = {
            ...result.metadata,
            title: this.extractTitleFromText(mammothResult.value),
          };
        } catch (error) {
          result.warnings.push('Could not extract DOCX metadata');
        }
      }

      // Check for conversion messages
      if (mammothResult.messages && mammothResult.messages.length > 0) {
        mammothResult.messages.forEach(message => {
          if (message.type === 'warning') {
            result.warnings.push(`DOCX conversion warning: ${message.message}`);
          }
        });
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('corrupted')) {
          result.errors.push('DOCX file appears to be corrupted');
        } else {
          result.errors.push(`DOCX processing error: ${error.message}`);
        }
      }
    }
  }

  private async extractFromDOC(
    file: File | Buffer,
    result: ExtractionResult,
    options: ExtractionOptions
  ): Promise<void> {
    try {
      const buffer = await this.fileToBuffer(file);

      // For DOC files, we'll use a simplified approach
      // In a production environment, you might want to use antiword or similar tools
      const mammothResult = await mammoth.extractRawText({ arrayBuffer: buffer });

      result.text = mammothResult.value;

      if (options.includeMetadata) {
        result.metadata = {
          ...result.metadata,
          title: this.extractTitleFromText(mammothResult.value),
        };
      }

      // DOC files often have formatting issues
      result.warnings.push('DOC files may have formatting limitations - consider using DOCX format for better results');

    } catch (error) {
      if (error instanceof Error) {
        result.errors.push(`DOC processing error: ${error.message}`);
      }
    }
  }

  private async extractFromText(
    file: File | Buffer,
    result: ExtractionResult,
    options: ExtractionOptions
  ): Promise<void> {
    try {
      let text = '';

      if (file instanceof File) {
        text = await file.text();
      } else {
        text = file.toString('utf8');
      }

      result.text = text;

      if (options.includeMetadata) {
        // Extract basic metadata from text content
        result.metadata = {
          ...result.metadata,
          title: this.extractTitleFromText(text),
        };
      }

      // Check encoding issues
      const hasInvalidChars = /[^\x20-\x7E\r\n\t\u00A0-\uFFFF]/.test(text);
      if (hasInvalidChars) {
        result.warnings.push('Text file contains invalid characters - encoding issues may exist');
      }

    } catch (error) {
      if (error instanceof Error) {
        result.errors.push(`Text processing error: ${error.message}`);
      }
    }
  }

  private async fileToBuffer(file: File | Buffer): Promise<Buffer> {
    if (file instanceof Buffer) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(Buffer.from(reader.result));
        } else {
          reject(new Error('Failed to convert file to buffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private extractTitleFromText(text: string): string | undefined {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Look for title patterns
    const titlePatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+/, // Two words with capital letters
      /^[A-Z\s]+$/, // All caps
      /^.{20,60}$/, // Medium length line
    ];

    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      for (const pattern of titlePatterns) {
        if (pattern.test(line) && !line.toLowerCase().includes('resume') && !line.toLowerCase().includes('curriculum')) {
          return line;
        }
      }
    }

    // If no pattern matches, return the first non-empty line if it's reasonable
    const firstLine = lines[0];
    if (firstLine && firstLine.length > 5 && firstLine.length < 100) {
      return firstLine;
    }

    return undefined;
  }

  private postProcessText(text: string, options: ExtractionOptions): string {
    if (!text) return '';

    let processedText = text;

    // Basic cleanup
    processedText = processedText
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
      .replace(/[ \t]+/g, ' ') // Normalize whitespace
      .replace(/^\s+|\s+$/gm, ''); // Trim lines

    if (!options.preserveFormatting) {
      // Remove extra formatting artifacts
      processedText = processedText
        .replace(/\f/g, '\n') // Form feeds to newlines
        .replace(/\x0B/g, '\n') // Vertical tabs to newlines
        .replace(/\t+/g, ' ') // Tabs to single spaces
        .replace(/ {2,}/g, ' '); // Multiple spaces to single
    }

    // Fix common PDF extraction artifacts
    processedText = processedText
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lower and upper case
      .replace(/(\w)(\d)/g, '$1 $2') // Space between words and numbers
      .replace(/(\d)(\w)/g, '$1 $2') // Space between numbers and words
      .replace(/([.,!?;:])([a-zA-Z])/g, '$1 $2'); // Space after punctuation

    // Remove page numbers and headers/footers
    processedText = processedText
      .replace(/^\d+\s*$/gm, '') // Standalone numbers (page numbers)
      .replace(/^Page\s+\d+\s*of\s+\d+\s*$/gmi, '') // Page X of Y
      .replace(/^\s*[©•]\s*\d+\s*$/gm, ''); // Footer markers

    return processedText.trim();
  }

  // Utility method to extract text from a file path (for server-side processing)
  async extractTextFromPath(filePath: string, options: ExtractionOptions = {}): Promise<ExtractionResult> {
    if (typeof window !== 'undefined') {
      throw new Error('File path extraction is not supported in browser environment');
    }

    try {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);

      // Create a mock File object for processing
      const file = new File([buffer], filePath, { type: 'application/octet-stream' });

      return await this.extractText(file, options);
    } catch (error) {
      return {
        text: '',
        metadata: {
          format: 'unknown',
          extractedAt: new Date(),
          processingTime: 0,
        },
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }

  // Method to validate if text extraction was successful
  validateExtractionResult(result: ExtractionResult): {
    isValid: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
  } {
    const issues: string[] = [];
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

    // Check text length
    if (result.text.length < 50) {
      issues.push('Extracted text is very short');
      quality = 'poor';
    } else if (result.text.length < 200) {
      issues.push('Extracted text is quite short');
      quality = 'fair';
    }

    // Check for extraction errors
    if (result.errors.length > 0) {
      issues.push(`Extraction errors: ${result.errors.join(', ')}`);
      quality = 'poor';
    }

    // Check for warnings
    if (result.warnings.length > 2) {
      issues.push(`Multiple warnings during extraction: ${result.warnings.join(', ')}`);
      if (quality !== 'poor') quality = 'fair';
    }

    // Check text quality
    const wordCount = result.text.split(/\s+/).length;
    const averageWordLength = result.text.replace(/\s/g, '').length / wordCount;

    if (averageWordLength < 3) {
      issues.push('Unusual word patterns detected - possible extraction issues');
      quality = quality === 'excellent' ? 'good' : quality;
    }

    // Check for common extraction artifacts
    const artifactCount = [
      /\f/.test(result.text),
      /\x0B/.test(result.text),
      /[a-z][A-Z][a-z]/.test(result.text),
    ].filter(Boolean).length;

    if (artifactCount > 1) {
      issues.push('Formatting artifacts detected in extracted text');
      if (quality === 'excellent') quality = 'good';
    }

    return {
      isValid: result.errors.length === 0 && wordCount > 10,
      quality,
      issues,
    };
  }
}

// Export singleton instance
export const textExtractor = new TextExtractor();