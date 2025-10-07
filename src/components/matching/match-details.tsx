'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreBreakdown, MatchExplanation } from '@/types/matching';
import { Progress as TrendingUp, Star, AlertCircle, CheckCircle, Lightbulb, Target, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  matchScore: number;
  matchDetails: ScoreBreakdown;
  explanation: MatchExplanation;
  recommendations: string[];
  matchConfidence: number;
  candidateInfo?: {
    name: string;
    avatar?: string;
  };
  jobInfo?: {
    title: string;
    company: string;
  };
}

export function MatchDetails({
  isOpen,
  onClose,
  matchScore,
  matchDetails,
  explanation,
  recommendations,
  matchConfidence,
  candidateInfo,
  jobInfo
}: MatchDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <Target className="w-5 h-5 text-red-500" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getBreakdownIcon = (field: string) => {
    switch (field) {
      case 'skillsMatch':
        return <Award className="w-4 h-4" />;
      case 'experienceMatch':
        return <Users className="w-4 h-4" />;
      case 'educationMatch':
        return <GraduationCap className="w-4 h-4" />;
      case 'locationMatch':
        return <MapPin className="w-4 h-4" />;
      case 'salaryMatch':
        return <TrendingUp className="w-4 h-4" />;
      case 'preferencesMatch':
        return <Star className="w-4 h-4" />;
      case 'culturalFit':
        return <Users className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getBreakdownLabel = (field: string) => {
    switch (field) {
      case 'skillsMatch':
        return 'Skills';
      case 'experienceMatch':
        return 'Experience';
      case 'educationMatch':
        return 'Education';
      case 'locationMatch':
        return 'Location';
      case 'salaryMatch':
        return 'Compensation';
      case 'preferencesMatch':
        return 'Preferences';
      case 'culturalFit':
        return 'Cultural Fit';
      default:
        return field;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getScoreIcon(matchScore)}
              <span className="text-2xl font-bold">{matchScore}%</span>
            </div>
            <Badge className={getScoreColor(matchScore)}>
              {matchScore >= 80 ? 'Excellent Match' : matchScore >= 60 ? 'Good Match' : 'Fair Match'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {candidateInfo && jobInfo && (
              <span>
                Match: {candidateInfo.name} → {jobInfo.title} at {jobInfo.company}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confidence:</span>
            <Badge className={getConfidenceColor(matchConfidence)}>
              {Math.round(matchConfidence * 100)}%
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-6">
              {/* Overall Score Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Match Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">Overall Score</h4>
                        <span className={cn("text-xl font-bold", getScoreColor(matchScore))}>
                          {matchScore}%
                        </span>
                      </div>
                      <Progress value={matchScore} className="h-3" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">Confidence Level</h4>
                        <Badge className={getConfidenceColor(matchConfidence)}>
                          {Math.round(matchConfidence * 100)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Algorithm confidence in this match
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {matchDetails?.skillsMatch || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Skills Match</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {matchDetails?.experienceMatch || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Experience</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {matchDetails?.locationMatch || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Location</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {matchDetails?.salaryMatch || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Compensation</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Strengths */}
              {explanation?.strengths && explanation.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-500" />
                      Top Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {explanation.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Areas for Improvement */}
              {explanation?.weaknesses && explanation.weaknesses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-500" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {explanation.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Detailed Score Breakdown</h3>

              {Object.entries(matchDetails || {}).map(([field, value]) => (
                <Card key={field}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getBreakdownIcon(field)}
                        <h4 className="font-medium">
                          {getBreakdownLabel(field)}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{value}%</span>
                        <Progress value={value} className="flex-1 h-2" />
                      </div>
                    </div>

                    {/* Add context for each score component */}
                    {field === 'skillsMatch' && (
                      <div className="text-sm text-gray-600 mt-2">
                        Overlap between candidate skills and job requirements. Higher scores indicate better skill alignment.
                      </div>
                    )}
                    {field === 'experienceMatch' && (
                      <div className="text-sm text-gray-600 mt-2">
                        Alignment of experience level and duration with job requirements.
                      </div>
                    )}
                    {field === 'educationMatch' && (
                      <div className="text-sm text-gray-600 mt-2">
                        Relevance of educational background and qualifications for the position.
                      </div>
                    )}
                    {field === 'locationMatch' && (
                      <div className="text-sm text-gray-600 mt-2">
                        Geographic compatibility considering location preferences and remote work options.
                      </div>
                    )}
                    {field === 'salaryMatch' && (
                      <div className="text-sm text-gray-600 mt-2">
                        Alignment between salary expectations and compensation offered.
                      </div>
                    )}
                    {field === 'preferencesMatch' && (
                      <div className="text-sm text-gray-600 mt-2">
                        Match with work style preferences and company culture fit.
                      </div>
                    )}
                    {field === 'culturalFit' && (
                      <div className="text-sm text-gray-600 mt-2">
                        Alignment with company culture, values, and work environment.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="explanation" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-6 p-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Detailed Explanation
                  </h3>

                  <Card>
                    <CardHeader>
                      <CardTitle>Why This Match Works</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {explanation?.strengths && explanation.strengths.length > 0 ? (
                        <ul className="space-y-2">
                          {explanation.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No specific strengths identified for this match.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Potential Concerns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {explanation?.weaknesses && explanation.weaknesses.length > 0 ? (
                        <ul className="space-y-2">
                          {explanation.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No significant concerns identified for this match.</p>
                      )}
                    </CardContent>
                  </Card>

                  {explanation?.recommendations && explanation.recommendations.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {explanation.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                Improvement Recommendations
              </h3>

              <Card>
                <CardHeader>
                  <CardTitle>For the Candidate</CardTitle>
                </CardHeader>
                <CardContent>
                  {explanation?.improvementSuggestions && explanation.improvementSuggestions.length > 0 ? (
                    <ul className="space-y-2">
                      {explanation.improvementSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No specific improvement recommendations available.</p>
                  )}
                </CardContent>
              </Card>

              {explanation?.skillGaps && explanation.skillGaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Development Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-medium mb-2">Consider Developing:</h4>
                    <div className="flex flex-wrap gap-2">
                      {explanation.skillGaps.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Developing these skills could significantly improve match quality for similar positions.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* General Recommendations */}
              {recommendations && recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>General Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Share Match
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}