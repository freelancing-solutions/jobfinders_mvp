/**
 * ATS Optimization Panel component
 * Provides comprehensive ATS optimization analysis and recommendations
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  TrendingUp,
  FileText,
  BarChart3,
  Settings,
  Play,
  RefreshCw,
  Download,
  Info,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { useATSOptimization, useKeywordAnalysis, useJobKeywordMatcher } from '@/hooks/use-ats-optimization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ATSOptimizationPanelProps {
  template: any;
  customization: any;
  content: any;
  onOptimizationComplete?: (result: any) => void;
  className?: string;
}

export function ATSOptimizationPanel({
  template,
  customization,
  content,
  onOptimizationComplete,
  className = ''
}: ATSOptimizationPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [jobDescription, setJobDescription] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState(false);

  const {
    isOptimizing,
    optimizationResult,
    keywordAnalysis,
    quickScore,
    isValidating,
    validation,
    optimizeForATS,
    quickATSCheck,
    validateATSCompatibility,
    analyzeKeywords,
    quickKeywordMatch,
    extractJobKeywords,
    getATSSectionSuggestions,
    applyOptimizations
  } = useATSOptimization({
    template,
    customization,
    content,
    jobDescription,
    targetKeywords: targetKeywords ? targetKeywords.split(',').map(k => k.trim()) : undefined,
    industry,
    experienceLevel,
    onOptimizationComplete
  });

  const jobMatcher = useJobKeywordMatcher(jobDescription);
  const sectionSuggestions = getATSSectionSuggestions();

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleFullOptimization = useCallback(async () => {
    await optimizeForATS({
      strictMode: false,
      includeKeywords: true,
      includeSemantic: true
    });
  }, [optimizeForATS]);

  const handleKeywordAnalysis = useCallback(async () => {
    await analyzeKeywords();
  }, [analyzeKeywords]);

  const handleApplyOptimizations = useCallback(() => {
    if (optimizationResult) {
      applyOptimizations(optimizationResult);
    }
  }, [optimizationResult, applyOptimizations]);

  const handleJobDescriptionChange = useCallback((value: string) => {
    setJobDescription(value);
    if (value) {
      const keywords = extractJobKeywords(value);
      console.log('Extracted keywords:', keywords);
    }
  }, [extractJobKeywords]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  if (!template || !customization || !content) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-2" />
            <span>Please select a template and add content before optimizing for ATS</span>
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
              <Target className="h-5 w-5" />
              ATS Optimization
            </CardTitle>
            <CardDescription>
              Optimize your resume for Applicant Tracking Systems with intelligent analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {quickScore && (
              <Badge variant={getScoreBadgeVariant(quickScore.score)} className="text-sm">
                Score: {quickScore.score}/100
              </Badge>
            )}
            {validation && (
              <Badge variant={validation.compatible ? 'default' : 'destructive'}>
                {validation.compatible ? 'Compatible' : 'Issues Found'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  ATS Score Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quickScore && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Overall ATS Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(quickScore.score)}`}>
                        {quickScore.score}/100
                      </span>
                    </div>
                    <Progress value={quickScore.score} className="h-2" />

                    {quickScore.criticalIssues.length > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Critical Issues:</strong>
                            <ul className="list-disc list-inside">
                              {quickScore.criticalIssues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {quickScore.quickFixes.length > 0 && (
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Quick Fixes:</strong>
                            <ul className="list-disc list-inside">
                              {quickScore.quickFixes.map((fix, index) => (
                                <li key={index}>{fix}</li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={handleFullOptimization} disabled={isOptimizing}>
                        {isOptimizing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Full Optimization
                      </Button>
                      <Button variant="outline" onClick={quickATSCheck}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Score
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Targeting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Targeting</CardTitle>
                <CardDescription>
                  Provide job details for targeted optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => handleJobDescriptionChange(e.target.value)}
                    className="min-h-32 mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="keywords">Target Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="keyword1, keyword2, keyword3"
                      value={targetKeywords}
                      onChange={(e) => setTargetKeywords(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select value={experienceLevel} onValueChange={(value: any) => setExperienceLevel(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {jobMatcher.keywords && (
                  <div className="space-y-2">
                    <Label>Extracted Keywords</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(jobMatcher.keywords).map(([category, keywords]) => (
                        <div key={category} className="flex flex-wrap gap-1">
                          {keywords.slice(0, 5).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Keyword Analysis</CardTitle>
                  <Button onClick={handleKeywordAnalysis} disabled={!jobDescription}>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Keywords
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {keywordAnalysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Matched Keywords</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {keywordAnalysis.matchedKeywords.length}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Missing Keywords</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {keywordAnalysis.missingKeywords.length}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Overall Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {keywordAnalysis.overallScore}/100
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Matched Keywords */}
                    {keywordAnalysis.matchedKeywords.length > 0 && (
                      <Collapsible
                        open={expandedSections.matched}
                        onOpenChange={() => toggleSection('matched')}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            Matched Keywords ({keywordAnalysis.matchedKeywords.length})
                            {expandedSections.matched ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2">
                          {keywordAnalysis.matchedKeywords.map((match, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <span className="font-medium">{match.keyword}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({match.frequency} mentions)
                                </span>
                              </div>
                              <Badge variant={
                                match.importance === 'critical' ? 'destructive' :
                                match.importance === 'important' ? 'default' : 'secondary'
                              }>
                                {match.importance}
                              </Badge>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Missing Keywords */}
                    {keywordAnalysis.missingKeywords.length > 0 && (
                      <Collapsible
                        open={expandedSections.missing}
                        onOpenChange={() => toggleSection('missing')}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            Missing Keywords ({keywordAnalysis.missingKeywords.length})
                            {expandedSections.missing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2">
                          {keywordAnalysis.missingKeywords.map((gap, index) => (
                            <div key={index} className="p-2 border rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{gap.keyword}</span>
                                <Badge variant={
                                  gap.importance === 'critical' ? 'destructive' :
                                  gap.importance === 'important' ? 'default' : 'secondary'
                                }>
                                  {gap.importance}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{gap.reason}</p>
                              <p className="text-sm text-blue-600 mt-1">
                                Suggestion: {gap.suggestedContext}
                              </p>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Add a job description and click "Analyze Keywords" to see detailed analysis
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Keyword Suggestions */}
            {keywordAnalysis?.keywordSuggestions && keywordAnalysis.keywordSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Keyword Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {keywordAnalysis.keywordSuggestions.slice(0, 10).map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{suggestion.keyword}</span>
                          <Badge variant="outline" className="ml-2">
                            {suggestion.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Relevance</div>
                          <div className="font-medium">{Math.round(suggestion.relevance * 100)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Format Tab */}
          <TabsContent value="format" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Format Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                {validation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">ATS Compatibility</span>
                      <Badge variant={validation.compatible ? 'default' : 'destructive'}>
                        {validation.compatible ? 'Compatible' : 'Issues Found'}
                      </Badge>
                    </div>
                    <Progress value={validation.score} className="h-2" />

                    {validation.blockingIssues.length > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Blocking Issues:</strong>
                            <ul className="list-disc list-inside">
                              {validation.blockingIssues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validation.warnings.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Warnings:</strong>
                            <ul className="list-disc list-inside">
                              {validation.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button variant="outline" onClick={validateATSCompatibility} disabled={isValidating}>
                      {isValidating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Revalidate Format
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button onClick={validateATSCompatibility} disabled={isValidating}>
                      Check Format Compatibility
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Section Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Current Sections</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {sectionSuggestions.current.map((section, index) => (
                        <Badge key={index} variant="default">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {sectionSuggestions.missing.length > 0 && (
                    <div>
                      <Label>Recommended Sections to Add</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sectionSuggestions.missing.map((section, index) => (
                          <Badge key={index} variant="outline">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Improvement Suggestions</Label>
                    <div className="space-y-2 mt-2">
                      {sectionSuggestions.improvements.map((improvement, index) => (
                        <div key={index} className="p-2 border rounded">
                          <div className="font-medium">{improvement.section}</div>
                          <p className="text-sm text-muted-foreground">{improvement.suggestion}</p>
                          <p className="text-sm text-blue-600">{improvement.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                {optimizationResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Overall Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{optimizationResult.score}/100</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">ATS Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{optimizationResult.atsScore}/100</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Readability</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{optimizationResult.readabilityScore}/100</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Keywords</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{optimizationResult.keywordScore}/100</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Issues */}
                    {optimizationResult.issues.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Issues Found</h3>
                        <div className="space-y-2">
                          {optimizationResult.issues.map((issue, index) => (
                            <div key={index} className={`p-3 border rounded ${
                              issue.type === 'critical' ? 'border-red-200 bg-red-50' :
                              issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                              'border-blue-200 bg-blue-50'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{issue.message}</span>
                                <Badge variant={
                                  issue.type === 'critical' ? 'destructive' :
                                  issue.type === 'warning' ? 'secondary' : 'outline'
                                }>
                                  {issue.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{issue.fix}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs">Impact:</span>
                                <div className="flex">
                                  {[...Array(10)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full mr-1 ${
                                        i < issue.impact ? 'bg-red-500' : 'bg-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {optimizationResult.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                        <div className="space-y-3">
                          {optimizationResult.recommendations.map((rec, index) => (
                            <div key={index} className="p-3 border rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{rec.title}</span>
                                <Badge variant={
                                  rec.priority === 'high' ? 'destructive' :
                                  rec.priority === 'medium' ? 'default' : 'secondary'
                                }>
                                  {rec.priority} priority
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                              <p className="text-sm text-blue-600">{rec.implementation}</p>
                              <div className="text-xs text-gray-500 mt-1">
                                Estimated impact: +{rec.impact} points
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={handleApplyOptimizations}>
                      <Zap className="h-4 w-4 mr-2" />
                      Apply Optimizations
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button onClick={handleFullOptimization} disabled={isOptimizing}>
                      {isOptimizing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Analyze Content
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {optimizationResult ? (
                  <div className="space-y-6">
                    {/* Format Analysis */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Format Analysis</h3>
                      <div className={`p-4 border rounded ${
                        optimizationResult.formatAnalysis.compatible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {optimizationResult.formatAnalysis.compatible ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {optimizationResult.formatAnalysis.compatible ? 'Format is ATS-Compatible' : 'Format Issues Detected'}
                          </span>
                        </div>

                        {optimizationResult.formatAnalysis.issues.length > 0 && (
                          <div className="mb-2">
                            <strong>Issues:</strong>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {optimizationResult.formatAnalysis.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {optimizationResult.formatAnalysis.fixes.length > 0 && (
                          <div>
                            <strong>Fixes:</strong>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {optimizationResult.formatAnalysis.fixes.map((fix, index) => (
                                <li key={index}>{fix}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keyword Analysis */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Keyword Analysis</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Found Keywords ({optimizationResult.keywordAnalysis.found.length})</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {optimizationResult.keywordAnalysis.found.map((keyword, index) => (
                              <Badge key={index} variant="default">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {optimizationResult.keywordAnalysis.missing.length > 0 && (
                          <div>
                            <Label>Missing Keywords ({optimizationResult.keywordAnalysis.missing.length})</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {optimizationResult.keywordAnalysis.missing.map((keyword, index) => (
                                <Badge key={index} variant="outline">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {optimizationResult.keywordAnalysis.suggestions.length > 0 && (
                          <div>
                            <Label>Suggestions</Label>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {optimizationResult.keywordAnalysis.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Semantic Analysis */}
                    {optimizationResult.semanticAnalysis && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Semantic Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Semantic Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {optimizationResult.semanticAnalysis.semanticScore}/100
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Theme Alignment</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-lg font-medium">
                                {optimizationResult.semanticAnalysis.themeAlignment.primaryTheme}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {optimizationResult.semanticAnalysis.themeAlignment.alignmentScore}% alignment
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run a full optimization to see detailed analysis
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}