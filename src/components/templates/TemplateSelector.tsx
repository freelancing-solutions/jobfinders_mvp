/**
 * Template Selector Component
 *
 * Integrated template selection interface that combines gallery,
 * preview, and customization in a single cohesive component.
 * Provides step-by-step template selection workflow.
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Layout,
  Palette,
  Eye,
  Settings,
  Save,
  X
} from 'lucide-react';
import { ResumeTemplate, TemplateCustomization, Resume } from '@/types/resume';
import { templateService } from '@/services/templates/template-service';
import { templateValidator } from '@/services/templates/template-validator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import TemplateGallery from './TemplateGallery';
import TemplatePreview from './TemplatePreview';
import TemplateCustomizationPanel from './TemplateCustomizationPanel';

type SelectionStep = 'gallery' | 'preview' | 'customize' | 'confirm';

interface TemplateSelectorProps {
  resume: Resume;
  userId: string;
  onTemplateSelected?: (template: ResumeTemplate, customization?: TemplateCustomization) => void;
  onSelectionCancel?: () => void;
  initialTemplateId?: string;
  enableCustomization?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface SelectionState {
  step: SelectionStep;
  selectedTemplate?: ResumeTemplate;
  customization?: TemplateCustomization;
  isProcessing: boolean;
  error?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  resume,
  userId,
  onTemplateSelected,
  onSelectionCancel,
  initialTemplateId,
  enableCustomization = true,
  showProgress = true,
  className
}) => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    step: initialTemplateId ? 'preview' : 'gallery',
    isProcessing: false
  });

  const steps = [
    { id: 'gallery', name: 'Choose Template', icon: Layout },
    { id: 'preview', name: 'Preview', icon: Eye },
    ...(enableCustomization ? [{ id: 'customize', name: 'Customize', icon: Palette }] : []),
    { id: 'confirm', name: 'Confirm', icon: Check }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === selectionState.step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleTemplateSelect = async (template: ResumeTemplate) => {
    try {
      setSelectionState(prev => ({ ...prev, isProcessing: true, error: undefined }));

      // Create default customization for the template
      const defaultCustomization = await createDefaultCustomization(template);

      setSelectionState(prev => ({
        ...prev,
        selectedTemplate: template,
        customization: defaultCustomization,
        step: enableCustomization ? 'preview' : 'confirm',
        isProcessing: false
      }));
    } catch (error) {
      console.error('Failed to select template:', error);
      setSelectionState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to select template'
      }));
    }
  };

  const handleCustomizationChange = (customization: TemplateCustomization) => {
    setSelectionState(prev => ({ ...prev, customization }));
  };

  const handleStepNavigation = (direction: 'next' | 'back') => {
    const currentIndex = steps.findIndex(step => step.id === selectionState.step);

    if (direction === 'next' && currentIndex < steps.length - 1) {
      setSelectionState(prev => ({
        ...prev,
        step: steps[currentIndex + 1].id as SelectionStep
      }));
    } else if (direction === 'back' && currentIndex > 0) {
      setSelectionState(prev => ({
        ...prev,
        step: steps[currentIndex - 1].id as SelectionStep
      }));
    }
  };

  const handleConfirmSelection = async () => {
    if (!selectionState.selectedTemplate) return;

    try {
      setSelectionState(prev => ({ ...prev, isProcessing: true, error: undefined }));

      // Save customization if it has been modified
      if (selectionState.customization) {
        await templateService.saveCustomization(selectionState.customization, userId);
      }

      // Apply template to resume
      const updatedResume = await templateService.applyTemplateToResume(
        resume.id,
        selectionState.selectedTemplate.templateId,
        userId,
        selectionState.customization?.id
      );

      if (onTemplateSelected) {
        onTemplateSelected(selectionState.selectedTemplate, selectionState.customization);
      }
    } catch (error) {
      console.error('Failed to confirm selection:', error);
      setSelectionState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to apply template. Please try again.'
      }));
    }
  };

  const createDefaultCustomization = async (template: ResumeTemplate): Promise<TemplateCustomization> => {
    return {
      id: `custom_${Date.now()}`,
      name: `${template.name} - Default`,
      templateId: template.templateId,
      userId,
      resumeId: resume.id,
      colorScheme: {
        name: 'Professional Blue',
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#1e293b',
        muted: '#94a3b8',
        border: '#e2e8f0',
        highlight: '#eff6ff',
        link: '#2563eb'
      },
      typography: {
        heading: {
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: { h1: 28, h2: 22, h3: 18, h4: 16, h5: 14, h6: 12 },
          lineHeight: 1.2,
          letterSpacing: 0
        },
        body: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: { large: 18, normal: 14, small: 12, caption: 10 },
          lineHeight: 1.5,
          letterSpacing: 0
        },
        accent: {
          fontFamily: 'Inter',
          fontWeight: 500,
          fontSize: 14,
          lineHeight: 1.4,
          letterSpacing: 0
        }
      },
      layout: {
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        sectionSpacing: { before: 16, after: 16 },
        itemSpacing: 8,
        lineHeight: 1.5,
        columns: { count: 1, widths: [100], gutters: 20 }
      },
      sectionVisibility: {
        'personal-info': { visible: true, order: 1 },
        'summary': { visible: true, order: 2 },
        'experience': { visible: true, order: 3 },
        'education': { visible: true, order: 4 },
        'skills': { visible: true, order: 5 },
        'projects': { visible: true, order: 6 },
        'certifications': { visible: true, order: 7 },
        'languages': { visible: true, order: 8 }
      },
      customSections: {},
      branding: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        changeCount: 0,
        isDefault: true
      }
    };
  };

  const canGoNext = () => {
    switch (selectionState.step) {
      case 'gallery':
        return !!selectionState.selectedTemplate;
      case 'preview':
        return true;
      case 'customize':
        return !!selectionState.customization;
      case 'confirm':
        return false;
      default:
        return false;
    }
  };

  const canGoBack = () => {
    const currentIndex = steps.findIndex(step => step.id === selectionState.step);
    return currentIndex > 0;
  };

  const renderStepContent = () => {
    switch (selectionState.step) {
      case 'gallery':
        return (
          <div className="h-full">
            <TemplateGallery
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectionState.selectedTemplate?.templateId}
              userId={userId}
              jobTitle={resume.metadata?.title}
              industry={resume.metadata?.targetIndustry}
              experienceLevel={resume.metadata?.experienceLevel}
              enableRecommendations={true}
            />
          </div>
        );

      case 'preview':
        if (!selectionState.selectedTemplate) return null;

        return (
          <div className="flex h-full">
            {/* Template Info Sidebar */}
            <div className="w-80 border-r bg-white p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectionState.selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{selectionState.selectedTemplate.description}</p>

                  <div className="space-y-2">
                    <Badge variant="secondary">{selectionState.selectedTemplate.category}</Badge>
                    {selectionState.selectedTemplate.features?.atsOptimized && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ATS Optimized
                      </Badge>
                    )}
                    {selectionState.selectedTemplate.isPremium && (
                      <Badge variant="default" className="bg-amber-100 text-amber-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Template Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectionState.selectedTemplate.features?.atsOptimized && (
                      <li>• ATS-friendly formatting</li>
                    )}
                    {selectionState.selectedTemplate.features?.mobileOptimized && (
                      <li>• Mobile responsive design</li>
                    )}
                    {selectionState.selectedTemplate.features?.printOptimized && (
                      <li>• Print-optimized layout</li>
                    )}
                    <li>• Professional styling</li>
                    <li>• Easy customization</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Statistics</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <span>{(selectionState.selectedTemplate.metadata?.rating || 0).toFixed(1)} / 5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads:</span>
                      <span>{selectionState.selectedTemplate.metadata?.downloadCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reviews:</span>
                      <span>{selectionState.selectedTemplate.metadata?.reviewCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1">
              <TemplatePreview
                template={selectionState.selectedTemplate}
                resume={resume}
                customization={selectionState.customization}
                enableRealTimeUpdates={false}
                userId={userId}
              />
            </div>
          </div>
        );

      case 'customize':
        if (!selectionState.selectedTemplate || !selectionState.customization) return null;

        return (
          <div className="flex h-full">
            {/* Customization Panel */}
            <div className="w-96 border-r bg-gray-50 overflow-y-auto">
              <TemplateCustomizationPanel
                template={selectionState.selectedTemplate}
                customization={selectionState.customization}
                onCustomizationChange={handleCustomizationChange}
                onPreviewUpdate={handleCustomizationChange}
                userId={userId}
                resumeId={resume.id}
              />
            </div>

            {/* Live Preview */}
            <div className="flex-1">
              <TemplatePreview
                template={selectionState.selectedTemplate}
                resume={resume}
                customization={selectionState.customization}
                enableRealTimeUpdates={true}
                onCustomizationChange={handleCustomizationChange}
                userId={userId}
              />
            </div>
          </div>
        );

      case 'confirm':
        if (!selectionState.selectedTemplate) return null;

        return (
          <div className="max-w-2xl mx-auto p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Template Selected!</h2>
              <p className="text-gray-600">
                You've selected "{selectionState.selectedTemplate.name}" for your resume.
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Selection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Template:</span>
                  <span>{selectionState.selectedTemplate.name}</span>
                </div>

                {selectionState.customization && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Customization:</span>
                      <span>{selectionState.customization.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Color Scheme:</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: selectionState.customization.colorScheme?.primary }}
                        />
                        <span>{selectionState.customization.colorScheme?.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Font Family:</span>
                      <span>{selectionState.customization.typography?.heading?.fontFamily}</span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">ATS Optimized:</span>
                  <Badge variant={selectionState.selectedTemplate.features?.atsOptimized ? "default" : "secondary"}>
                    {selectionState.selectedTemplate.features?.atsOptimized ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Preview Thumbnail */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Preview</h3>
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden max-w-sm mx-auto">
                <img
                  src={selectionState.selectedTemplate.previewUrl || '/api/placeholder/300/400'}
                  alt={selectionState.selectedTemplate.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {selectionState.error && (
              <Alert className="mb-6">
                <AlertDescription>{selectionState.error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Choose a Template</h1>
          {onSelectionCancel && (
            <Button variant="ghost" onClick={onSelectionCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {showProgress && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => {
                const isActive = step.id === selectionState.step;
                const isCompleted = index < currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                        isActive && "bg-blue-600 text-white",
                        isCompleted && "bg-green-600 text-white",
                        !isActive && !isCompleted && "bg-gray-200 text-gray-600"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium hidden sm:block",
                        isActive && "text-blue-600",
                        isCompleted && "text-green-600"
                      )}
                    >
                      {step.name}
                    </span>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-8 h-0.5 hidden sm:block",
                          isCompleted ? "bg-green-600" : "bg-gray-300"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="px-6 py-2 border-b">
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between p-6 border-t bg-gray-50">
        <Button
          variant="outline"
          onClick={() => handleStepNavigation('back')}
          disabled={!canGoBack() || selectionState.isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {selectionState.step === 'confirm' ? (
            <Button
              onClick={handleConfirmSelection}
              disabled={selectionState.isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {selectionState.isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Apply Template
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleStepNavigation('next')}
              disabled={!canGoNext() || selectionState.isProcessing}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;