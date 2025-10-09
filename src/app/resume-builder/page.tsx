/**
 * Resume Builder Page
 *
 * Main entry point for the AI-powered resume builder application.
 * Integrates template selection, editing, analysis, and export functionality.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Resume, PersonalInfo, Experience, Education, Skill } from '@/types/resume';
import { ResumeTemplate, RenderedTemplate } from '@/types/template';
import { ResumeAnalysis } from '@/types/resume';
import { ResumeEditor } from '@/components/resume/ResumeEditor';
import { TemplateGallery } from '@/components/template/TemplateGallery';
import { TemplateCustomizer } from '@/components/template/TemplateCustomizer';
import { AnalysisDashboard } from '@/components/resume/AnalysisDashboard';
import { ExportPreview } from '@/components/resume/ExportPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Target,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockTemplates: ResumeTemplate[] = [
  {
    id: 'executive-pro',
    name: 'Executive Pro',
    description: 'Sophisticated template for C-suite executives',
    category: 'professional' as any,
    preview: {
      thumbnail: '/templates/professional/executive-pro-thumbnail.png',
      large: '/templates/professional/executive-pro-preview.png'
    },
    layout: {
      format: 'single-column' as any,
      headerStyle: 'centered' as any,
      sectionOrder: [],
      spacing: {
        section: 24,
        item: 16,
        line: 1.6,
        margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        padding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
      },
      dimensions: {
        width: 8.5,
        height: 11,
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        orientation: 'portrait' as any
      },
      responsiveness: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
        large: 1440
      },
      columns: {
        count: 1,
        widths: [100],
        gutters: 20,
        breakpoints: {
          mobile: 768,
          tablet: 1024,
          desktop: 1200,
          large: 1440
        }
      }
    },
    styling: {
      fonts: {
        heading: {
          name: 'Georgia',
          stack: ['Georgia', 'Times New Roman', 'serif'],
          weights: [
            { weight: 400, name: 'Regular' },
            { weight: 700, name: 'Bold' }
          ]
        },
        body: {
          name: 'Arial',
          stack: ['Arial', 'Helvetica', 'sans-serif'],
          weights: [
            { weight: 400, name: 'Regular' },
            { weight: 700, name: 'Bold' }
          ]
        },
        accents: {
          name: 'Arial',
          stack: ['Arial', 'Helvetica', 'sans-serif'],
          weights: [
            { weight: 700, name: 'Bold' }
          ]
        },
        fallbacks: [
          { category: 'serif', fonts: ['Georgia', 'Times New Roman', 'serif'] },
          { category: 'sans-serif', fonts: ['Arial', 'Helvetica', 'sans-serif'] }
        ]
      },
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        text: {
          primary: '#1e293b',
          secondary: '#475569',
          tertiary: '#64748b',
          inverse: '#ffffff',
          muted: '#94a3b8',
          accent: '#ef4444'
        },
        background: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
          accent: '#fef2f2'
        }
      },
      sizes: {
        heading: {
          h1: 42,
          h2: 28,
          h3: 22,
          h4: 18,
          h5: 16,
          h6: 14
        },
        body: {
          xs: 11,
          sm: 12,
          base: 14,
          lg: 16,
          xl: 18,
          '2xl': 20,
          '3xl': 24
        }
      }
    },
    sections: [],
    features: {
      atsOptimized: true,
      mobileOptimized: true,
      printOptimized: true,
      accessibilityFeatures: {
        wcagCompliant: true,
        screenReaderOptimized: true,
        keyboardNavigable: true,
        highContrastMode: true,
        fontScaling: true
      },
      interactiveFeatures: {
        livePreview: true,
        realTimeUpdates: true,
        dragAndDrop: false,
        collapsibleSections: false,
        expandableContent: false
      },
      premiumFeatures: {
        advancedCustomization: false,
        multipleLayouts: false,
        customSections: false,
        brandColors: false,
        prioritySupport: false
      }
    },
    atsOptimization: {
      formatCompliance: true,
      keywordDensity: {
        enabled: true,
        targetDensity: 2.5,
        suggestions: [],
        analysis: {
          density: 0,
          relevance: 0,
          placement: [],
          missing: [],
          overused: []
        }
      },
      structureValidation: {
        strictMode: true,
        requiredSections: ['personal-info', 'summary', 'experience', 'education', 'skills'],
        prohibitedElements: ['tables', 'columns', 'images', 'charts'],
        sectionOrder: ['personal-info', 'summary', 'experience', 'education', 'certifications', 'skills', 'languages'],
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: true,
          dateFormatting: true,
          phoneFormatting: true,
          urlFormatting: true
        }
      }
    },
    customization: {
      colors: {
        themes: [],
        customColors: [],
        currentTheme: 'executive-pro-default',
        allowCustom: true
      },
      fonts: {
        families: [],
        sizes: {
          heading: [36, 40, 44, 48],
          body: [11, 12, 13, 14, 15],
          scale: 1
        },
        weights: {
          heading: [400, 700],
          body: [400, 700]
        },
        lineHeight: {
          tight: 1.4,
          normal: 1.6,
          relaxed: 1.8
        }
      },
      layout: {
        spacing: {
          section: 28,
          item: 16,
          line: 1.6,
          scale: 1
        },
        margins: {
          top: 0.75,
          right: 0.75,
          bottom: 0.75,
          left: 0.75,
          scale: 1
        },
        columns: {
          count: 1,
          widths: [100],
          gutters: 20
        },
        alignment: {
          header: 'center',
          sections: 'left',
          content: 'left'
        }
      }
    },
    metadata: {
      version: '1.0.0',
      author: 'JobFinders Template Team',
      created: new Date('2024-01-01'),
      updated: new Date('2024-01-15'),
      tags: ['executive', 'professional', 'leadership', 'corporate'],
      downloads: 1247,
      rating: 4.8,
      reviews: 156,
      compatibility: [],
      requirements: {
        minBrowserVersion: 'Chrome 120',
        features: ['CSS Grid', 'Flexbox', 'Custom Properties'],
        limitations: ['No external dependencies']
      },
      license: {
        type: 'premium' as any,
        restrictions: ['Commercial use requires license'],
        attribution: false,
        commercialUse: true,
        modification: false
      }
    }
  }
];

const mockAnalysis: ResumeAnalysis = {
  id: 'analysis-123',
  resumeId: 'resume-456',
  jobDescription: 'Senior Software Engineer position at a tech company',
  atsScore: 85,
  keywordMatches: [
    {
      keyword: 'javascript',
      found: true,
      count: 3,
      context: ['Experience with JavaScript frameworks', 'JavaScript development', 'JavaScript applications'],
      importance: 'high'
    },
    {
      keyword: 'react',
      found: true,
      count: 2,
      context: ['React applications', 'React development'],
      importance: 'high'
    },
    {
      keyword: 'node.js',
      found: true,
      count: 1,
      context: ['Node.js backend development'],
      importance: 'medium'
    },
    {
      keyword: 'python',
      found: false,
      count: 0,
      context: [],
      importance: 'low'
    }
  ],
  skillGaps: [
    {
      skill: 'Docker',
      importance: 'preferred' as any,
      foundInResume: false,
      proficiencyLevel: 'intermediate'
    },
    {
      skill: 'AWS',
      importance: 'preferred' as any,
      foundInResume: true,
      proficiencyLevel: 'advanced'
    }
  ],
  improvementSuggestions: [
    {
      category: 'content' as any,
      priority: 'high' as any,
      suggestion: 'Add quantifiable achievements to your experience',
      description: 'Include specific metrics like percentages, dollar amounts, or time frames',
      example: 'Increased team productivity by 30% through implementation of agile methodologies',
      section: 'experience'
    },
    {
      category: 'keywords' as any,
      priority: 'medium' as any,
      suggestion: 'Include more technical keywords from the job description',
      description: 'The job description mentions Docker which is not in your resume',
      example: 'Add Docker to your skills section with proficiency level',
      section: 'skills'
    }
  ],
  strengths: [
    'Strong technical foundation with modern web technologies',
    'Good work experience progression',
    'Clear and professional summary'
  ],
  weaknesses: [
    'Limited quantifiable achievements',
    'Missing some key technical skills',
    'Could improve professional summary'
  ],
  analyzedAt: new Date()
};

export default function ResumeBuilderPage() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [resume, setResume] = useState<Resume>({
    id: 'resume-123',
    userId: 'user-456',
    personalInfo: {
      fullName: 'John Doe',
      title: 'Senior Software Engineer',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      website: 'https://johndoe.dev'
    },
    summary: 'Experienced Senior Software Engineer with 8+ years of expertise in full-stack web development, specializing in React, Node.js, and cloud technologies. Proven track record of leading development teams and delivering high-quality, scalable solutions.',
    experience: [
      {
        id: 'exp-1',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        startDate: '2021-01',
        endDate: null,
        current: true,
        description: 'Leading development of enterprise web applications and mentoring junior developers.',
        achievements: [
          'Increased application performance by 40% through optimization initiatives',
          'Led team of 5 developers in successful project delivery',
          'Implemented CI/CD pipeline reducing deployment time by 60%'
        ],
        skills: ['React', 'Node.js', 'TypeScript', 'AWS']
      }
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'Berkeley, CA',
        startDate: '2014-09',
        endDate: '2018-05',
        gpa: 3.8
      }
    ],
    skills: [
      {
        id: 'skill-1',
        name: 'JavaScript',
        category: 'technical' as any,
        level: 'expert' as any
      },
      {
        id: 'skill-2',
        name: 'React',
        category: 'technical' as any,
        level: 'expert' as any
      },
      {
        id: 'skill-3',
        name: 'Node.js',
        category: 'technical' as any,
        level: 'advanced' as any
      }
    ],
    projects: [],
    certifications: [],
    languages: [],
    metadata: {
      title: 'Senior Software Engineer Resume',
      description: 'Professional resume for software engineering positions',
      experienceLevel: 'senior' as any,
      documentFormat: 'pdf'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [renderedTemplate, setRenderedTemplate] = useState<RenderedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTemplateSelect = useCallback((template: ResumeTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('editor');
  }, []);

  const handleTemplateCustomization = useCallback((customizations: any) => {
    // In a real implementation, this would update the template with customizations
    console.log('Template customized:', customizations);
  }, []);

  const handleAnalysisRequest = useCallback(async (resumeData: Resume) => {
    setIsAnalyzing(true);

    // Simulate API call for analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  }, []);

  const handleExport = useCallback(async (format: string, options: any) => {
    setIsLoading(true);

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockResult = {
      success: true,
      url: `https://example.com/resume.${format}`,
      fileName: `john-doe-resume.${format}`,
      fileSize: format === 'pdf' ? 125000 : 85000,
      downloadUrl: `https://example.com/download/resume.${format}`
    };

    setIsLoading(false);
    return mockResult;
  }, []);

  const handleSave = useCallback((resumeData: Resume) => {
    setResume(resumeData);
    console.log('Resume saved:', resumeData);
  }, []);

  const handlePreview = useCallback((resumeData: Resume) => {
    // Generate preview
    console.log('Preview generated for:', resumeData);
  }, []);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'templates':
        return <FileText className="w-5 h-5" />;
      case 'editor':
        return <Settings className="w-5 h-5" />;
      case 'analysis':
        return <Target className="w-5 h-5" />;
      case 'export':
        return <Download className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'templates':
        return selectedTemplate ? 'completed' : 'active';
      case 'editor':
        return selectedTemplate ? 'active' : 'upcoming';
      case 'analysis':
        return analysis ? 'completed' : 'upcoming';
      case 'export':
        return analysis ? 'upcoming' : 'upcoming';
      default:
        return 'upcoming';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Zap className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Resume Builder</h1>
                <p className="text-sm text-gray-600">AI-Powered Resume Creation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Enhanced</span>
              </Badge>

              {selectedTemplate && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{selectedTemplate.name}</span>
                </Badge>
              )}

              {analysis && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>ATS Score: {analysis.atsScore}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {['templates', 'editor', 'analysis', 'export'].map((step, index) => (
                <div key={step} className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      getStepStatus(step) === 'completed' && "bg-green-500 text-white",
                      getStepStatus(step) === 'active' && "bg-blue-500 text-white",
                      getStepStatus(step) === 'upcoming' && "bg-gray-200 text-gray-600"
                    )}
                  >
                    {getStepIcon(step)}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-medium capitalize",
                        getStepStatus(step) === 'active' && "text-blue-600",
                        getStepStatus(step) === 'completed' && "text-green-600",
                        getStepStatus(step) === 'upcoming' && "text-gray-500"
                      )}
                    >
                      {step}
                    </span>
                    {getStepStatus(step) === 'active' && (
                      <span className="text-xs text-blue-600">Current Step</span>
                    )}
                  </div>
                  {index < 3 && (
                    <ArrowRight
                      className={cn(
                        "w-4 h-4",
                        getStepStatus(['templates', 'editor', 'analysis', 'export'][index + 1]) !== 'upcoming' ?
                          "text-green-500" : "text-gray-300"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <Progress
                value={
                  (getStepStatus('templates') === 'completed' ? 25 : 0) +
                  (getStepStatus('editor') === 'completed' ? 25 : 0) +
                  (getStepStatus('analysis') === 'completed' ? 25 : 0) +
                  (getStepStatus('export') === 'completed' ? 25 : 0)
                }
                className="w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>1. Choose Template</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>2. Edit Resume</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>3. Analyze & Optimize</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>4. Export & Share</span>
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6">
            <TabsContent value="templates">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Professional Template</h2>
                  <p className="text-gray-600">Select from our ATS-optimized templates designed for success</p>
                </div>

                <TemplateGallery
                  templates={mockTemplates}
                  onTemplateSelect={handleTemplateSelect}
                  onTemplatePreview={() => console.log('Template preview')}
                  selectedTemplateId={selectedTemplate?.id}
                  loading={false}
                />
              </div>
            </TabsContent>

            <TabsContent value="editor">
              <div className="space-y-6">
                {!selectedTemplate ? (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Please select a template first before editing your resume.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ResumeEditor
                        initialResume={resume}
                        template={selectedTemplate}
                        onTemplateChange={() => {}}
                        onSave={handleSave}
                        onPreview={handlePreview}
                        onAnalysisRequest={handleAnalysisRequest}
                        loading={false}
                      />
                    </div>

                    <div className="lg:col-span-1">
                      <TemplateCustomizer
                        template={selectedTemplate}
                        onCustomizationChange={handleTemplateCustomization}
                        onPreview={() => {}}
                        onSave={() => {}}
                        onReset={() => {}}
                        loading={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">ATS Analysis & Optimization</h2>
                  <p className="text-gray-600">Get detailed insights and improve your resume's ATS compatibility</p>
                </div>

                {!analysis ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
                    <p className="text-gray-600 mb-6">Complete your resume and run an ATS analysis to get optimization insights.</p>
                    <Button onClick={() => handleAnalysisRequest(resume)} disabled={isAnalyzing}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isAnalyzing ? 'Analyzing...' : 'Run ATS Analysis'}
                    </Button>
                  </div>
                ) : (
                  <AnalysisDashboard
                    resume={resume}
                    analysis={analysis}
                    onRefresh={() => handleAnalysisRequest(resume)}
                    onExport={() => console.log('Export analysis')}
                    onShare={() => console.log('Share analysis')}
                    loading={isAnalyzing}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="export">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Export & Share Your Resume</h2>
                  <p className="text-gray-600">Download your resume in multiple formats and share with employers</p>
                </div>

                <ExportPreview
                  resume={resume}
                  template={selectedTemplate!}
                  renderedTemplate={renderedTemplate}
                  onExport={handleExport}
                  loading={isLoading}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}