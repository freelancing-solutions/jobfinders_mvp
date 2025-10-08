/**
 * Resume Editor Component
 *
 * Main resume editing interface with real-time suggestions, AI-powered analysis,
 * and seamless integration with template system and ATS optimization.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  Eye,
  Download,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Globe,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Edit,
  Copy,
  Move
} from 'lucide-react';
import { Resume, PersonalInfo, Experience, Education, Skill, Project, Certification, Language, TemplateCustomization } from '@/types/resume';
import { ResumeTemplate, RenderedTemplate } from '@/types/template';
import { templateService } from '@/services/templates/template-service';
import { resumeBuilder } from '@/services/resume-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { Layout, Settings, X } from 'lucide-react';

interface ResumeEditorProps {
  initialResume?: Resume;
  template?: ResumeTemplate;
  onTemplateChange?: (template: ResumeTemplate) => void;
  onSave?: (resume: Resume) => void;
  onPreview?: (resume: Resume) => void;
  onExport?: (resume: Resume, format: string) => void;
  onAnalysisRequest?: (resume: Resume) => void;
  loading?: boolean;
  className?: string;
  userId?: string;
  showTemplateSelector?: boolean;
  enableTemplateCustomization?: boolean;
}

interface EditableSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

const EditableSection: React.FC<EditableSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = true,
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    onToggle?.(open);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <CollapsibleTrigger className="w-full">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg">
                  {icon}
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              <ChevronRight
                className={cn(
                  "w-5 h-5 text-gray-400 transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              />
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2 border-t-0 rounded-t-none">
          <CardContent className="pt-6">
            {children}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface PersonalInfoEditorProps {
  personalInfo: PersonalInfo;
  onChange: (personalInfo: PersonalInfo) => void;
  suggestions?: string[];
}

const PersonalInfoEditor: React.FC<PersonalInfoEditorProps> = ({
  personalInfo,
  onChange,
  suggestions = []
}) => {
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...personalInfo,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={personalInfo.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          onFocus={() => setFieldFocus('fullName')}
          onBlur={() => setFieldFocus(null)}
          placeholder="John Doe"
          className="font-semibold"
        />
        {suggestions.length > 0 && fieldFocus === 'fullName' && (
          <div className="p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-700">
              <Lightbulb className="w-4 h-4 inline mr-1" />
              Tip: Use your full legal name as it appears on official documents
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Professional Title *</Label>
        <Input
          id="title"
          value={personalInfo.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Senior Software Engineer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={personalInfo.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="john.doe@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          value={personalInfo.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={personalInfo.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="New York, NY"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          value={personalInfo.linkedin || ''}
          onChange={(e) => handleChange('linkedin', e.target.value)}
          placeholder="https://linkedin.com/in/johndoe"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="github">GitHub</Label>
        <Input
          id="github"
          value={personalInfo.github || ''}
          onChange={(e) => handleChange('github', e.target.value)}
          placeholder="https://github.com/johndoe"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={personalInfo.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://johndoe.com"
        />
      </div>
    </div>
  );
};

interface ExperienceEditorProps {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
  suggestions?: string[];
}

const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  experience,
  onChange,
  suggestions = []
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addExperience = () => {
    const newExperience: Experience = {
      id: `exp_${Date.now()}`,
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
      skills: []
    };
    onChange([...experience, newExperience]);
    setEditingIndex(experience.length);
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experience];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  const deleteExperience = (index: number) => {
    const updated = experience.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= experience.length) return;

    const updated = [...experience];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Work Experience</h3>
        <Button onClick={addExperience} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {experience.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No work experience added yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your work experience to showcase your professional journey</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, index) => (
            <Card key={exp.id} className={editingIndex === index ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <div>
                      <h4 className="font-semibold">
                        {exp.title || 'Job Title'}
                        {exp.company && ` at ${exp.company}`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {exp.startDate && `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}`}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveExperience(index, 'up')}
                            disabled={index === 0}
                          >
                            <Move className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move Up</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveExperience(index, 'down')}
                            disabled={index === experience.length - 1}
                          >
                            <Move className="w-4 h-4 rotate-180" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move Down</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExperience(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Collapsible open={editingIndex === index}>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Job Title *</Label>
                        <Input
                          value={exp.title || ''}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                          placeholder="Senior Software Engineer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Company *</Label>
                        <Input
                          value={exp.company || ''}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          placeholder="Tech Company Inc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          value={exp.location || ''}
                          onChange={(e) => updateExperience(index, 'location', e.target.value)}
                          placeholder="New York, NY"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Employment Period</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="month"
                            value={exp.startDate || ''}
                            onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                            placeholder="Start Date"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="month"
                            value={exp.endDate || ''}
                            onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                            placeholder="End Date"
                            disabled={exp.current}
                          />
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={exp.current}
                              onCheckedChange={(checked) => {
                                updateExperience(index, 'current', checked);
                                if (checked) {
                                  updateExperience(index, 'endDate', '');
                                }
                              }}
                            />
                            <Label className="text-sm">Current</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Job Description</Label>
                      <Textarea
                        value={exp.description || ''}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder="Describe your role and responsibilities..."
                        rows={3}
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Key Achievements</Label>
                      <Textarea
                        value={exp.achievements?.join('\n') || ''}
                        onChange={(e) => updateExperience(index, 'achievements', e.target.value.split('\n').filter(Boolean))}
                        placeholder="• Increased team productivity by 30%&#10;• Led project that generated $1M revenue&#10;• Mentored 5 junior developers"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500">
                        Enter each achievement on a new line. Start with bullet points for best ATS results.
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface SummaryEditorProps {
  summary: string;
  onChange: (summary: string) => void;
  suggestions?: string[];
  wordCount?: { current: number; recommended: { min: number; max: number } };
}

const SummaryEditor: React.FC<SummaryEditorProps> = ({
  summary,
  onChange,
  suggestions = [],
  wordCount = { current: 0, recommended: { min: 50, max: 150 } }
}) => {
  const currentWordCount = summary.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="summary" className="text-base font-medium">
          Professional Summary
        </Label>
        <div className="flex items-center space-x-4">
          <span className={cn(
            "text-sm",
            currentWordCount < wordCount.recommended.min || currentWordCount > wordCount.recommended.max
              ? "text-orange-600"
              : "text-green-600"
          )}>
            {currentWordCount} words
          </span>
          {currentWordCount < wordCount.recommended.min && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Too short
            </Badge>
          )}
          {currentWordCount > wordCount.recommended.max && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Too long
            </Badge>
          )}
          {currentWordCount >= wordCount.recommended.min && currentWordCount <= wordCount.recommended.max && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              Good length
            </Badge>
          )}
        </div>
      </div>

      <Textarea
        id="summary"
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a compelling professional summary that highlights your key qualifications, experience, and career goals. Aim for 50-150 words for optimal impact."
        rows={4}
        className="resize-none"
      />

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Recommended: {wordCount.recommended.min}-{wordCount.recommended.max} words</span>
        <span>ATS Optimized: Focus on keywords and quantifiable achievements</span>
      </div>

      {suggestions.length > 0 && (
        <Alert>
          <Lightbulb className="w-4 h-4" />
          <AlertDescription>
            <strong>Suggestion:</strong> {suggestions[0]}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  initialResume,
  template,
  onTemplateChange,
  onSave,
  onPreview,
  onExport,
  onAnalysisRequest,
  loading = false,
  className,
  userId,
  showTemplateSelector = true,
  enableTemplateCustomization = true
}) => {
  const [resume, setResume] = useState<Resume>(
    initialResume || {
      id: `resume_${Date.now()}`,
      userId: '',
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      metadata: {
        title: 'Professional Resume',
        description: '',
        experienceLevel: 'mid',
        documentFormat: 'pdf'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  const [activeSection, setActiveSection] = useState<string>('personal-info');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Template-related state
  const [currentTemplate, setCurrentTemplate] = useState<ResumeTemplate | undefined>(template);
  const [templateCustomization, setTemplateCustomization] = useState<TemplateCustomization | undefined>();
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [resume]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(resume);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }
  }, [resume, onSave]);

  const handlePreview = useCallback(() => {
    if (onPreview) {
      onPreview(resume);
    }
  }, [resume, onPreview]);

  const handleExport = useCallback((format: string) => {
    if (onExport) {
      onExport(resume, format);
    }
  }, [resume, onExport]);

  const handleAnalysisRequest = useCallback(() => {
    if (onAnalysisRequest) {
      setIsAnalyzing(true);
      onAnalysisRequest(resume);
      setTimeout(() => setIsAnalyzing(false), 3000); // Simulate analysis time
    }
  }, [resume, onAnalysisRequest]);

  // Template-related handlers
  const handleTemplateSelect = useCallback(async (selectedTemplate: ResumeTemplate, customization?: TemplateCustomization) => {
    if (!userId) return;

    try {
      setIsApplyingTemplate(true);

      // Apply template to resume
      const updatedResume = await templateService.applyTemplateToResume(
        resume.id,
        selectedTemplate.templateId,
        userId,
        customization?.id
      );

      setResume(updatedResume);
      setCurrentTemplate(selectedTemplate);
      setTemplateCustomization(customization);
      setShowTemplateDialog(false);

      if (onTemplateChange) {
        onTemplateChange(selectedTemplate);
      }

      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to apply template:', error);
    } finally {
      setIsApplyingTemplate(false);
    }
  }, [resume, userId, onTemplateChange]);

  const handleTemplateCustomizationChange = useCallback((customization: TemplateCustomization) => {
    setTemplateCustomization(customization);
    setHasUnsavedChanges(true);
  }, []);

  const openTemplateSelector = useCallback(() => {
    setShowTemplateDialog(true);
  }, []);

  const sections = [
    {
      id: 'personal-info',
      title: 'Contact Information',
      icon: <User className="w-4 h-4" />,
      component: (
        <PersonalInfoEditor
          personalInfo={resume.personalInfo}
          onChange={(personalInfo) => setResume({ ...resume, personalInfo })}
          suggestions={[
            'Use your full legal name as it appears on official documents',
            'Include a professional title that describes your current role or target position',
            'Ensure your email address is professional (firstname.lastname@domain.com)'
          ]}
        />
      )
    },
    {
      id: 'summary',
      title: 'Professional Summary',
      icon: <FileText className="w-4 h-4" />,
      component: (
        <SummaryEditor
          summary={resume.summary || ''}
          onChange={(summary) => setResume({ ...resume, summary })}
          suggestions={[
            'Start with a strong opening statement that highlights your expertise',
            'Include 2-3 key achievements with quantifiable results',
            'Mention your career goals and what you bring to the role'
          ]}
          wordCount={{
            current: resume.summary?.split(/\s+/).filter(Boolean).length || 0,
            recommended: { min: 50, max: 150 }
          }}
        />
      )
    },
    {
      id: 'experience',
      title: 'Work Experience',
      icon: <Briefcase className="w-4 h-4" />,
      component: (
        <ExperienceEditor
          experience={resume.experience || []}
          onChange={(experience) => setResume({ ...resume, experience })}
          suggestions={[
            'List experiences in reverse chronological order (most recent first)',
            'Use action verbs to start bullet points (e.g., "Led," "Developed," "Managed")',
            'Quantify achievements with numbers, percentages, or dollar amounts'
          ]}
        />
      )
    }
  ];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Resume Editor</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Layout className="w-3 h-3" />
                {currentTemplate?.name || 'No Template Selected'}
              </span>
              {templateCustomization && (
                <Badge variant="secondary" className="text-xs">
                  {templateCustomization.name}
                </Badge>
              )}
              {lastSaved && (
                <span className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="flex items-center text-orange-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showTemplateSelector && (
            <Button
              variant="outline"
              size="sm"
              onClick={openTemplateSelector}
              disabled={isApplyingTemplate}
            >
              {isApplyingTemplate ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <Layout className="w-4 h-4 mr-2" />
                  Change Template
                </>
              )}
            </Button>
          )}

          {currentTemplate && enableTemplateCustomization && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Open customization panel */}}
            >
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalysisRequest}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Analysis
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>

          <div className="relative">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Resume</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleExport('pdf')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <FileText className="w-8 h-8 mb-2" />
                      <span>PDF</span>
                      <span className="text-xs text-gray-500">Best for printing</span>
                    </Button>
                    <Button
                      onClick={() => handleExport('docx')}
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <FileText className="w-8 h-8 mb-2" />
                      <span>DOCX</span>
                      <span className="text-xs text-gray-500">For editing</span>
                    </Button>
                    <Button
                      onClick={() => handleExport('html')}
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Globe className="w-8 h-8 mb-2" />
                      <span>HTML</span>
                      <span className="text-xs text-gray-500">For web</span>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeSection === section.id
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {section.icon}
                <span className="font-medium">{section.title}</span>
              </button>
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Actions
            </h3>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.open('/templates', '_blank')}
            >
              <Edit className="w-4 h-4 mr-2" />
              Change Template
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleAnalysisRequest}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Check ATS Score
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {sections.map((section) => (
              <EditableSection
                key={section.id}
                title={section.title}
                icon={section.icon}
                defaultOpen={true}
                onToggle={(open) => open && setActiveSection(section.id)}
              >
                {section.component}
              </EditableSection>
            ))}

            {/* Additional Sections */}
            <EditableSection
              title="Education"
              icon={<GraduationCap className="w-4 h-4" />}
              defaultOpen={false}
            >
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Education section coming soon</p>
              </div>
            </EditableSection>

            <EditableSection
              title="Skills"
              icon={<Award className="w-4 h-4" />}
              defaultOpen={false}
            >
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Skills section coming soon</p>
              </div>
            </EditableSection>
          </div>
        </div>
      </div>

      {/* Template Selector Dialog */}
      {showTemplateDialog && userId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] m-4">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Choose a Template</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TemplateGallery
                onTemplateSelect={(template) => {
                  // Apply template directly without confirmation for better UX
                  handleTemplateSelect(template);
                }}
                userId={userId}
                jobTitle={resume.metadata?.title}
                industry={resume.metadata?.targetIndustry}
                experienceLevel={resume.metadata?.experienceLevel}
                enableRecommendations={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;