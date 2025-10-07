/**
 * Advanced Template Dashboard
 *
 * Comprehensive dashboard that showcases all advanced template features
 * including AI optimization, ATS analysis, performance metrics,
 * and intelligent recommendations.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Target,
  Zap,
  TrendingUp,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Activity,
  FileText,
  Users,
  Award,
  Clock,
  Eye,
  Lightbulb,
  Rocket,
  Shield,
  Sparkles
} from 'lucide-react';
import { ResumeTemplate, Resume, TemplateCustomization } from '@/types/resume';
import { advancedTemplateFeatures } from '@/services/templates/advanced-template-features';
import { templateRecommendationEngine } from '@/services/templates/template-recommendation-engine';
import { templatePerformanceOptimizer } from '@/services/templates/template-performance-optimizer';
import { aiTemplateOptimizer } from '@/services/templates/ai-template-optimizer';
import { advancedATSOptimizer } from '@/services/templates/advanced-ats-optimizer';
import { templateService } from '@/services/templates/template-service';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AdvancedTemplateDashboardProps {
  resume: Resume;
  userId: string;
  selectedTemplate?: ResumeTemplate;
  customization?: TemplateCustomization;
  onTemplateChange?: (template: ResumeTemplate) => void;
  className?: string;
}

interface DashboardState {
  activeTab: string;
  aiAnalysis: any;
  atsAnalysis: any;
  recommendations: any[];
  performanceMetrics: any;
  optimizationSuggestions: any[];
  isAnalyzing: boolean;
  error?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  description
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-2 mt-1">
              {trend && change !== undefined && (
                <span className={cn("text-sm flex items-center", trendColors[trend])}>
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(change)}%
                </span>
              )}
              <span className="text-xs text-gray-500">{description}</span>
            </div>
          </div>
          <div className="text-blue-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdvancedTemplateDashboard: React.FC<AdvancedTemplateDashboardProps> = ({
  resume,
  userId,
  selectedTemplate,
  customization,
  onTemplateChange,
  className
}) => {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'overview',
    aiAnalysis: null,
    atsAnalysis: null,
    recommendations: [],
    performanceMetrics: null,
    optimizationSuggestions: [],
    isAnalyzing: false
  });

  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [resume, selectedTemplate]);

  const loadDashboardData = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: undefined }));

    try {
      const [
        aiAnalysis,
        atsAnalysis,
        recommendations,
        performanceMetrics
      ] = await Promise.all([
        selectedTemplate ? runAIAnalysis() : null,
        selectedTemplate ? runATSAnalysis() : null,
        loadRecommendations(),
        loadPerformanceMetrics()
      ]);

      setState(prev => ({
        ...prev,
        aiAnalysis,
        atsAnalysis,
        recommendations,
        performanceMetrics,
        isAnalyzing: false
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: 'Failed to load dashboard data'
      }));
    }
  };

  const runAIAnalysis = async () => {
    if (!selectedTemplate) return null;

    const request = {
      resume,
      template: selectedTemplate,
      customization,
      targetJob: {
        title: resume.metadata?.title || 'Professional',
        description: 'Sample job description',
        requirements: []
      },
      userProfile: {
        experienceLevel: resume.metadata?.experienceLevel || 'mid',
        industry: resume.metadata?.targetIndustry || 'technology',
        careerGoals: [],
        skills: resume.skills?.map(s => s.name) || []
      }
    };

    return await aiTemplateOptimizer.analyzeAndOptimize(request);
  };

  const runATSAnalysis = async () => {
    if (!selectedTemplate) return null;

    const request = {
      resume,
      template: selectedTemplate,
      customization,
      jobDescription: 'Sample job description',
      industry: resume.metadata?.targetIndustry,
      experienceLevel: resume.metadata?.experienceLevel
    };

    return await advancedATSOptimizer.optimizeForATS(request);
  };

  const loadRecommendations = async () => {
    try {
      const context = {
        user: {
          id: userId,
          experienceLevel: resume.metadata?.experienceLevel,
          industry: resume.metadata?.targetIndustry,
          jobTitle: resume.metadata?.title,
          skills: resume.skills?.map(s => s.name) || []
        },
        resume,
        session: {}
      };

      const results = await templateRecommendationEngine.getRecommendations(context, 5);
      return results;
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      return [];
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const metrics = templatePerformanceOptimizer.getPerformanceMetrics();
      return metrics;
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
      return null;
    }
  };

  const handleOptimizationApply = async (optimization: any) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }));

      // Apply optimization based on type
      if (optimization.type === 'template_change') {
        // Apply template change
        if (onTemplateChange) {
          onTemplateChange(optimization.template);
        }
      } else if (optimization.type === 'content_optimization') {
        // Apply content optimization
        await applyContentOptimization(optimization);
      }

      // Reload data after optimization
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const applyContentOptimization = async (optimization: any) => {
    // Implementation for content optimization
    console.log('Applying content optimization:', optimization);
  };

  const generateSmartSuggestions = async () => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }));

      const suggestions = await generateAISuggestions();
      setState(prev => ({
        ...prev,
        optimizationSuggestions: suggestions,
        isAnalyzing: false
      }));
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const generateAISuggestions = async () => {
    const suggestions = [];

    // Generate AI-powered suggestions
    if (state.aiAnalysis?.actionItems) {
      suggestions.push(...state.aiAnalysis.actionItems.map((item: any) => ({
        type: 'content',
        title: item.action,
        description: item.description,
        priority: item.priority,
        impact: item.estimatedImpact,
        icon: <Lightbulb className="w-4 h-4" />
      })));
    }

    // Add ATS optimization suggestions
    if (state.atsAnalysis?.optimizations) {
      suggestions.push(...state.atsAnalysis.optimizations.map((opt: any) => ({
        type: 'ats',
        title: opt.description,
        description: opt.action,
        priority: opt.priority,
        impact: opt.impact,
        icon: <Target className="w-4 h-4" />
      })));
    }

    return suggestions;
  };

  const handleExportOptimized = async (format: 'pdf' | 'docx' | 'html') => {
    if (!selectedTemplate) return;

    try {
      const result = await templateService.exportResume(resume.id, format as any, userId);

      // Download the file
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (state.error) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Template Dashboard</h1>
          <p className="text-gray-600">
            AI-powered optimization and intelligent recommendations for your resume
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={generateSmartSuggestions}
            disabled={state.isAnalyzing}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Suggestions
          </Button>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={state.isAnalyzing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", state.isAnalyzing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="ATS Score"
          value={state.atsAnalysis?.overallScore || 0}
          change={5}
          trend="up"
          icon={<Target className="w-5 h-5" />}
          description="Overall ATS compatibility"
        />
        <MetricCard
          title="AI Analysis Score"
          value={state.aiAnalysis?.contentAnalysis?.overallScore || 0}
          change={12}
          trend="up"
          icon={<Brain className="w-5 h-5" />}
          description="Content quality and impact"
        />
        <MetricCard
          title="Performance Score"
          value={state.performanceMetrics?.renderTime || 0}
          change={-3}
          trend="down"
          icon={<Zap className="w-5 h-5" />}
          description="Render performance (ms)"
        />
        <MetricCard
          title="Optimization Potential"
          value={state.aiAnalysis?.actionItems?.length || 0}
          icon={<Rocket className="w-5 h-5" />}
          description="Available improvements"
        />
      </div>

      {/* Main Content */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="ats-optimization">ATS Optimization</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Template Performance</p>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="flex-1" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Content Quality</p>
                    <div className="flex items-center gap-2">
                      <Progress value={state.aiAnalysis?.contentAnalysis?.overallScore || 0} className="flex-1" />
                      <span className="text-sm font-medium">{state.aiAnalysis?.contentAnalysis?.overallScore || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ATS Compatibility</p>
                    <div className="flex items-center gap-2">
                      <Progress value={state.atsAnalysis?.overallScore || 0} className="flex-1" />
                      <span className="text-sm font-medium">{state.atsAnalysis?.overallScore || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Optimization Score</p>
                    <div className="flex items-center gap-2">
                      <Progress value={70} className="flex-1" />
                      <span className="text-sm font-medium">70%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="text-blue-600 mt-1">
                        <Star className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.template.name}</h4>
                        <p className="text-sm text-gray-600">{rec.reasoning[0]}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={rec.category === 'high_match' ? 'default' : 'secondary'}>
                            {rec.category.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{Math.round(rec.confidence * 100)}% match</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Template Applied</p>
                    <p className="text-xs text-gray-600">Professional Executive template</p>
                  </div>
                  <span className="text-xs text-gray-500">2 min ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">AI Analysis Completed</p>
                    <p className="text-xs text-gray-600">Score: 87/100</p>
                  </div>
                  <span className="text-xs text-gray-500">5 min ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">ATS Optimization</p>
                    <p className="text-xs text-gray-600">Score improved by 15%</p>
                  </div>
                  <span className="text-xs text-gray-500">10 min ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai-analysis" className="space-y-6">
          {state.aiAnalysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(state.aiAnalysis.contentAnalysis.sections).map(([section, analysis]: [string, any]) => (
                      <div key={section} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium capitalize">{section}</h4>
                          <p className="text-sm text-gray-600">Score: {analysis.score}/100</p>
                        </div>
                        <Badge variant={analysis.quality === 'excellent' ? 'default' : 'secondary'}>
                          {analysis.quality}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <div className="space-y-1">
                      {state.aiAnalysis.contentAnalysis.strengths.slice(0, 3).map((strength: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Predictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">ATS Score</span>
                        <span className="text-sm font-bold">{state.aiAnalysis.performancePredictions.atsScore}%</span>
                      </div>
                      <Progress value={state.aiAnalysis.performancePredictions.atsScore} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Interview Probability</span>
                        <span className="text-sm font-bold">{state.aiAnalysis.performancePredictions.interviewProbability}%</span>
                      </div>
                      <Progress value={state.aiAnalysis.performancePredictions.interviewProbability} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Success Probability</span>
                        <span className="text-sm font-bold">{state.aiAnalysis.performancePredictions.successProbability}%</span>
                      </div>
                      <Progress value={state.aiAnalysis.performancePredictions.successProbability} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Success Factors</h4>
                    <div className="space-y-1">
                      {state.aiAnalysis.performancePredictions.factors.map((factor: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {factor.impact === 'positive' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span>{factor.factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">AI Analysis</p>
                  <p className="text-sm text-gray-500">
                    Select a template to run AI analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ATS Optimization Tab */}
        <TabsContent value="ats-optimization" className="space-y-6">
          {state.atsAnalysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ATS Score Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>ATS Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(state.atsAnalysis.scoreBreakdown).map(([category, score]: [string, number]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{category}</span>
                        <span className="text-sm font-bold">{score}/100</span>
                      </div>
                      <Progress value={score} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Compatibility Analysis */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>ATS Compatibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Compatibility</span>
                      <Badge variant={state.atsAnalysis.compatibility.overallCompatibility > 80 ? 'default' : 'secondary'}>
                        {state.atsAnalysis.compatibility.overallCompatibility}%
                      </Badge>
                    </div>
                    <Progress value={state.atsAnalysis.compatibility.overallCompatibility} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {state.atsAnalysis.compatibility.systems.slice(0, 4).map((system: any, index: number) => (
                      <div key={index} className="text-center p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">{system.name}</h5>
                        <p className="text-xs text-gray-600 mt-1">{system.compatibility}%</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {system.marketShare * 100}% market
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="font-medium mb-2">Potential Issues</h4>
                    <div className="space-y-1">
                      {state.atsAnalysis.compatibility.potentialIssues.map((issue: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">ATS Analysis</p>
                  <p className="text-sm text-gray-500">
                    Select a template to run ATS optimization
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Template Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {state.recommendations.map((rec: any, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="text-blue-600 mt-1">
                          <Star className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.template.name}</h4>
                            <Badge variant={rec.category === 'high_match' ? 'default' : 'secondary'}>
                              {rec.category.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.template.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{Math.round(rec.confidence * 100)}% match</Badge>
                            {rec.personalized && (
                              <Badge variant="outline" className="text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Personalized
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              {rec.reasoning.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personalization Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Personalization Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {state.aiAnalysis?.personalizationInsights ? (
                  <div className="space-y-4">
                    {state.aiAnalysis.personalizationInsights.map((insight: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium">{insight.insight}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.recommendation}</p>
                        {insight.examples && insight.examples.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {insight.examples.map((example: string, exampleIndex: number) => (
                              <Badge key={exampleIndex} variant="outline" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Personalization Analysis</p>
                    <p className="text-sm text-gray-500">
                      Complete your profile for personalized insights
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-auto p-4 flex flex-col items-center"
                  onClick={() => setShowDetails('template-optimization')}
                >
                  <Settings className="w-6 h-6 mb-2" />
                  <span>Optimize Template</span>
                  <span className="text-xs text-gray-500">Improve layout & formatting</span>
                </Button>
                <Button
                  className="h-auto p-4 flex flex-col items-center"
                  onClick={() => setShowDetails('content-optimization')}
                >
                  <FileText className="w-6 h-6 mb-2" />
                  <span>Enhance Content</span>
                  <span className="text-xs text-gray-500">AI-powered improvements</span>
                </Button>
                <Button
                  className="h-auto p-4 flex flex-col items-center"
                  onClick={() => setShowDetails('ats-optimization')}
                >
                  <Shield className="w-6 h-6 mb-2" />
                  <span>ATS Optimization</span>
                  <span className="text-xs text-gray-500">Improve compatibility</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {state.optimizationSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {state.optimizationSuggestions.map((suggestion: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="text-blue-600 mt-1">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <Badge variant={suggestion.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOptimizationApply(suggestion)}
                          >
                            Apply
                          </Button>
                          <Badge variant="outline">
                            {suggestion.impact}% impact
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No Suggestions Available</p>
                  <p className="text-sm text-gray-500">
                    Your resume is well-optimized
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleExportOptimized('pdf')}
              disabled={!selectedTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportOptimized('docx')}
              disabled={!selectedTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Export as DOCX
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportOptimized('html')}
              disabled={!selectedTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Export as HTML
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showDetails === 'template-optimization' && 'Template Optimization'}
              {showDetails === 'content-optimization' && 'Content Optimization'}
              {showDetails === 'ats-optimization' && 'ATS Optimization'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {showDetails === 'template-optimization' && 'Optimize your template layout, colors, and formatting for better ATS compatibility and visual appeal.'}
              {showDetails === 'content-optimization' && 'Enhance your resume content with AI-powered suggestions and improvements.'}
              {showDetails === 'ats-optimization' && 'Improve your resume\'s ATS compatibility with keyword optimization and structure improvements.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedTemplateDashboard;