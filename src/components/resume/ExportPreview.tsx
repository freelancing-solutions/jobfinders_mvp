/**
 * Export Preview Component
 *
 * Handles resume preview functionality with multiple format support,
 * real-time preview updates, and export quality settings.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Eye,
  FileText,
  Globe,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCw,
  Share2,
  Print,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { Resume, ResumeTemplate, RenderedTemplate } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExportPreviewProps {
  resume: Resume;
  template: ResumeTemplate;
  renderedTemplate?: RenderedTemplate;
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<ExportResult>;
  onRefresh?: () => void;
  className?: string;
}

interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  includeMetadata: boolean;
  includeWatermark: boolean;
  passwordProtection: boolean;
  optimizeForPrint: boolean;
  compressImages: boolean;
}

interface ExportQuality {
  pdf: 'screen' | 'print' | 'press';
  images: 'compressed' | 'balanced' | 'high';
  fonts: 'embedded' | 'subset' | 'linked';
}

type ExportFormat = 'pdf' | 'docx' | 'html';

interface ExportResult {
  success: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  downloadUrl?: string;
  previewUrl?: string;
}

interface DevicePreview {
  name: string;
  icon: React.ReactNode;
  width: number;
  height: number;
  scale: number;
}

const devices: DevicePreview[] = [
  {
    name: 'Desktop',
    icon: <Monitor className="w-4 h-4" />,
    width: 1200,
    height: 800,
    scale: 0.7
  },
  {
    name: 'Tablet',
    icon: <Tablet className="w-4 h-4" />,
    width: 768,
    height: 1024,
    scale: 0.8
  },
  {
    name: 'Mobile',
    icon: <Smartphone className="w-4 h-4" />,
    width: 375,
    height: 667,
    scale: 1
  }
];

const ExportPreview: React.FC<ExportPreviewProps> = ({
  resume,
  template,
  renderedTemplate,
  onExport,
  onRefresh,
  className
}) => {
  const [activeDevice, setActiveDevice] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: {
      pdf: 'print',
      images: 'balanced',
      fonts: 'embedded'
    },
    includeMetadata: true,
    includeWatermark: false,
    passwordProtection: false,
    optimizeForPrint: true,
    compressImages: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const currentDevice = devices[activeDevice];

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await onExport(format, exportOptions);

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportResult(result);

      if (result.success && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName || `resume.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  };

  const handlePrint = () => {
    if (previewRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${resume.personalInfo.fullName || 'Resume'} - Print Preview</title>
              <style>
                @media print {
                  body { margin: 0; }
                  @page { margin: 0.5in; }
                }
              </style>
            </head>
            <body>
              ${previewRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${resume.personalInfo.fullName || 'My Resume'}`,
          text: 'Check out my professional resume',
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Resume link copied to clipboard!');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await navigator.clipboard.writeText(window.location.href);
      alert('Resume link copied to clipboard!');
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'docx':
        return <FileText className="w-4 h-4" />;
      case 'html':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatName = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return 'PDF Document';
      case 'docx':
        return 'Word Document';
      case 'html':
        return 'HTML Web Page';
      default:
        return 'Document';
    }
  };

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return 'Best for sharing and printing';
      case 'docx':
        return 'Editable Microsoft Word format';
      case 'html':
        return 'Web-friendly format';
      default:
        return 'Document format';
    }
  };

  const generatePreviewContent = () => {
    if (!renderedTemplate) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Generating preview...</p>
          </div>
        </div>
      );
    }

    return (
      <div
        dangerouslySetInnerHTML={{ __html: renderedTemplate.rendered.html }}
        style={{
          transform: `scale(${currentDevice.scale})`,
          transformOrigin: 'top left',
          width: `${currentDevice.width}px`,
          minHeight: `${currentDevice.height}px`
        }}
      />
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preview & Export</h1>
          <p className="text-gray-600 mt-1">
            Preview your resume and export in multiple formats
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button onClick={handlePrint}>
            <Print className="w-4 h-4 mr-2" />
            Print
          </Button>

          <Button onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Export Options Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Quick Export</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['pdf', 'docx', 'html'] as ExportFormat[]).map((format) => (
                <Button
                  key={format}
                  className="w-full justify-start"
                  variant={exportOptions.format === format ? 'default' : 'outline'}
                  onClick={() => handleExport(format)}
                  disabled={isExporting}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      {getFormatIcon(format)}
                      <div>
                        <div className="font-medium">{getFormatName(format)}</div>
                        <div className="text-xs text-gray-500">{getFormatDescription(format)}</div>
                      </div>
                    </div>
                    {isExporting && exportOptions.format === format && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Export Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quality Settings */}
              <div>
                <Label className="text-base font-medium">Quality</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="pdf-quality" className="text-sm">PDF Quality</Label>
                    <Select
                      value={exportOptions.quality.pdf}
                      onValueChange={(value: 'screen' | 'print' | 'press') =>
                        setExportOptions({
                          ...exportOptions,
                          quality: { ...exportOptions.quality, pdf: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screen">Screen View (Fast)</SelectItem>
                        <SelectItem value="print">Print Quality (Recommended)</SelectItem>
                        <SelectItem value="press">Press Quality (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="image-quality" className="text-sm">Image Quality</Label>
                    <Select
                      value={exportOptions.quality.images}
                      onValueChange={(value: 'compressed' | 'balanced' | 'high') =>
                        setExportOptions({
                          ...exportOptions,
                          quality: { ...exportOptions.quality, images: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compressed">Compressed (Small file)</SelectItem>
                        <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                        <SelectItem value="high">High Quality (Large file)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="font-quality" className="text-sm">Font Handling</Label>
                    <Select
                      value={exportOptions.quality.fonts}
                      onValueChange={(value: 'embedded' | 'subset' | 'linked') =>
                        setExportOptions({
                          ...exportOptions,
                          quality: { ...exportOptions.quality, fonts: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="embedded">Embedded (Best compatibility)</SelectItem>
                        <SelectItem value="subset">Subset (Optimized)</SelectItem>
                        <SelectItem value="linked">Linked (Web fonts)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Options */}
              <div>
                <Label className="text-base font-medium">Options</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Include Metadata</div>
                      <div className="text-sm text-gray-500">Add creation info</div>
                    </div>
                    <Switch
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeMetadata: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Optimize for Print</div>
                      <div className="text-sm text-gray-500">Print-ready format</div>
                    </div>
                    <Switch
                      checked={exportOptions.optimizeForPrint}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, optimizeForPrint: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Compress Images</div>
                      <div className="text-sm text-gray-500">Reduce file size</div>
                    </div>
                    <Switch
                      checked={exportOptions.compressImages}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, compressImages: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Add Watermark</div>
                      <div className="text-sm text-gray-500">JobFinders branding</div>
                    </div>
                    <Switch
                      checked={exportOptions.includeWatermark}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeWatermark: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Exporting...</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={exportProgress} className="w-full" />
                  <div className="text-sm text-gray-600 text-center">
                    {exportProgress}% complete
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Result */}
          {exportResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {exportResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>{exportResult.success ? 'Export Successful' : 'Export Failed'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exportResult.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">File:</span>
                      <span className="font-medium">{exportResult.fileName}</span>
                    </div>
                    {exportResult.fileSize && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Size:</span>
                        <span className="font-medium">
                          {(exportResult.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => exportResult.downloadUrl && window.open(exportResult.downloadUrl)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Again
                    </Button>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {exportResult.error || 'An error occurred during export.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Area */}
        <div className={cn(
          "lg:col-span-3",
          isFullscreen && "fixed inset-0 z-50 bg-white p-4"
        )}>
          <Card className={cn("h-full", isFullscreen && "h-full")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Preview</span>
                  <Badge variant="outline">{template.name}</Badge>
                </CardTitle>
                <Tabs
                  value={activeDevice.toString()}
                  onValueChange={(value) => setActiveDevice(parseInt(value))}
                  className="w-auto"
                >
                  <TabsList>
                    {devices.map((device, index) => (
                      <TabsTrigger
                        key={device.name}
                        value={index.toString()}
                        className="flex items-center space-x-2"
                      >
                        {device.icon}
                        <span className="hidden sm:inline">{device.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-full overflow-auto">
              <div className="flex justify-center p-4 bg-gray-50 min-h-full">
                <div
                  ref={previewRef}
                  className="bg-white shadow-lg"
                  style={{
                    width: `${currentDevice.width}px`,
                    minHeight: `${currentDevice.height}px`,
                    maxWidth: '100%'
                  }}
                >
                  {generatePreviewContent()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportPreview;