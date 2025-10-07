/**
 * Template Customization Panel
 *
 * Provides comprehensive template customization options including
 * colors, typography, layout, and section visibility settings.
 * Integrates with the template service for real-time preview updates.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Type,
  Layout,
  Eye,
  EyeOff,
  Sliders,
  RotateCcw,
  Save,
  Download,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { ResumeTemplate, TemplateCustomization } from '@/types/resume';
import { templateService } from '@/services/templates/template-service';
import { templateValidator } from '@/services/templates/template-validator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TemplateCustomizationPanelProps {
  template: ResumeTemplate;
  customization?: TemplateCustomization;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onPreviewUpdate?: (customization: TemplateCustomization) => void;
  className?: string;
  userId: string;
  resumeId: string;
}

interface ColorPreset {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

interface FontPreset {
  name: string;
  heading: string;
  body: string;
  accent: string;
}

const TemplateCustomizationPanel: React.FC<TemplateCustomizationPanelProps> = ({
  template,
  customization,
  onCustomizationChange,
  onPreviewUpdate,
  className,
  userId,
  resumeId
}) => {
  const [currentCustomization, setCurrentCustomization] = useState<TemplateCustomization>(
    customization || createDefaultCustomization(template.templateId, userId, resumeId)
  );
  const [activeTab, setActiveTab] = useState('colors');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['colors', 'typography']));
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Color presets
  const colorPresets: ColorPreset[] = [
    {
      name: 'Professional Blue',
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#1e293b'
      }
    },
    {
      name: 'Modern Gray',
      colors: {
        primary: '#374151',
        secondary: '#6b7280',
        accent: '#059669',
        background: '#ffffff',
        text: '#111827'
      }
    },
    {
      name: 'Elegant Purple',
      colors: {
        primary: '#7c3aed',
        secondary: '#a78bfa',
        accent: '#ec4899',
        background: '#ffffff',
        text: '#1f2937'
      }
    },
    {
      name: 'Creative Orange',
      colors: {
        primary: '#ea580c',
        secondary: '#f97316',
        accent: '#fbbf24',
        background: '#ffffff',
        text: '#1c1917'
      }
    },
    {
      name: 'Classic Black',
      colors: {
        primary: '#000000',
        secondary: '#374151',
        accent: '#059669',
        background: '#ffffff',
        text: '#000000'
      }
    }
  ];

  // Font presets
  const fontPresets: FontPreset[] = [
    {
      name: 'Inter',
      heading: 'Inter',
      body: 'Inter',
      accent: 'Inter'
    },
    {
      name: 'Roboto',
      heading: 'Roboto',
      body: 'Roboto',
      accent: 'Roboto'
    },
    {
      name: 'Helvetica',
      heading: 'Helvetica',
      body: 'Helvetica',
      accent: 'Helvetica'
    },
    {
      name: 'Georgia',
      heading: 'Georgia',
      body: 'Arial',
      accent: 'Georgia'
    },
    {
      name: 'Times New Roman',
      heading: 'Times New Roman',
      body: 'Times New Roman',
      accent: 'Times New Roman'
    }
  ];

  // Initialize customization
  useEffect(() => {
    if (customization) {
      setCurrentCustomization(customization);
    }
  }, [customization]);

  // Validate customization on changes
  useEffect(() => {
    const validateCustomization = async () => {
      try {
        const validation = templateValidator.validateCustomization(currentCustomization);
        setValidationResult(validation);
      } catch (error) {
        console.error('Validation error:', error);
      }
    };

    validateCustomization();
  }, [currentCustomization]);

  const handleCustomizationChange = useCallback((updates: Partial<TemplateCustomization>) => {
    const newCustomization = {
      ...currentCustomization,
      ...updates,
      metadata: {
        ...currentCustomization.metadata,
        updatedAt: new Date()
      }
    };

    setCurrentCustomization(newCustomization);
    setHasUnsavedChanges(true);

    // Trigger preview update
    if (onPreviewUpdate) {
      onPreviewUpdate(newCustomization);
    }
  }, [currentCustomization, onPreviewUpdate]);

  const handleColorChange = (colorKey: string, value: string) => {
    handleCustomizationChange({
      colorScheme: {
        ...currentCustomization.colorScheme,
        [colorKey]: value
      }
    });
  };

  const handleColorPresetApply = (preset: ColorPreset) => {
    handleCustomizationChange({
      colorScheme: {
        ...currentCustomization.colorScheme,
        ...preset.colors
      }
    });
  };

  const handleFontChange = (fontType: string, property: string, value: any) => {
    handleCustomizationChange({
      typography: {
        ...currentCustomization.typography,
        [fontType]: {
          ...currentCustomization.typography[fontType as keyof typeof currentCustomization.typography],
          [property]: value
        }
      }
    });
  };

  const handleFontPresetApply = (preset: FontPreset) => {
    handleCustomizationChange({
      typography: {
        ...currentCustomization.typography,
        heading: {
          ...currentCustomization.typography.heading,
          fontFamily: preset.heading
        },
        body: {
          ...currentCustomization.typography.body,
          fontFamily: preset.body
        },
        accent: {
          ...currentCustomization.typography.accent,
          fontFamily: preset.accent
        }
      }
    });
  };

  const handleLayoutChange = (property: string, value: any) => {
    handleCustomizationChange({
      layout: {
        ...currentCustomization.layout,
        [property]: value
      }
    });
  };

  const handleSectionVisibilityChange = (sectionId: string, visible: boolean) => {
    handleCustomizationChange({
      sectionVisibility: {
        ...currentCustomization.sectionVisibility,
        [sectionId]: {
          visible,
          order: currentCustomization.sectionVisibility[sectionId]?.order || 0
        }
      }
    });
  };

  const saveCustomization = async () => {
    try {
      setIsSaving(true);

      const savedCustomization = await templateService.saveCustomization(
        currentCustomization,
        userId
      );

      setCurrentCustomization(savedCustomization);
      setHasUnsavedChanges(false);

      if (onCustomizationChange) {
        onCustomizationChange(savedCustomization);
      }

      // Show success message
      console.log('Customization saved successfully');
    } catch (error) {
      console.error('Failed to save customization:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultCustomization = createDefaultCustomization(template.templateId, userId, resumeId);
    setCurrentCustomization(defaultCustomization);
    setHasUnsavedChanges(true);

    if (onPreviewUpdate) {
      onPreviewUpdate(defaultCustomization);
    }
  };

  const toggleSectionExpanded = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const ColorPicker: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
  }> = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <div
            className="absolute inset-0 rounded border border-gray-300 pointer-events-none"
            style={{ backgroundColor: value }}
          />
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customize Template</h2>
          <p className="text-sm text-gray-600">{template.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveCustomization} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && !validationResult.isValid && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Please fix the validation errors: {validationResult.errors.map((e: any) => e.message).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Customization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sections
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          {/* Color Presets */}
          <Collapsible open={expandedSections.has('color-presets')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => toggleSectionExpanded('color-presets')}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Color Presets
                </span>
                {expandedSections.has('color-presets') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-auto p-3"
                    onClick={() => handleColorPresetApply(preset)}
                  >
                    <div className="w-full space-y-2">
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                      </div>
                      <p className="text-xs font-medium">{preset.name}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Custom Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Primary Color"
                  value={currentCustomization.colorScheme?.primary || '#2563eb'}
                  onChange={(value) => handleColorChange('primary', value)}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={currentCustomization.colorScheme?.secondary || '#64748b'}
                  onChange={(value) => handleColorChange('secondary', value)}
                />
                <ColorPicker
                  label="Accent Color"
                  value={currentCustomization.colorScheme?.accent || '#3b82f6'}
                  onChange={(value) => handleColorChange('accent', value)}
                />
                <ColorPicker
                  label="Text Color"
                  value={currentCustomization.colorScheme?.text || '#1e293b'}
                  onChange={(value) => handleColorChange('text', value)}
                />
                <ColorPicker
                  label="Background Color"
                  value={currentCustomization.colorScheme?.background || '#ffffff'}
                  onChange={(value) => handleColorChange('background', value)}
                />
                <ColorPicker
                  label="Border Color"
                  value={currentCustomization.colorScheme?.border || '#e2e8f0'}
                  onChange={(value) => handleColorChange('border', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          {/* Font Presets */}
          <Collapsible open={expandedSections.has('font-presets')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => toggleSectionExpanded('font-presets')}
              >
                <span className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Presets
                </span>
                {expandedSections.has('font-presets') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                {fontPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-auto p-3"
                    onClick={() => handleFontPresetApply(preset)}
                  >
                    <div className="w-full space-y-2">
                      <div className="text-sm font-medium" style={{ fontFamily: preset.heading }}>
                        Aa
                      </div>
                      <p className="text-xs">{preset.name}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Heading Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Heading Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={currentCustomization.typography?.heading?.fontFamily || 'Inter'}
                    onValueChange={(value) => handleFontChange('heading', 'fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={currentCustomization.typography?.heading?.fontWeight?.toString() || '600'}
                    onValueChange={(value) => handleFontChange('heading', 'fontWeight', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semibold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size Scale</Label>
                  <Slider
                    value={[currentCustomization.typography?.heading?.fontSize?.h1 || 28]}
                    onValueChange={([value]) => {
                      const baseSize = value;
                      handleFontChange('heading', 'fontSize', {
                        h1: baseSize,
                        h2: baseSize * 0.75,
                        h3: baseSize * 0.6,
                        h4: baseSize * 0.5,
                        h5: baseSize * 0.4,
                        h6: baseSize * 0.33
                      });
                    }}
                    min={20}
                    max={48}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Line Height</Label>
                  <Slider
                    value={[currentCustomization.typography?.heading?.lineHeight || 1.2]}
                    onValueChange={([value]) => handleFontChange('heading', 'lineHeight', value)}
                    min={1}
                    max={2}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tight</span>
                    <span>Loose</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Body Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={currentCustomization.typography?.body?.fontFamily || 'Inter'}
                    onValueChange={(value) => handleFontChange('body', 'fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={currentCustomization.typography?.body?.fontWeight?.toString() || '400'}
                    onValueChange={(value) => handleFontChange('body', 'fontWeight', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semibold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Slider
                    value={[currentCustomization.typography?.body?.fontSize?.normal || 14]}
                    onValueChange={([value]) => {
                      const baseSize = value;
                      handleFontChange('body', 'fontSize', {
                        small: baseSize * 0.85,
                        normal: baseSize,
                        large: baseSize * 1.15
                      });
                    }}
                    min={10}
                    max={18}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>10px</span>
                    <span>18px</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Line Height</Label>
                  <Slider
                    value={[currentCustomization.typography?.body?.lineHeight || 1.5]}
                    onValueChange={([value]) => handleFontChange('body', 'lineHeight', value)}
                    min={1.2}
                    max={2}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tight</span>
                    <span>Loose</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Margins */}
              <div className="space-y-4">
                <h4 className="font-medium">Margins (inches)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <div key={side} className="space-y-2">
                      <Label className="capitalize">{side}</Label>
                      <Slider
                        value={[currentCustomization.layout?.margins?.[side] || 0.75]}
                        onValueChange={([value]) => {
                          handleLayoutChange('margins', {
                            ...currentCustomization.layout?.margins,
                            [side]: value
                          });
                        }}
                        min={0.25}
                        max={2}
                        step={0.125}
                        className="mt-2"
                      />
                      <div className="text-center text-sm text-gray-600">
                        {currentCustomization.layout?.margins?.[side]?.toFixed(2) || '0.75'}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Section Spacing */}
              <div className="space-y-4">
                <h4 className="font-medium">Section Spacing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spacing Before Section</Label>
                    <Slider
                      value={[currentCustomization.layout?.sectionSpacing?.before || 16]}
                      onValueChange={([value]) => {
                        handleLayoutChange('sectionSpacing', {
                          ...currentCustomization.layout?.sectionSpacing,
                          before: value
                        });
                      }}
                      min={8}
                      max={32}
                      step={2}
                      className="mt-2"
                    />
                    <div className="text-center text-sm text-gray-600">
                      {currentCustomization.layout?.sectionSpacing?.before || 16}px
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Spacing After Section</Label>
                    <Slider
                      value={[currentCustomization.layout?.sectionSpacing?.after || 16]}
                      onValueChange={([value]) => {
                        handleLayoutChange('sectionSpacing', {
                          ...currentCustomization.layout?.sectionSpacing,
                          after: value
                        });
                      }}
                      min={8}
                      max={32}
                      step={2}
                      className="mt-2"
                    />
                    <div className="text-center text-sm text-gray-600">
                      {currentCustomization.layout?.sectionSpacing?.after || 16}px
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Item Spacing */}
              <div className="space-y-2">
                <Label>Item Spacing</Label>
                <Slider
                  value={[currentCustomization.layout?.itemSpacing || 8]}
                  onValueChange={([value]) => handleLayoutChange('itemSpacing', value)}
                  min={4}
                  max={16}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tight</span>
                  <span>{currentCustomization.layout?.itemSpacing || 8}px</span>
                  <span>Loose</span>
                </div>
              </div>

              <Separator />

              {/* Line Height */}
              <div className="space-y-2">
                <Label>Base Line Height</Label>
                <Slider
                  value={[currentCustomization.layout?.lineHeight || 1.5]}
                  onValueChange={([value]) => handleLayoutChange('lineHeight', value)}
                  min={1.2}
                  max={2}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tight</span>
                  <span>Normal</span>
                  <span>Loose</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Section Visibility</CardTitle>
              <p className="text-sm text-gray-600">
                Toggle sections on or off and adjust their order
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'personal-info', name: 'Contact Information', required: true },
                { id: 'summary', name: 'Professional Summary', required: false },
                { id: 'experience', name: 'Work Experience', required: true },
                { id: 'education', name: 'Education', required: true },
                { id: 'skills', name: 'Skills', required: true },
                { id: 'projects', name: 'Projects', required: false },
                { id: 'certifications', name: 'Certifications', required: false },
                { id: 'languages', name: 'Languages', required: false }
              ].map((section) => {
                const isVisible = currentCustomization.sectionVisibility?.[section.id]?.visible !== false;

                return (
                  <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) => handleSectionVisibilityChange(section.id, checked)}
                        disabled={section.required}
                      />
                      <div>
                        <p className="font-medium">{section.name}</p>
                        {section.required && (
                          <p className="text-xs text-gray-500">Required section</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isVisible ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to create default customization
function createDefaultCustomization(
  templateId: string,
  userId: string,
  resumeId: string
): TemplateCustomization {
  return {
    id: `custom_${Date.now()}`,
    name: 'Default Customization',
    templateId,
    userId,
    resumeId,
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
}

export default TemplateCustomizationPanel;