/**
 * Template Customizer Component
 *
 * Provides comprehensive template customization options including colors,
 * fonts, layout, sections, and branding with real-time preview.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Layout,
  Settings,
  RotateCcw,
  Eye,
  Download,
  Save,
  Undo,
  Redo,
  Info,
  Check,
  X
} from 'lucide-react';
import { ResumeTemplate, CustomizationOptions, ColorTheme, FontFamily } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TemplateCustomizerProps {
  template: ResumeTemplate;
  onCustomizationChange: (customizations: CustomizationOptions) => void;
  onPreview: () => void;
  onSave: () => void;
  onReset: () => void;
  loading?: boolean;
  className?: string;
}

interface ColorCustomizerProps {
  customizations: CustomizationOptions['colors'];
  onChange: (colors: CustomizationOptions['colors']) => void;
}

interface FontCustomizerProps {
  customizations: CustomizationOptions['fonts'];
  onChange: (fonts: CustomizationOptions['fonts']) => void;
}

interface LayoutCustomizerProps {
  customizations: CustomizationOptions['layout'];
  onChange: (layout: CustomizationOptions['layout']) => void;
}

const ColorCustomizer: React.FC<ColorCustomizerProps> = ({ customizations, onChange }) => {
  const predefinedThemes = [
    { id: 'professional-blue', name: 'Professional Blue', primary: '#3b82f6', secondary: '#64748b' },
    { id: 'executive-gray', name: 'Executive Gray', primary: '#6b7280', secondary: '#fbbf24' },
    { id: 'modern-purple', name: 'Modern Purple', primary: '#8b5cf6', secondary: '#ec4899' },
    { id: 'forest-green', name: 'Forest Green', primary: '#10b981', secondary: '#06b6d4' },
    { id: 'warm-orange', name: 'Warm Orange', primary: '#f97316', secondary: '#eab308' }
  ];

  const [customColor, setCustomColor] = useState({
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#22c55e'
  });

  const handleThemeSelect = (themeId: string) => {
    onChange({
      ...customizations,
      currentTheme: themeId,
      customColors: []
    });
  };

  const handleCustomColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    const newCustomColor = {
      ...customColor,
      [colorType]: value
    };
    setCustomColor(newCustomColor);

    onChange({
      ...customizations,
      customColors: [
        {
          id: 'custom',
          name: 'Custom Colors',
          colors: newCustomColor,
          created: new Date()
        }
      ],
      currentTheme: 'custom'
    });
  };

  return (
    <div className="space-y-6">
      {/* Predefined Themes */}
      <div>
        <Label className="text-base font-medium">Color Themes</Label>
        <p className="text-sm text-gray-600 mb-4">Choose from professional color themes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {predefinedThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={cn(
                "p-3 border-2 rounded-lg transition-all duration-200 hover:shadow-md",
                customizations.currentTheme === theme.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: theme.secondary }}
                />
              </div>
              <p className="text-sm font-medium text-left">{theme.name}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Custom Colors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-medium">Custom Colors</Label>
          <Badge variant={customizations.currentTheme === 'custom' ? 'default' : 'secondary'}>
            {customizations.currentTheme === 'custom' ? 'Active' : 'Custom'}
          </Badge>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="primary-color" className="text-sm font-medium">
              Primary Color
            </Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id="primary-color"
                type="color"
                value={customColor.primary}
                onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                className="w-16 h-10 p-1 border-2 border-gray-200 rounded"
              />
              <Input
                value={customColor.primary}
                onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondary-color" className="text-sm font-medium">
              Secondary Color
            </Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id="secondary-color"
                type="color"
                value={customColor.secondary}
                onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                className="w-16 h-10 p-1 border-2 border-gray-200 rounded"
              />
              <Input
                value={customColor.secondary}
                onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="accent-color" className="text-sm font-medium">
              Accent Color
            </Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id="accent-color"
                type="color"
                value={customColor.accent}
                onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                className="w-16 h-10 p-1 border-2 border-gray-200 rounded"
              />
              <Input
                value={customColor.accent}
                onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ATS Compliance Warning */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          Ensure color contrast meets accessibility standards for ATS systems.
          Dark text on light backgrounds works best.
        </AlertDescription>
      </Alert>
    </div>
  );
};

