/**
 * Virus Scanner Utility
 *
 * Security scanning for uploaded files using multiple virus scanning
 * services and local heuristics to ensure file safety.
 */

import { ResumeBuilderErrorFactory } from '@/services/resume-builder/errors';

export interface ScanResult {
  isClean: boolean;
  threats: ThreatInfo[];
  scanDuration: number;
  engines: EngineResult[];
  recommendation: 'accept' | 'quarantine' | 'reject';
  confidence: number; // 0-100
}

export interface ThreatInfo {
  type: 'virus' | 'malware' | 'suspicious' | 'false_positive';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  engine?: string;
}

export interface EngineResult {
  name: string;
  version: string;
  updateDate: string;
  scanDuration: number;
  threats: number;
  status: 'ok' | 'infected' | 'error';
  error?: string;
}

export interface ScannerConfig {
  enabled: boolean;
  engines: {
    clamAV?: boolean;
    virusTotal?: boolean;
    local: boolean;
  };
  timeout: number; // milliseconds
  maxFileSize: number; // bytes
  quarantineDir: string;
  alertThreshold: number; // 0-100
}

export class VirusScanner {
  private config: ScannerConfig;
  private clamAV?: any;
  private virusTotalAPIKey?: string;

  constructor(config?: Partial<ScannerConfig>) {
    this.config = {
      enabled: true,
      engines: {
        clamAV: false, // Disabled by default as it requires server setup
        virusTotal: false, // Disabled by default as it requires API key
        local: true, // Always enabled
      },
      timeout: 30000, // 30 seconds
      maxFileSize: 50 * 1024 * 1024, // 50MB
      quarantineDir: './quarantine',
      alertThreshold: 70, // 70% confidence threshold
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[VirusScanner] Virus scanning is disabled');
      return;
    }

    // Initialize ClamAV if available
    if (this.config.engines.clamAV) {
      try {
        // Try to import and initialize ClamAV
        // This would require node-clam package and proper setup
        console.log('[VirusScanner] ClamAV integration not implemented in this environment');
      } catch (error) {
        console.warn('[VirusScanner] Failed to initialize ClamAV:', error);
        this.config.engines.clamAV = false;
      }
    }

    // Initialize VirusTotal if API key is available
    if (this.config.engines.virusTotal) {
      this.virusTotalAPIKey = process.env.VIRUSTOTAL_API_KEY;
      if (!this.virusTotalAPIKey) {
        console.warn('[VirusScanner] VirusTotal API key not configured');
        this.config.engines.virusTotal = false;
      }
    }

    // Ensure quarantine directory exists
    if (typeof window === 'undefined') { // Node.js environment
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        await fs.mkdir(this.config.quarantineDir, { recursive: true });
      } catch (error) {
        console.warn('[VirusScanner] Failed to create quarantine directory:', error);
      }
    }
  }

  async scanFile(file: File): Promise<ScanResult> {
    if (!this.config.enabled) {
      return {
        isClean: true,
        threats: [],
        scanDuration: 0,
        engines: [{
          name: 'disabled',
          version: '1.0.0',
          updateDate: new Date().toISOString(),
          scanDuration: 0,
          threats: 0,
          status: 'ok'
        }],
        recommendation: 'accept',
        confidence: 100,
      };
    }

    const startTime = Date.now();
    const engines: EngineResult[] = [];
    const allThreats: ThreatInfo[] = [];

    // File size check
    if (file.size > this.config.maxFileSize) {
      throw ResumeBuilderErrorFactory.validationError(
        'file_size',
        `File size exceeds maximum allowed for virus scanning (${this.formatFileSize(this.config.maxFileSize)})`
      );
    }

    // Local heuristic scan (always enabled)
    if (this.config.engines.local) {
      try {
        const localResult = await this.performLocalScan(file);
        engines.push(localResult.engine);
        allThreats.push(...localResult.threats);
      } catch (error) {
        console.error('[VirusScanner] Local scan failed:', error);
        engines.push({
          name: 'local',
          version: '1.0.0',
          updateDate: new Date().toISOString(),
          scanDuration: 0,
          threats: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // ClamAV scan (if enabled)
    if (this.config.engines.clamAV && this.clamAV) {
      try {
        const clamResult = await this.performClamAVScan(file);
        engines.push(clamResult.engine);
        allThreats.push(...clamResult.threats);
      } catch (error) {
        console.error('[VirusScanner] ClamAV scan failed:', error);
        engines.push({
          name: 'clamav',
          version: 'unknown',
          updateDate: new Date().toISOString(),
          scanDuration: 0,
          threats: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // VirusTotal scan (if enabled)
    if (this.config.engines.virusTotal && this.virusTotalAPIKey) {
      try {
        const vtResult = await this.performVirusTotalScan(file);
        engines.push(vtResult.engine);
        allThreats.push(...vtResult.threats);
      } catch (error) {
        console.error('[VirusScanner] VirusTotal scan failed:', error);
        engines.push({
          name: 'virustotal',
          version: '3.0',
          updateDate: new Date().toISOString(),
          scanDuration: 0,
          threats: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const scanDuration = Date.now() - startTime;
    const { isClean, recommendation, confidence } = this.analyzeResults(allThreats);

    return {
      isClean,
      threats: allThreats,
      scanDuration,
      engines,
      recommendation,
      confidence,
    };
  }

  private async performLocalScan(file: File): Promise<{ engine: EngineResult; threats: ThreatInfo[] }> {
    const startTime = Date.now();
    const threats: ThreatInfo[] = [];

    try {
      const buffer = await this.fileToArrayBuffer(file);
      const bytes = new Uint8Array(buffer);
      const content = this.arrayBufferToString(buffer.slice(0, Math.min(buffer.byteLength, 1024 * 1024)));

      // 1. Check for executable signatures
      const executableSignatures = [
        { name: 'PE Executable', signature: [0x4D, 0x5A], severity: 'critical' as const },
        { name: 'ELF Executable', signature: [0x7F, 0x45, 0x4C, 0x46], severity: 'critical' as const },
        { name: 'Mach-O Executable', signature: [0xFE, 0xED, 0xFA, 0xCE], severity: 'critical' as const },
        { name: 'Java Class', signature: [0xCA, 0xFE, 0xBA, 0xBE], severity: 'high' as const },
        { name: 'Mach-O Universal', signature: [0xFE, 0xED, 0xFA, 0xCF], severity: 'high' as const },
      ];

      for (const sig of executableSignatures) {
        if (this.checkSignature(bytes, sig.signature)) {
          threats.push({
            type: 'malware',
            name: sig.name,
            description: `File contains executable signature for ${sig.name}`,
            severity: sig.severity,
            engine: 'local'
          });
        }
      }

      // 2. Check for script injections
      const scriptPatterns = [
        { name: 'JavaScript', pattern: /<script[^>]*>/i, severity: 'high' as const },
        { name: 'VBScript', pattern: /vbscript:/i, severity: 'high' as const },
        { name: 'PowerShell', pattern: /powershell/i, severity: 'high' as const },
        { name: 'Shell Script', pattern: /bin\/(bash|sh|zsh)/i, severity: 'medium' as const },
        { name: 'Eval Function', pattern: /eval\s*\(/i, severity: 'medium' as const },
        { name: 'Document Write', pattern: /document\.write/i, severity: 'medium' as const },
      ];

      for (const script of scriptPatterns) {
        if (script.pattern.test(content)) {
          threats.push({
            type: 'suspicious',
            name: `${script.name} Pattern`,
            description: `File contains potentially malicious ${script.name} pattern`,
            severity: script.severity,
            engine: 'local'
          });
        }
      }

      // 3. Check for macro patterns in Office documents
      if (file.type.includes('wordprocessingml') || file.type.includes('msword')) {
        const macroPatterns = [
          { name: 'VBA Project', pattern: /vbaProject/i, severity: 'medium' as const },
          { name: 'AutoExec Macro', pattern: /autoexec/i, severity: 'medium' as const },
          { name: 'Document Open', pattern: /document_open/i, severity: 'low' as const },
        ];

        for (const macro of macroPatterns) {
          if (macro.pattern.test(content)) {
            threats.push({
              type: 'suspicious',
              name: `Office Macro: ${macro.name}`,
              description: `Document contains potentially malicious macro: ${macro.name}`,
              severity: macro.severity,
              engine: 'local'
            });
          }
        }
      }

      // 4. Check for suspicious URLs
      const urlPatterns = [
        { name: 'Suspicious URL Shortener', pattern: /(bit\.ly|tinyurl\.com|goo\.gl)/i, severity: 'low' as const },
        { name: 'IP Address URL', pattern: /https?:\/\/\d+\.\d+\.\d+\.\d+/i, severity: 'medium' as const },
        { name: 'Non-Standard Port', pattern: /https?:\/\/[^:]+:\d{4,5}\//i, severity: 'medium' as const },
      ];

      for (const url of urlPatterns) {
        if (url.pattern.test(content)) {
          threats.push({
            type: 'suspicious',
            name: `Suspicious URL: ${url.name}`,
            description: `File contains suspicious URL pattern: ${url.name}`,
            severity: url.severity,
            engine: 'local'
          });
        }
      }

      // 5. Check for encrypted/obfuscated content
      if (this.looksEncrypted(content)) {
        threats.push({
          type: 'suspicious',
          name: 'Encrypted Content',
          description: 'File appears to contain encrypted or heavily obfuscated content',
          severity: 'medium',
          engine: 'local'
        });
      }

    } catch (error) {
      throw new Error(`Local scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const engine: EngineResult = {
      name: 'local',
      version: '1.0.0',
      updateDate: new Date().toISOString(),
      scanDuration: Date.now() - startTime,
      threats: threats.length,
      status: threats.length > 0 ? 'infected' : 'ok'
    };

    return { engine, threats };
  }

  private async performClamAVScan(file: File): Promise<{ engine: EngineResult; threats: ThreatInfo[] }> {
    // Placeholder implementation - would require actual ClamAV integration
    const startTime = Date.now();

    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 1000));

    const engine: EngineResult = {
      name: 'clamav',
      version: '0.103.0',
      updateDate: new Date().toISOString(),
      scanDuration: Date.now() - startTime,
      threats: 0,
      status: 'ok'
    };

    return { engine, threats: [] };
  }

  private async performVirusTotalScan(file: File): Promise<{ engine: EngineResult; threats: ThreatInfo[] }> {
    const startTime = Date.now();

    // Convert file to base64 for upload
    const buffer = await this.fileToArrayBuffer(file);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    try {
      // Upload file to VirusTotal
      const uploadResponse = await fetch('https://www.virustotal.com/vtapi/v2/file/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          apikey: this.virusTotalAPIKey!,
          file: base64,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error(`VirusTotal upload failed: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      const scanId = uploadResult.scan_id;

      // Poll for results
      let scanResult;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

        const reportResponse = await fetch('https://www.virustotal.com/vtapi/v2/file/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            apikey: this.virusTotalAPIKey!,
            resource: scanId,
          }),
        });

        if (!reportResponse.ok) {
          throw new Error(`VirusTotal report failed: ${reportResponse.statusText}`);
        }

        scanResult = await reportResponse.json();
        attempts++;
      } while (scanResult.response_code === 1 && attempts < maxAttempts);

      const threats: ThreatInfo[] = [];

      if (scanResult.positives > 0) {
        for (const [engine, result] of Object.entries(scanResult.scans)) {
          if ((result as any).detected) {
            threats.push({
              type: 'malware',
              name: (result as any).result || 'Unknown threat',
              description: `Detected by ${engine}: ${(result as any).result}`,
              severity: (result as any).result?.toLowerCase().includes('trojan') ? 'critical' : 'high',
              engine
            });
          }
        }
      }

      const engineResult: EngineResult = {
        name: 'virustotal',
        version: '3.0',
        updateDate: new Date().toISOString(),
        scanDuration: Date.now() - startTime,
        threats: threats.length,
        status: threats.length > 0 ? 'infected' : 'ok'
      };

      return { engine: engineResult, threats };

    } catch (error) {
      throw new Error(`VirusTotal scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private analyzeResults(threats: ThreatInfo[]): { isClean: boolean; recommendation: 'accept' | 'quarantine' | 'reject'; confidence: number } {
    if (threats.length === 0) {
      return {
        isClean: true,
        recommendation: 'accept',
        confidence: 95
      };
    }

    const criticalThreats = threats.filter(t => t.severity === 'critical').length;
    const highThreats = threats.filter(t => t.severity === 'high').length;
    const mediumThreats = threats.filter(t => t.severity === 'medium').length;
    const lowThreats = threats.filter(t => t.severity === 'low').length;

    // Calculate confidence score
    let confidence = 100;
    confidence -= criticalThreats * 40;
    confidence -= highThreats * 25;
    confidence -= mediumThreats * 10;
    confidence -= lowThreats * 5;
    confidence = Math.max(0, confidence);

    // Determine recommendation
    let recommendation: 'accept' | 'quarantine' | 'reject';

    if (criticalThreats > 0 || highThreats >= 2) {
      recommendation = 'reject';
    } else if (highThreats > 0 || mediumThreats >= 3) {
      recommendation = 'quarantine';
    } else if (confidence < this.config.alertThreshold) {
      recommendation = 'quarantine';
    } else {
      recommendation = 'accept';
    }

    return {
      isClean: recommendation === 'accept',
      recommendation,
      confidence
    };
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private arrayBufferToString(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  }

  private checkSignature(bytes: Uint8Array, signature: number[]): boolean {
    if (bytes.length < signature.length) return false;

    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) return false;
    }

    return true;
  }

  private looksEncrypted(content: string): boolean {
    // Simple heuristic to detect encrypted content
    const entropy = this.calculateEntropy(content);
    const hasNonPrintableChars = /[^\x20-\x7E\r\n\t]/.test(content);

    return entropy > 6.0 || (hasNonPrintableChars && content.length > 100);
  }

  private calculateEntropy(content: string): number {
    const frequency: { [char: string]: number } = {};

    for (const char of content) {
      frequency[char] = (frequency[char] || 0) + 1;
    }

    let entropy = 0;
    const length = content.length;

    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
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

  // Utility method to quarantine a file
  async quarantineFile(file: File, reason: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('File quarantine is not supported in browser environment');
    }

    const fs = await import('fs/promises');
    const path = await import('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}_${file.name}`;
    const quarantinePath = path.join(this.config.quarantineDir, fileName);

    const buffer = await this.fileToArrayBuffer(file);
    await fs.writeFile(quarantinePath, new Uint8Array(buffer));

    // Log quarantine event
    console.warn(`[VirusScanner] File quarantined: ${fileName} - Reason: ${reason}`);

    return quarantinePath;
  }
}

// Export singleton instance
export const virusScanner = new VirusScanner({
  enabled: process.env.NODE_ENV === 'production', // Enable in production
  engines: {
    clamAV: false, // Requires server setup
    virusTotal: !!process.env.VIRUSTOTAL_API_KEY, // Enable if API key is provided
    local: true, // Always enabled
  },
});