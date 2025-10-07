/**
 * Export Panel component for resume templates
 * Provides comprehensive export functionality with multiple formats and batch operations
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Download,
  FileText,
  File,
  Code,
  Database,
  Clock,
  Calendar,
  Settings,
  Play,
  Square,
  Trash2,
  Eye,
  BarChart3,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Filter
} from 'lucide-react';
import { useTemplateExport } from '@/hooks/use-template-export';
import { ExportFormat, ExportOptions } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

interface ExportPanelProps {
  template: any;
  customization: any;
  content: any;
  onExportComplete?: (result: any) => void;
  className?: string;
}

export function ExportPanel({
  template,
  customization,
  content,
  onExportComplete,
  className = ''
}: ExportPanelProps) {
  const {
    isExporting,
    exportProgress,
    currentFormat,
    history,
    statistics,
    exportResume,
    exportToPDF,
    exportToDOCX,
    exportToHTML,
    exportToTXT,
    exportToJSON,
    batchState,
    createBatchExport,
    processBatchJob,
    cancelBatchJob,
    deleteBatchJob,
    scheduledState,
    createScheduledExport,
    updateScheduledExport,
    deleteScheduledExport,
    previewExport,
    validateExport,
    searchHistory,
    downloadFile
  } = useTemplateExport({
    template,
    customization,
    content,
    onExportComplete
  });

  const [activeTab, setActiveTab] = useState('quick-export');
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['PDF']);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    quality: 'high',
    includeAnalytics: false,
    watermark: false,
    compression: true,
    metadata: true
  });
  const [preview, setPreview] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const formatOptions = [
    { value: 'PDF', label: 'PDF Document', icon: FileText, description: 'Best for printing and ATS' },
    { value: 'DOCX', label: 'Word Document', icon: File, description: 'Editable format' },
    { value: 'HTML', label: 'Web Page', icon: Code, description: 'For online viewing' },
    { value: 'TXT', label: 'Plain Text', icon: FileText, description: 'Maximum ATS compatibility' },
    { value: 'JSON', label: 'JSON Data', icon: Database, description: 'For integration/backup' }
  ];

  const handleQuickExport = useCallback(async (format: ExportFormat) => {
    await exportResume(format, exportOptions);
  }, [exportResume, exportOptions]);

  const handleBatchExport = useCallback(async () => {
    if (selectedFormats.length === 0) return;

    const jobName = `Export ${new Date().toLocaleDateString()}`;
    const job = createBatchExport(jobName, selectedFormats, {
      notifyOnComplete: false,
      compress: selectedFormats.length > 1
    });

    await processBatchJob(job.id);
  }, [selectedFormats, createBatchExport, processBatchJob]);

  const handlePreview = useCallback(async (format: ExportFormat) => {
    const result = await previewExport(format, exportOptions);
    setPreview(result);
  }, [previewExport, exportOptions]);

  const handleValidate = useCallback((format: ExportFormat) => {
    const result = validateExport(format, exportOptions);
    setValidation(result);
  }, [validateExport, exportOptions]);

  const handleFormatToggle = useCallback((format: ExportFormat, checked: boolean) => {
    setSelectedFormats(prev =>
      checked
        ? [...prev, format]
        : prev.filter(f => f !== format)
    );
  }, []);

  const filteredHistory = searchQuery
    ? searchHistory(searchQuery)
    : history;

  if (!template || !customization || !content) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-2" />
            <span>Please select a template and customize it before exporting</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-4xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Resume
            </CardTitle>
            <CardDescription>
              Export your resume in multiple formats with optimized ATS compatibility
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {template.atsScore >= 90 && (
              <Badge variant="secondary" className="text-green-700 bg-green-50">
                ATS Optimized ({template.atsScore}/100)
              </Badge>
            )}
            {statistics && (
              <Badge variant="outline">
                {statistics.totalExports} exports
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="quick-export">Quick Export</TabsTrigger>
            <TabsTrigger value="batch">Batch Export</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Quick Export Tab */}
          <TabsContent value="quick-export" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formatOptions.map(({ value, label, icon: Icon, description }) => (
                <Card key={value} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <Button
                        size="sm"
                        onClick={() => handleQuickExport(value as ExportFormat)}
                        disabled={isExporting}
                      >
                        {isExporting && currentFormat === value ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <h3 className="font-medium">{label}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(value as ExportFormat)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(value as ExportFormat)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Validate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Quality</Label>
                    <Select
                      value={exportOptions.quality}
                      onValueChange={(value: any) =>
                        setExportOptions(prev => ({ ...prev, quality: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-analytics"
                        checked={exportOptions.includeAnalytics}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, includeAnalytics: checked }))
                        }
                      />
                      <Label htmlFor="include-analytics">Include Analytics</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="watermark"
                        checked={exportOptions.watermark}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, watermark: checked }))
                        }
                      />
                      <Label htmlFor="watermark">Add Watermark</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="compression"
                        checked={exportOptions.compression}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, compression: checked }))
                        }
                      />
                      <Label htmlFor="compression">Compress File</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="metadata"
                        checked={exportOptions.metadata}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, metadata: checked }))
                        }
                      />
                      <Label htmlFor="metadata">Include Metadata</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview and Validation */}
            {(preview || validation) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {preview ? 'Preview' : 'Validation'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {preview && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Estimated Size: {Math.round(preview.estimatedSize / 1024)}KB</span>
                        {preview.pageCount && <span>Pages: {preview.pageCount}</span>}
                      </div>
                      {preview.warnings.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {preview.warnings.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="border rounded p-3 bg-gray-50 max-h-64 overflow-auto">
                        <div dangerouslySetInnerHTML={{ __html: preview.preview }} />
                      </div>
                    </div>
                  )}

                  {validation && (
                    <div className="space-y-3">
                      <div className={`flex items-center gap-2 ${validation.valid ? 'text-green-600' : 'text-red-600'}`}>
                        {validation.valid ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        <span>{validation.valid ? 'Valid' : 'Invalid'}</span>
                      </div>

                      {validation.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <ul className="list-disc list-inside">
                              {validation.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {validation.warnings.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <ul className="list-disc list-inside">
                              {validation.warnings.map((warning: string, index: number) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {validation.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Suggestions:</Label>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {validation.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Batch Export Tab */}
          <TabsContent value="batch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Batch Export</CardTitle>
                <CardDescription>
                  Export your resume in multiple formats at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Formats</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {formatOptions.map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`batch-${value}`}
                          checked={selectedFormats.includes(value as ExportFormat)}
                          onCheckedChange={(checked) =>
                            handleFormatToggle(value as ExportFormat, checked as boolean)
                          }
                        />
                        <Label htmlFor={`batch-${value}`} className="text-sm">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleBatchExport}
                  disabled={selectedFormats.length === 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedFormats.length} Format{selectedFormats.length !== 1 ? 's' : ''}
                </Button>
              </CardContent>
            </Card>

            {/* Batch Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Batch Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {batchState.jobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No batch jobs yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batchState.jobs.map((job) => (
                      <div key={job.id} className="border rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{job.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Created {job.createdAt.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              job.status === 'completed' ? 'default' :
                              job.status === 'processing' ? 'secondary' :
                              job.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {job.status}
                            </Badge>
                            {job.status === 'processing' && (
                              <Button size="sm" variant="outline" onClick={() => cancelBatchJob(job.id)}>
                                <Square className="h-4 w-4" />
                              </Button>
                            )}
                            {(job.status === 'completed' || job.status === 'failed') && (
                              <Button size="sm" variant="outline" onClick={() => deleteBatchJob(job.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {job.status === 'processing' && (
                          <div className="space-y-2">
                            <Progress value={job.progress} className="w-full" />
                            <p className="text-sm text-muted-foreground">
                              {job.progress}% complete
                            </p>
                          </div>
                        )}

                        {job.status === 'completed' && (
                          <div className="text-sm text-green-600">
                            {job.results.filter(r => r.success).length} of {job.results.length} exports successful
                          </div>
                        )}

                        {job.status === 'failed' && job.error && (
                          <div className="text-sm text-red-600">
                            {job.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Exports Tab */}
          <TabsContent value="scheduled" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Exports</CardTitle>
                <CardDescription>
                  Set up automatic exports on a schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Scheduled exports functionality coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Export History</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No exports found matching your search' : 'No export history yet'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistory.map((export_) => (
                      <div key={export_.id} className="flex items-center justify-between border rounded p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{export_.filename}</h4>
                            <Badge variant="outline">{export_.format}</Badge>
                            {export_.atsScore && (
                              <Badge variant="secondary">ATS: {export_.atsScore}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{export_.templateName}</span>
                            <span>{Math.round(export_.size / 1024)}KB</span>
                            <span>{export_.createdAt.toLocaleString()}</span>
                            <span>Downloaded {export_.downloadCount} times</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalExports}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(statistics.averageSize / 1024)}KB</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Most Popular Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics.popularFormats[0]?.format || 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(statistics.totalSize / 1024 / 1024)}MB</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {statistics?.popularFormats.map((format) => (
                  <div key={format.format} className="flex items-center justify-between py-2">
                    <span>{format.format}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${format.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {format.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}