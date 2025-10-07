/**
 * Template Manager Component
 *
 * Comprehensive template management interface that combines all template-related
 * functionality including selection, customization, preview, and management.
 * This serves as the main integration point for the template system.
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Layout,
  Palette,
  Eye,
  Settings,
  Download,
  Save,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Star,
  TrendingUp,
  Users,
  FileText,
  Zap
} from 'lucide-react';
import { ResumeTemplate, TemplateCustomization, Resume } from '@/types/resume';
import { templateService } from '@/services/templates/template-service';
import { templateRegistry } from '@/services/templates/template-registry';
import { templateExportService } from '@/services/templates/template-export-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import TemplateGallery from './TemplateGallery';
import TemplatePreview from './TemplatePreview';
import TemplateCustomizationPanel from './TemplateCustomizationPanel';
import TemplateSelector from './TemplateSelector';

interface TemplateManagerProps {
  resume: Resume;
  userId: string;
  onTemplateSelected?: (template: ResumeTemplate, customization?: TemplateCustomization) => void;
  className?: string;
}

interface ManagerState {
  activeTab: string;
  selectedTemplate?: ResumeTemplate;
  customization?: TemplateCustomization;
  templates: ResumeTemplate[];
  isLoading: boolean;
  searchQuery: string;
  categoryFilter: string;
  sortBy: string;
  error?: string;
  stats?: any;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  resume,
  userId,
  onTemplateSelected,
  className
}) => {
  const [state, setState] = useState<ManagerState>({
    activeTab: 'browse',
    isLoading: false,
    searchQuery: '',
    categoryFilter: 'all',
    sortBy: 'rating'
  });

  const [showSelector, setShowSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load templates and stats on mount
  React.useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const templates = await templateRegistry.listTemplates({
        sortBy: state.sortBy as any,
        sortOrder: 'desc',
        limit: 50
      });
      setState(prev => ({ ...prev, templates, isLoading: false }));
    } catch (error) {
      console.error('Failed to load templates:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load templates'
      }));
    }
  };

  const loadStats = async () => {
    try {
      const stats = await templateRegistry.getTemplateStats();
      setState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleTemplateSelect = useCallback(async (template: ResumeTemplate, customization?: TemplateCustomization) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Apply template to resume
      await templateService.applyTemplateToResume(
        resume.id,
        template.templateId,
        userId,
        customization?.id
      );

      setState(prev => ({
        ...prev,
        selectedTemplate: template,
        customization,
        isProcessing: false
      }));

      if (onTemplateSelected) {
        onTemplateSelected(template, customization);
      }
    } catch (error) {
      console.error('Failed to select template:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to apply template'
      }));
    }
  }, [resume, userId, onTemplateSelected]);

  const handleCustomizationChange = useCallback((customization: TemplateCustomization) => {
    setState(prev => ({ ...prev, customization }));
  }, []);

  const handleExport = async (format: 'pdf' | 'docx' | 'html') => {
    if (!state.selectedTemplate) return;

    try {
      const exportResult = await templateExportService.exportResume({
        resumeId: resume.id,
        templateId: state.selectedTemplate.templateId,
        customizationId: state.customization?.id,
        userId,
        options: {
          format: format as any,
          quality: 'print',
          includeMetadata: true,
          watermarks: false
        }
      });

      // Download the file
      const link = document.createElement('a');
      link.href = exportResult.url;
      link.download = exportResult.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to export resume'
      }));
    }
  };

  const getFilteredTemplates = () => {
    let filtered = state.templates;

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }

    if (state.categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === state.categoryFilter);
    }

    return filtered;
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className={cn("h-full bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
            <p className="text-gray-600 mt-1">
              Manage your resume templates and customizations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowSelector(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Choose Template
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {state.stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold">{state.stats.totalTemplates}</p>
                </div>
                <Layout className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Premium</p>
                  <p className="text-2xl font-bold">{state.stats.premiumTemplates}</p>
                </div>
                <Star className="w-8 h-8 text-amber-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold">{state.stats.averageRating.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Downloads</p>
                  <p className="text-2xl font-bold">
                    {(state.stats.totalDownloads / 1000).toFixed(0)}K
                  </p>
                </div>
                <Download className="w-8 h-8 text-purple-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{state.stats.activeTemplates}</p>
                </div>
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Customize
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manage
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search templates..."
                    value={state.searchQuery}
                    onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select
                  value={state.categoryFilter}
                  onValueChange={(value) => setState(prev => ({ ...prev, categoryFilter: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={state.sortBy}
                  onValueChange={(value) => setState(prev => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="downloads">Most Popular</SelectItem>
                    <SelectItem value="created">Newest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={loadTemplates}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Templates Grid */}
            {state.error ? (
              <Alert>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : (
              <TemplateGallery
                onTemplateSelect={handleTemplateSelect}
                maxVisible={12}
                enableRecommendations={true}
                userId={userId}
              />
            )}
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize" className="h-full">
            {state.selectedTemplate && state.customization ? (
              <div className="flex h-full gap-6">
                <div className="w-96">
                  <TemplateCustomizationPanel
                    template={state.selectedTemplate}
                    customization={state.customization}
                    onCustomizationChange={handleCustomizationChange}
                    onPreviewUpdate={handleCustomizationChange}
                    userId={userId}
                    resumeId={resume.id}
                  />
                </div>

                <div className="flex-1">
                  <TemplatePreview
                    template={state.selectedTemplate}
                    resume={resume}
                    customization={state.customization}
                    onCustomizationChange={handleCustomizationChange}
                    enableRealTimeUpdates={true}
                    userId={userId}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
                <p className="text-gray-600 mb-4">
                  Select a template to start customizing it.
                </p>
                <Button onClick={() => setShowSelector(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Choose Template
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="h-full">
            {state.selectedTemplate ? (
              <TemplatePreview
                template={state.selectedTemplate}
                resume={resume}
                customization={state.customization}
                enableRealTimeUpdates={true}
                userId={userId}
                showControls={true}
                showExportOptions={true}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Template to Preview</h3>
                <p className="text-gray-600 mb-4">
                  Select a template to preview it with your resume data.
                </p>
                <Button onClick={() => setShowSelector(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Choose Template
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Template */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Current Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.selectedTemplate ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">{state.selectedTemplate.name}</h3>
                        <p className="text-sm text-gray-600">{state.selectedTemplate.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{state.selectedTemplate.category}</Badge>
                        {state.selectedTemplate.isPremium && (
                          <Badge variant="default">Premium</Badge>
                        )}
                        {state.selectedTemplate.features?.atsOptimized && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            ATS Ready
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport('pdf')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setState(prev => ({ ...prev, activeTab: 'customize' }))}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Customize
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No template selected</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowSelector(true)}
                      >
                        Choose Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Customizations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Recent Customizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No customizations yet</p>
                    <p className="text-sm text-gray-500">
                      Customization history will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setShowSelector(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Choose New Template
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setState(prev => ({ ...prev, activeTab: 'customize' }))}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Customize Current
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleExport('pdf')}
                    disabled={!state.selectedTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Resume
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setState(prev => ({ ...prev, activeTab: 'preview' }))}
                    disabled={!state.selectedTemplate}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Selector Dialog */}
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Choose a Template</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <TemplateSelector
                resume={resume}
                userId={userId}
                onTemplateSelected={(template, customization) => {
                  handleTemplateSelect(template, customization);
                  setShowSelector(false);
                }}
                onSelectionCancel={() => setShowSelector(false)}
                enableCustomization={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;