/**
 * Customization Panel component for resume templates
 * Provides comprehensive UI for customizing template appearance and structure
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Palette,
  Type,
  Layout,
  Eye,
  Settings,
  RotateCcw,
  Download,
  Upload,
  Undo,
  Info,
  Check,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTemplateCustomization, useColorThemes, useTypographyCombinations, useLayoutPresets } from '@/hooks/use-template-customization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomizationPanelProps {
  template: any;
  initialCustomization?: any;
  onCustomizationChange?: (customization: any) => void;
  className?: string;
}

export function CustomizationPanel({
  template,
  initialCustomization,
  onCustomizationChange,
  className = ''
}: CustomizationPanelProps) {
  const {
    customization,
    isLoading,
    isDirty,
    error,
    analytics,
    applyColorTheme,
    customizeColor,
    applyFontCombination,
    customizeTypography,
    applyLayoutPreset,
    customizeLayout,
    toggleSection,
    reorderSections,
    applyRoleCustomization,
    resetToDefaults,
    undoLastChange,
    exportCustomization,
    importCustomization,
    generateCSS,
    clearError
  } = useTemplateCustomization({
    template,
    initialCustomization,
    onCustomizationChange
  });

  const { getPredefinedThemes, isATSSafeColor } = useColorThemes();
  const { getProfessionalCombinations, getATSSafeFonts } = useTypographyCombinations();
  const { getPredefinedLayouts } = useLayoutPresets();

  const [activeTab, setActiveTab] = useState('colors');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    colors: true,
    typography: false,
    layout: false,
    sections: false,
    analytics: false
  });

  const colorThemes = getPredefinedThemes();
  const fontCombinations = getProfessionalCombinations();
  const layoutPresets = getPredefinedLayouts();

  const toggleSectionExpanded = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          importCustomization(content);
        } catch (error) {
          console.error('Failed to import customization:', error);
        }
      };
      reader.readAsText(file);
    }
  }, [importCustomization]);

  const handleExport = useCallback(() => {
    const customizationData = exportCustomization();
    const blob = new Blob([customizationData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-customization-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportCustomization]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Template Customization
            </CardTitle>
            <CardDescription>
              Customize your resume template while maintaining ATS optimization
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="secondary" className="text-xs">
                Unsaved Changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={undoLastChange}
              disabled={!isDirty}
            >
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <X className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSectionExpanded('colorThemes')}
                >
                  <h3 className="text-lg font-medium">Color Themes</h3>
                  {expandedSections.colorThemes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {expandedSections.colorThemes && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {colorThemes.map((theme) => (
                      <Button
                        key={theme.name}
                        variant="outline"
                        className="h-auto p-3 justify-start"
                        onClick={() => applyColorTheme(theme.name.toLowerCase().replace(' ', '_'))}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex gap-1">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.text }}
                            />
                          </div>
                          <span className="text-sm">{theme.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSectionExpanded('customColors')}
                >
                  <h3 className="text-lg font-medium">Custom Colors</h3>
                  {expandedSections.customColors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {expandedSections.customColors && customization && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(customization.colorScheme).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Label className="w-24 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <Input
                          type="color"
                          value={value}
                          onChange={(e) => customizeColor(key as keyof typeof customization.colorScheme, e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            if (isATSSafeColor(e.target.value)) {
                              customizeColor(key as keyof typeof customization.colorScheme, e.target.value);
                            }
                          }}
                          className="flex-1"
                        />
                        {isATSSafeColor(value) ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSectionExpanded('fontCombos')}
                >
                  <h3 className="text-lg font-medium">Professional Combinations</h3>
                  {expandedSections.fontCombos ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {expandedSections.fontCombos && (
                  <div className="mt-3 space-y-2">
                    {fontCombinations.map((combo) => (
                      <Button
                        key={combo.name}
                        variant="outline"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => applyFontCombination(combo.name)}
                      >
                        <div>
                          <div className="font-medium">{combo.name}</div>
                          <div className="text-xs text-muted-foreground">{combo.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSectionExpanded('customTypography')}
                >
                  <h3 className="text-lg font-medium">Custom Typography</h3>
                  {expandedSections.customTypography ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {expandedSections.customTypography && customization && (
                  <div className="mt-3 space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Base Font Size</Label>
                      <Slider
                        value={[customization.typography.body.fontSize.normal]}
                        onValueChange={([value]) => customizeTypography({
                          body: { fontSize: { ...customization.typography.body.fontSize, normal: value } }
                        })}
                        min={10}
                        max={14}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>10pt</span>
                        <span>{customization.typography.body.fontSize.normal}pt</span>
                        <span>14pt</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Line Height</Label>
                      <Slider
                        value={[customization.typography.body.lineHeight]}
                        onValueChange={([value]) => customizeTypography({
                          body: { lineHeight: value }
                        })}
                        min={1.0}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Tight</span>
                        <span>{customization.typography.body.lineHeight}</span>
                        <span>Loose</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSectionExpanded('layoutPresets')}
                >
                  <h3 className="text-lg font-medium">Layout Presets</h3>
                  {expandedSections.layoutPresets ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {expandedSections.layoutPresets && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {layoutPresets.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        className="h-auto p-3"
                        onClick={() => applyLayoutPreset(preset.id)}
                      >
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-muted-foreground">{preset.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSectionExpanded('customLayout')}
                >
                  <h3 className="text-lg font-medium">Custom Layout</h3>
                  {expandedSections.customLayout ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {expandedSections.customLayout && customization && (
                  <div className="mt-3 space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Section Spacing</Label>
                      <Slider
                        value={[customization.layout.sectionSpacing.before]}
                        onValueChange={([value]) => customizeLayout({
                          sectionSpacing: { before: value, after: customization.layout.sectionSpacing.after }
                        })}
                        min={6}
                        max={24}
                        step={2}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Tight</span>
                        <span>{customization.layout.sectionSpacing.before}pt</span>
                        <span>Loose</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Item Spacing</Label>
                      <Slider
                        value={[customization.layout.itemSpacing]}
                        onValueChange={([value]) => customizeLayout({ itemSpacing: value })}
                        min={2}
                        max={12}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Tight</span>
                        <span>{customization.layout.itemSpacing}pt</span>
                        <span>Loose</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-4">
            <div>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSectionExpanded('sectionVisibility')}
              >
                <h3 className="text-lg font-medium">Section Visibility</h3>
                {expandedSections.sectionVisibility ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
              {expandedSections.sectionVisibility && customization && (
                <div className="mt-3 space-y-3">
                  {Object.entries(customization.sectionVisibility.sections)
                    .sort(([, a], [, b]) => a.order - b.order)
                    .map(([sectionId, section]) => (
                      <div key={sectionId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{section.name}</div>
                          <div className="text-sm text-muted-foreground">{section.description}</div>
                          {section.required && (
                            <Badge variant="secondary" className="mt-1">Required</Badge>
                          )}
                        </div>
                        <Switch
                          checked={section.visible}
                          onCheckedChange={() => toggleSection(sectionId)}
                          disabled={section.required}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {analytics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.overallScore}/100</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.atsScore}/100</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analytics.strengths.map((strength, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {analytics.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analytics.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Info className="h-4 w-4 text-blue-600" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analytics.warnings.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-1">
                        {analytics.warnings.map((warning, index) => (
                          <div key={index} className="text-sm">{warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <label htmlFor="import-customization">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </span>
              </Button>
            </label>
            <input
              id="import-customization"
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}