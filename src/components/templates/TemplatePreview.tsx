/**
 * Template Preview Component
 *
 * Provides real-time preview of resume templates with customization
 * applied. Supports zoom, page navigation, and export capabilities.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  RefreshCw,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Tablet,
  Monitor,
  Print
} from 'lucide-react';
import { ResumeTemplate, TemplateCustomization, Resume } from '@/types/resume';
import { templateService } from '@/services/templates/template-service';
import { templateExportService } from '@/services/templates/template-export-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TemplatePreviewProps {
  template: ResumeTemplate;
  resume: Resume;
  customization?: TemplateCustomization;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  className?: string;
  showControls?: boolean;
  showExportOptions?: boolean;
  enableRealTimeUpdates?: boolean;
  userId?: string;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'print';
type PreviewMode = 'html' | 'pdf' | 'image';

interface PreviewState {
  zoom: number;
  viewportSize: ViewportSize;
  currentPage: number;
  totalPages: number;
  previewMode: PreviewMode;
  isLoading: boolean;
  previewUrl?: string;
  error?: string;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  resume,
  customization,
  onCustomizationChange,
  className,
  showControls = true,
  showExportOptions = true,
  enableRealTimeUpdates = true,
  userId
}) => {
  const [previewState, setPreviewState] = useState<PreviewState>({
    zoom: 100,
    viewportSize: 'desktop',
    currentPage: 1,
    totalPages: 1,
    previewMode: 'html',
    isLoading: true
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Viewport size configurations
  const viewportConfigs = {
    mobile: { width: 375, height: 667, label: 'Mobile' },
    tablet: { width: 768, height: 1024, label: 'Tablet' },
    desktop: { width: 1200, height: 900, label: 'Desktop' },
    print: { width: 794, height: 1123, label: 'Print (A4)' }
  };

  // Generate preview on mount and when dependencies change
  useEffect(() => {
    if (enableRealTimeUpdates) {
      generatePreview();
    }
  }, [template, resume, customization, previewState.viewportSize, previewState.previewMode]);

  const generatePreview = useCallback(async () => {
    try {
      setPreviewState(prev => ({ ...prev, isLoading: true, error: undefined }));

      let previewUrl: string;

      if (previewState.previewMode === 'html') {
        previewUrl = await templateService.generatePreview(
          template.templateId,
          resume,
          customization
        );
      } else {
        // For PDF or image modes, we'd generate actual exports
        // For now, we'll use a placeholder
        previewUrl = `/api/templates/${template.templateId}/preview/${previewState.viewportSize}`;
      }

      setPreviewState(prev => ({
        ...prev,
        previewUrl,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setPreviewState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to generate preview'
      }));
    }
  }, [template, resume, customization, previewState.viewportSize, previewState.previewMode]);

  const handleZoomChange = (newZoom: number[]) => {
    setPreviewState(prev => ({ ...prev, zoom: newZoom[0] }));
  };

  const handleViewportSizeChange = (size: ViewportSize) => {
    setPreviewState(prev => ({ ...prev, viewportSize: size }));
  };

  const handlePreviewModeChange = (mode: PreviewMode) => {
    setPreviewState(prev => ({ ...prev, previewMode: mode }));
  };

  const handleRefresh = () => {
    generatePreview();
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'html') => {
    if (!userId) return;

    try {
      setIsGenerating(true);

      const exportResult = await templateExportService.exportResume({
        resumeId: resume.id,
        templateId: template.templateId,
        customizationId: customization?.id,
        userId,
        options: {
          format: format as any,
          quality: 'print',
          includeMetadata: true,
          watermarks: false
        }
      });

      // Download the exported file
      const link = document.createElement('a');
      link.href = exportResult.url;
      link.download = exportResult.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getPreviewDimensions = () => {
    const config = viewportConfigs[previewState.viewportSize];
    const scale = previewState.zoom / 100;

    return {
      width: config.width * scale,
      height: config.height * scale
    };
  };

  const renderPreviewContent = () => {
    if (previewState.isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Generating preview...</p>
          </div>
        </div>
      );
    }

    if (previewState.error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 mb-4">{previewState.error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    const dimensions = getPreviewDimensions();

    if (previewState.previewMode === 'html' && previewState.previewUrl) {
      return (
        <iframe
          ref={iframeRef}
          src={previewState.previewUrl}
          className="border-0 shadow-lg"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            maxWidth: '100%',
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }}
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }

    // For PDF/image modes
    return (
      <div className="flex items-center justify-center h-full">
        <img
          src={previewState.previewUrl || '/api/placeholder/600/800'}
          alt="Resume preview"
          className="shadow-lg max-w-full max-h-full object-contain"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }}
          onError={(e) => {
            e.currentTarget.src = '/api/placeholder/600/800';
          }}
        />
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Header Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Preview</h3>
            <Badge variant="outline">{template.name}</Badge>
            {customization && (
              <Badge variant="secondary">
                {customization.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport Size Selector */}
            <Select
              value={previewState.viewportSize}
              onValueChange={handleViewportSizeChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(viewportConfigs).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {key === 'mobile' && <Smartphone className="w-4 h-4" />}
                      {key === 'tablet' && <Tablet className="w-4 h-4" />}
                      {key === 'desktop' && <Monitor className="w-4 h-4" />}
                      {key === 'print' && <Print className="w-4 h-4" />}
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Preview Mode Selector */}
            <Select
              value={previewState.previewMode}
              onValueChange={handlePreviewModeChange}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoomChange([Math.max(25, previewState.zoom - 25)])}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded min-w-[80px]">
                <Slider
                  value={[previewState.zoom]}
                  onValueChange={handleZoomChange}
                  min={25}
                  max={200}
                  step={25}
                  className="flex-1"
                />
                <span className="text-sm font-medium min-w-[45px] text-right">
                  {previewState.zoom}%
                </span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoomChange([Math.min(200, previewState.zoom + 25)])}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Refresh */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={previewState.isLoading}
                  >
                    <RefreshCw className={cn("w-4 h-4", previewState.isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Fullscreen */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Export Options */}
      {showExportOptions && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border-b">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Export Options</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('docx')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('html')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              HTML
            </Button>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div
        className={cn(
          "flex-1 overflow-auto p-4",
          isFullscreen && "fixed inset-0 z-50 bg-white"
        )}
        ref={previewRef}
      >
        <div className="flex justify-center">
          <div
            className="bg-white shadow-xl transition-all duration-200"
            style={getPreviewDimensions()}
          >
            {renderPreviewContent()}
          </div>
        </div>

        {/* Page Navigation (for multi-page documents) */}
        {previewState.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              disabled={previewState.currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {previewState.currentPage} of {previewState.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewState(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
              disabled={previewState.currentPage === previewState.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-white border-t text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>{viewportConfigs[previewState.viewportSize].label}</span>
          <span>{previewState.zoom}% zoom</span>
          {customization && (
            <span>Customized: {customization.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {previewState.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>
            {previewState.isLoading ? 'Loading...' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;