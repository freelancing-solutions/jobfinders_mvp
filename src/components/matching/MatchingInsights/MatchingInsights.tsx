import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  BookOpen,
  Users,
  Award,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatchInsight {
  type: 'strength' | 'weakness' | 'recommendation';
  title: string;
  description: string;
  actionable: boolean;
}

interface MatchingInsightsProps {
  matchScore: number;
  confidence: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    details: string;
  }>;
  insights: MatchInsight[];
  recommendations: string[];
  onApplyRecommendation?: (recommendation: string) => void;
}

export function MatchingInsights({
  matchScore,
  confidence,
  factors,
  insights,
  recommendations,
  onApplyRecommendation
}: MatchingInsightsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  const handleApplyRecommendation = (recommendation: string) => {
    setAppliedRecommendations(prev => new Set(prev).add(recommendation));

    toast({
      title: "Recommendation Applied",
      description: "Your profile has been updated based on this recommendation.",
    });

    if (onApplyRecommendation) {
      onApplyRecommendation(recommendation);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 80) return { level: 'High', color: 'text-green-600' };
    if (confidence >= 60) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-red-600' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Match Analysis</span>
            <Badge variant="outline" className={confidenceLevel.color}>
              {confidenceLevel.level} Confidence
            </Badge>
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your compatibility with this position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(matchScore)}`}>
                {matchScore}%
              </div>
              <div className="text-sm text-muted-foreground">Match Score</div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress
                value={matchScore}
                className="w-32 h-2"
              />
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(matchScore)} ${getScoreColor(matchScore)}`}>
                {matchScore >= 80 ? 'Excellent' : matchScore >= 60 ? 'Good' : 'Needs Work'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{factors.length}</div>
                <div className="text-xs text-muted-foreground">Factors Analyzed</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{recommendations.length}</div>
                <div className="text-xs text-muted-foreground">Recommendations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Match Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium">{factor.name}</div>
                      <div className="text-sm text-muted-foreground">{factor.details}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Weight: {(factor.weight * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={factor.score * 100} className="w-20 h-2" />
                      <span className={`text-sm font-medium ${getScoreColor(factor.score * 100)}`}>
                        {(factor.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Factor Analysis</CardTitle>
              <CardDescription>
                Deep dive into each matching factor and how it was calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {factors.map((factor, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{factor.name}</h4>
                    <Badge variant={factor.score >= 0.7 ? 'default' : factor.score >= 0.5 ? 'secondary' : 'destructive'}>
                      {(factor.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{factor.details}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Contribution to Score</span>
                      <span className="font-medium">{((factor.score * factor.weight) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={factor.score * factor.weight * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      insight.type === 'strength' ? 'bg-green-100' :
                      insight.type === 'weakness' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {insight.type === 'strength' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {insight.type === 'weakness' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {insight.type === 'recommendation' && <Lightbulb className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      {insight.actionable && (
                        <Badge variant="outline" className="mt-2">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {insights.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No specific insights available for this match.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Improvement Recommendations
              </CardTitle>
              <CardDescription>
                Actionable suggestions to improve your match score and application success
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((recommendation, index) => {
                const isApplied = appliedRecommendations.has(recommendation);
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isApplied ? 'bg-green-50 border-green-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-1 rounded-full ${
                        isApplied ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {isApplied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${isApplied ? 'text-green-700 line-through' : ''}`}>
                          {recommendation}
                        </p>
                      </div>
                    </div>
                    {!isApplied && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyRecommendation(recommendation)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                );
              })}

              {recommendations.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Great job! Your profile is well-optimized for this position.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}