const FontCustomizer: React.FC<FontCustomizerProps> = ({ customizations, onChange }) => {
  const predefinedFonts = [
    { id: 'arial', name: 'Arial', category: 'sans-serif' },
    { id: 'georgia', name: 'Georgia', category: 'serif' },
    { id: 'inter', name: 'Inter', category: 'sans-serif' },
    { id: 'calibri', name: 'Calibri', category: 'sans-serif' },
    { id: 'times', name: 'Times New Roman', category: 'serif' },
    { id: 'helvetica', name: 'Helvetica', category: 'sans-serif' }
  ];

  const atsCompliantFonts = ['Arial', 'Georgia', 'Calibri', 'Times New Roman', 'Helvetica'];

  const handleFontSelect = (fontId: string) => {
    const font = predefinedFonts.find(f => f.id === fontId);
    if (font) {
      onChange({
        ...customizations,
        families: [
          {
            name: font.name,
            stack: [font.name, font.category === 'serif' ? 'serif' : 'sans-serif'],
            weights: [
              { weight: 400, name: 'Regular' },
              { weight: 700, name: 'Bold' }
            ]
          }
        ]
      });
    }
  };

  const handleSizeScaleChange = (scale: number) => {
    onChange({
      ...customizations,
      sizes: {
        ...customizations.sizes,
        scale: scale[0]
      }
    });
  };

  const currentFont = customizations.families?.[0];
  const isATSCompliant = currentFont ? atsCompliantFonts.includes(currentFont.name) : false;

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-medium">Font Family</Label>
          {!isATSCompliant && (
            <Badge variant="destructive" className="text-xs">
              Not ATS Compliant
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {predefinedFonts.map((font) => (
            <button
              key={font.id}
              onClick={() => handleFontSelect(font.id)}
              className={cn(
                "p-3 border-2 rounded-lg transition-all duration-200 hover:shadow-md text-left",
                currentFont?.name === font.name
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{font.name}</span>
                {atsCompliantFonts.includes(font.name) && (
                  <Badge variant="secondary" className="text-xs">ATS</Badge>
                )}
              </div>
              <span className="text-sm text-gray-600">{font.category}</span>
              <div
                className="mt-2 text-lg"
                style={{ fontFamily: font.name }}
              >
                Aa Bb Cc
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Font Size Scaling */}
      <div>
        <Label className="text-base font-medium">Font Size Scaling</Label>
        <p className="text-sm text-gray-600 mb-4">Adjust overall font sizes</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Scale: {customizations.sizes?.scale || 1.0}x</span>
            <span className="text-xs text-gray-500">
              {customizations.sizes?.scale === 1 ? 'Default' :
               customizations.sizes?.scale! > 1 ? 'Larger' : 'Smaller'}
            </span>
          </div>
          <Slider
            value={[customizations.sizes?.scale || 1]}
            onValueChange={handleSizeScaleChange}
            min={0.8}
            max={1.3}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.8x</span>
            <span>1.0x (Default)</span>
            <span>1.3x</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <Card>
        <CardContent className="pt-4">
          <div
            className="space-y-3"
            style={{
              fontFamily: currentFont?.name || 'Arial',
              fontSize: `${(customizations.sizes?.scale || 1) * 16}px`
            }}
          >
            <div className="text-2xl font-bold">Resume Title</div>
            <div className="text-base">Professional subtitle text</div>
            <div className="text-sm">Body text with normal content for readability testing.</div>
          </div>
        </CardContent>
      </Card>

      {/* ATS Compliance Info */}
      {!isATSCompliant && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            This font may not be compatible with all Applicant Tracking Systems.
            Consider using Arial, Georgia, or Times New Roman for better ATS compatibility.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const LayoutCustomizer: React.FC<LayoutCustomizerProps> = ({ customizations, onChange }) => {
  const handleSpacingScaleChange = (scale: number) => {
    onChange({
      ...customizations,
      spacing: {
        ...customizations.spacing,
        scale: scale[0]
      }
    });
  };

  const handleMarginScaleChange = (scale: number) => {
    onChange({
      ...customizations,
      margins: {
        ...customizations.margins,
        scale: scale[0]
      }
    });
  };

  const handleAlignmentChange = (alignment: string) => {
    onChange({
      ...customizations,
      alignment: {
        ...customizations.alignment,
        header: alignment as 'center' | 'left' | 'right' | 'justify'
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Alignment */}
      <div>
        <Label className="text-base font-medium">Header Alignment</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
            { value: 'justify', label: 'Justify' }
          ].map((alignment) => (
            <button
              key={alignment.value}
              onClick={() => handleAlignmentChange(alignment.value)}
              className={cn(
                "p-2 border-2 rounded-lg transition-all duration-200 text-sm",
                customizations.alignment?.header === alignment.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {alignment.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Spacing Adjustment */}
      <div>
        <Label className="text-base font-medium">Section Spacing</Label>
        <p className="text-sm text-gray-600 mb-4">Adjust spacing between sections</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Spacing: {customizations.spacing?.scale || 1.0}x</span>
            <span className="text-xs text-gray-500">
              {customizations.spacing?.scale === 1 ? 'Default' :
               customizations.spacing?.scale! > 1 ? 'More Space' : 'Less Space'}
            </span>
          </div>
          <Slider
            value={[customizations.spacing?.scale || 1]}
            onValueChange={handleSpacingScaleChange}
            min={0.5}
            max={1.5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tight</span>
            <span>Default</span>
            <span>Spacious</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Margin Adjustment */}
      <div>
        <Label className="text-base font-medium">Page Margins</Label>
        <p className="text-sm text-gray-600 mb-4">Adjust page margins</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Margins: {customizations.margins?.scale || 1.0}x</span>
            <span className="text-xs text-gray-500">
              {customizations.margins?.scale === 1 ? 'Default' :
               customizations.margins?.scale! > 1 ? 'Wider' : 'Narrower'}
            </span>
          </div>
          <Slider
            value={[customizations.margins?.scale || 1]}
            onValueChange={handleMarginScaleChange}
            min={0.5}
            max={1.5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Narrow</span>
            <span>Default</span>
            <span>Wide</span>
          </div>
        </div>
      </div>

      {/* ATS Compliance Warning */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          Standard margins (0.75" to 1") work best with most ATS systems.
          Avoid margins smaller than 0.5" or larger than 1.5".
        </AlertDescription>
      </Alert>
    </div>
  );
};

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  template,
  onCustomizationChange,
  onPreview,
  onSave,
  onReset,
  loading = false,
  className
}) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [customizations, setCustomizations] = useState<CustomizationOptions>(
    template.customization
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [history, setHistory] = useState<CustomizationOptions[]>([customizations]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    const hasChanged = JSON.stringify(customizations) !== JSON.stringify(template.customization);
    setHasChanges(hasChanged);
  }, [customizations, template.customization]);

  const handleCustomizationChange = (newCustomizations: Partial<CustomizationOptions>) => {
    const updated = {
      ...customizations,
      ...newCustomizations
    };

    setCustomizations(updated);
    onCustomizationChange(updated);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousCustomizations = history[newIndex];
      setCustomizations(previousCustomizations);
      onCustomizationChange(previousCustomizations);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextCustomizations = history[newIndex];
      setCustomizations(nextCustomizations);
      onCustomizationChange(nextCustomizations);
    }
  };

  const handleReset = () => {
    const defaultCustomizations = template.customization;
    setCustomizations(defaultCustomizations);
    onCustomizationChange(defaultCustomizations);
    setHistory([defaultCustomizations]);
    setHistoryIndex(0);
    onReset();
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customize Template</h2>
          <p className="text-sm text-gray-600 mt-1">
            Personalize your resume template with colors, fonts, and layout
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>

          <Button
            onClick={onSave}
            disabled={!hasChanges || loading}
            loading={loading}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Customization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="fonts" className="flex items-center">
            <Type className="w-4 h-4 mr-2" />
            Fonts
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center">
            <Layout className="w-4 h-4 mr-2" />
            Layout
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Color Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorCustomizer
                  customizations={customizations.colors}
                  onChange={(colors) => handleCustomizationChange({ colors })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fonts">
            <Card>
              <CardHeader>
                <CardTitle>Font Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <FontCustomizer
                  customizations={customizations.fonts}
                  onChange={(fonts) => handleCustomizationChange({ fonts })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout">
            <Card>
              <CardHeader>
                <CardTitle>Layout Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <LayoutCustomizer
                  customizations={customizations.layout}
                  onChange={(layout) => handleCustomizationChange({ layout })}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Changes Indicator */}
      {hasChanges && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply them to your template.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TemplateCustomizer;