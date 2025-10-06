/**
 * Analysis Dashboard Component
 *
 * Displays comprehensive ATS analysis results, improvement suggestions,
 and resume optimization insights with interactive visualizations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Target,
  BarChart3,
  PieChart,
  FileText,
  Zap,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Download,
  Share,
  RefreshCw,
  Star,
  Eye,
  Award,
  BookOpen
} from 'lucide-react';
import { Resume, ResumeAnalysis, KeywordMatch, SkillGap, ImprovementSuggestion } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AnalysisDashboardProps {
  resume: Resume;
  analysis: ResumeAnalysis;
  onRefresh?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  loading?: boolean;
  className?: string;
}

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore: number;
  icon: React.ReactNode;
  color: string;
  description: string;
  trend?: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  score,
  maxScore,
  icon,
  color,
  description,
  trend
}) => {
  const percentage = (score / maxScore) * 100;
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg", color)}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center space-x-1 text-sm",
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"
            )}>
              {trend > 0 && <TrendingUp className="w-4 h-4" />}
              {trend < 0 && <TrendingUp className="w-4 h-4 rotate-180" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{score}</span>
            <span className="text-sm text-gray-500">/ {maxScore}</span>
          </div>
          <Progress
            value={percentage}
            className="h-2"
            indicatorClassName={getProgressColor(percentage)}
          />
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-medium", getColorClass(percentage))}>
              {percentage.toFixed(0)}%
            </span>
            <span className="text-xs text-gray-500">
              {percentage >= 80 ? 'Excellent' :
               percentage >= 60 ? 'Good' :
               percentage >= 40 ? 'Fair' : 'Needs Improvement'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SuggestionCardProps {
  suggestion: ImprovementSuggestion;
  onApply?: (suggestion: ImprovementSuggestion) => void;
  onDismiss?: (suggestion: ImprovementSuggestion) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply(suggestion);
      setIsApplied(true);
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isApplied && "bg-green-50 border-green-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={cn("p-2 rounded-lg border", getPriorityColor(suggestion.priority))}>
              {getPriorityIcon(suggestion.priority)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{suggestion.suggestion}</h4>
              <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
              {suggestion.example && (
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      {isExpanded ? (
                        <>
                          Hide Example
                          <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          View Example
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 p-3 bg-gray-50 rounded border">
                      <p className="text-sm text-gray-700 italic">
                        Example: {suggestion.example}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
              {suggestion.priority}
            </Badge>
            <Badge variant="outline">
              {suggestion.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {(!isApplied && (onApply || onDismiss)) && (
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            {onApply && (
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Suggestion
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDismiss(suggestion)}
              >
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      )}
      {isApplied && (
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Suggestion applied</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

interface KeywordAnalysisProps {
  keywordMatches: KeywordMatch[];
  title: string;
  description?: string;
}

const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({
  keywordMatches,
  title,
  description
}) {
  const [showAll, setShowAll] = useState(false);
  const displayedKeywords = showAll ? keywordMatches : keywordMatches.slice(0, 5);

  const getMatchColor = (found: boolean) => {
    return found ? 'text-green-600' : 'text-red-600';
  };

  const getMatchIcon = (found: boolean) => {
    return found ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const foundCount = keywordMatches.filter(k => k.found).length;
  const totalCount = keywordMatches.length;
  const matchPercentage = totalCount > 0 ? (foundCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>{title}</span>
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{foundCount}/{totalCount}</div>
            <div className="text-sm text-gray-600">Keywords Found</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Match Rate</span>
            <span className={cn(
              "text-sm font-bold",
              matchPercentage >= 80 ? "text-green-600" :
              matchPercentage >= 60 ? "text-yellow-600" : "text-red-600"
            )}>
              {matchPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={matchPercentage}
            className="h-2"
            indicatorClassName={
              matchPercentage >= 80 ? "bg-green-500" :
              matchPercentage >= 60 ? "bg-yellow-500" : "bg-red-500"
            }
          />

          <div className="space-y-3">
            {displayedKeywords.map((keyword, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className={getMatchColor(keyword.found)}>
                    {getMatchIcon(keyword.found)}
                  </div>
                  <div>
                    <span className="font-medium">{keyword.keyword}</span>
                    {keyword.count > 1 && (
                      <span className="text-sm text-gray-500 ml-2">({keyword.count} times)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getImportanceColor(keyword.importance)}>
                    {keyword.importance}
                  </Badge>
                  {keyword.found && (
                    <span className="text-xs text-green-600">Found</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {keywordMatches.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? (
                <>Show Less <ChevronUp className="w-4 h-4 ml-2" /></>
              ) : (
                <>Show All {keywordMatches.length} Keywords <ChevronDown className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  resume,
  analysis,
  onRefresh,
  onExport,
  onShare,
  loading = false,
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const toggleSuggestion = (suggestionId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(suggestionId)) {
      newExpanded.delete(suggestionId);
    } else {
      newExpanded.add(suggestionId);
    }
    setExpandedSuggestions(newExpanded);
  };

  const applySuggestion = (suggestion: ImprovementSuggestion) => {
    const suggestionId = `${suggestion.category}-${suggestion.suggestion}`;
    const newApplied = new Set(appliedSuggestions);
    newApplied.add(suggestionId);
    setAppliedSuggestions(newApplied);
  };

  const dismissSuggestion = (suggestion: ImprovementSuggestion) => {
    const suggestionId = `${suggestion.category}-${suggestion.suggestion}`;
    const newApplied = new Set(appliedSuggestions);
    newApplied.delete(suggestionId);
    setAppliedSuggestions(newApplied);
  };

  const getScoreCategory = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 40) return { label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const overallScore = analysis.atsScore;
  const scoreCategory = getScoreCategory(overallScore);

  const highPrioritySuggestions = analysis.improvementSuggestions.filter(s => s.priority === 'high');
  const mediumPrioritySuggestions = analysis.improvementSuggestions.filter(s => s.priority === 'medium');
  const lowPrioritySuggestions = analysis.improvementSuggestions.filter(s => s.priority === 'low');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive ATS analysis and optimization insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Overall ATS Score</h2>
              <div className="flex items-center space-x-4">
                <div className="text-5xl font-bold">{overallScore}</div>
                <div className="text-lg">/ 100</div>
              </div>
              <div className="mt-2">
                <Badge className={cn("text-white border-white", scoreCategory.bgColor)}>
                  {scoreCategory.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg mb-2">Your resume is</div>
              <div className="text-3xl font-bold">
                {overallScore >= 80 ? 'Ready to apply!' :
                 overallScore >= 60 ? 'Almost there!' :
                 overallScore >= 40 ? 'Needs work' : 'Major improvements needed'}
              </div>
              <div className="text-sm mt-2 opacity-90">
                {overallScore >= 80 ? 'Top 10% of applicants' :
                 overallScore >= 60 ? 'Top 25% of applicants' :
                 overallScore >= 40 ? 'Average score' : 'Below average'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ScoreCard
                title="ATS Score"
                score={overallScore}
                maxScore={100}
                icon={<BarChart3 className="w-5 h-5 text-white" />}
                color="bg-blue-500"
                description="Overall compatibility"
                trend={5} // Example trend
              />
              <ScoreCard
                title="Keyword Match"
                score={analysis.keywordMatches.filter(k => k.found).length}
                maxScore={analysis.keywordMatches.length}
                icon={<Target className="w-5 h-5 text-white" />}
                color="bg-green-500"
                description="Keywords found"
              />
              <ScoreCard
                title="Readability"
                score={85}
                maxScore={100}
                icon={<FileText className="w-5 h-5 text-white" />}
                color="bg-purple-500"
                description="Content clarity"
              />
              <ScoreCard
                title="Completeness"
                score={92}
                maxScore={100}
                icon={<BookOpen className="w-5 h-5 text-white" />}
                color="bg-orange-500"
                description="Section coverage"
              />
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>Areas for Improvement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keywords">
            <div className="space-y-6">
              <KeywordAnalysis
                keywordMatches={analysis.keywordMatches.filter(k => k.importance === 'high')}
                title="High Priority Keywords"
                description="These keywords are most important for your target role"
              />

              <KeywordAnalysis
                keywordMatches={analysis.keywordMatches.filter(k => k.importance === 'medium')}
                title="Medium Priority Keywords"
                description="These keywords add value to your resume"
              />

              <KeywordAnalysis
                keywordMatches={analysis.keywordMatches.filter(k => k.importance === 'low')}
                title="Additional Keywords"
                description="These keywords can enhance your resume"
              />
            </div>
          </TabsContent>

          <TabsContent value="suggestions">
            <div className="space-y-6">
              {highPrioritySuggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>High Priority Improvements</span>
                    <Badge variant="destructive">{highPrioritySuggestions.length}</Badge>
                  </h3>
                  <div className="space-y-4">
                    {highPrioritySuggestions.map((suggestion, index) => (
                      <SuggestionCard
                        key={`high-${index}`}
                        suggestion={suggestion}
                        onApply={applySuggestion}
                        onDismiss={dismissSuggestion}
                      />
                    ))}
                  </div>
                </div>
              )}

              {mediumPrioritySuggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span>Medium Priority Improvements</span>
                    <Badge variant="secondary">{mediumPrioritySuggestions.length}</Badge>
                  </h3>
                  <div className="space-y-4">
                    {mediumPrioritySuggestions.map((suggestion, index) => (
                      <SuggestionCard
                        key={`medium-${index}`}
                        suggestion={suggestion}
                        onApply={applySuggestion}
                        onDismiss={dismissSuggestion}
                      />
                    ))}
                  </div>
                </div>
              )}

              {lowPrioritySuggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <span>Additional Enhancements</span>
                    <Badge variant="outline">{lowPrioritySuggestions.length}</Badge>
                  </h3>
                  <div className="space-y-4">
                    {lowPrioritySuggestions.map((suggestion, index) => (
                      <SuggestionCard
                        key={`low-${index}`}
                        suggestion={suggestion}
                        onApply={applySuggestion}
                        onDismiss={dismissSuggestion}
                      />
                    ))}
                  </div>
                </div>
              )}

              {analysis.improvementSuggestions.length === 0 && (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    Great job! Your resume is well-optimized. No specific improvement suggestions at this time.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Analysis Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Analysis Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Analyzed:</span>
                          <p className="font-medium">{analysis.analyzedAt.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Analysis ID:</span>
                          <p className="font-medium">{analysis.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Job Description:</span>
                          <p className="font-medium">{analysis.jobDescription ? 'Provided' : 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Resume ID:</span>
                          <p className="font-medium">{analysis.resumeId}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Skill Gaps Analysis</h4>
                      {analysis.skillGaps.length > 0 ? (
                        <div className="space-y-2">
                          {analysis.skillGaps.map((gap, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  gap.foundInResume ? "bg-green-500" : "bg-red-500"
                                )} />
                                <div>
                                  <span className="font-medium">{gap.skill}</span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    {gap.importance}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={gap.foundInResume ? "default" : "destructive"}>
                                {gap.foundInResume ? 'Found' : 'Missing'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">No skill gaps identified</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AnalysisDashboard;