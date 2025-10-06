'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  BookOpen,
  Grammar,
  Target,
  Zap,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Suggestion } from '@/types/resume';

interface LiveSuggestionsProps {
  suggestions: Suggestion[];
  contextualSuggestions: Suggestion[];
  grammarErrors: Array<{
    type: 'grammar' | 'spelling' | 'punctuation';
    message: string;
    position: number;
    length: number;
    suggestion: string;
  }>;
  grammarScore: number;
  loading?: boolean;
  onAcceptSuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onDismissContextual: (suggestionId: string) => void;
  onApplyGrammarCorrection: (correctedText: string) => void;
  currentField?: string;
}

const SuggestionItem: React.FC<{
  suggestion: Suggestion;
  onAccept: () => void;
  onReject: () => void;
  isContextual?: boolean;
}> = ({ suggestion, onAccept, onReject, isContextual }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ats': return <Target className="h-4 w-4" />;
      case 'content': return <BookOpen className="h-4 w-4" />;
      case 'formatting': return <Info className="h-4 w-4" />;
      case 'keywords': return <TrendingUp className="h-4 w-4" />;
      case 'impact': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn(
      'mb-3 transition-all duration-200 hover:shadow-md',
      isContextual && 'border-l-4 border-l-blue-500'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            {getCategoryIcon(suggestion.category)}
            <CardTitle className="text-sm font-medium">{suggestion.title}</CardTitle>
            <Badge className={getPriorityColor(suggestion.priority)}>
              {suggestion.priority}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription className="text-xs">
          {suggestion.section} {suggestion.field && `• ${suggestion.field}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>

        {isExpanded && (
          <div className="space-y-3 mb-4">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Why this helps:</h4>
              <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
            </div>

            {suggestion.currentValue && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Current:</h4>
                <p className="text-xs bg-gray-50 p-2 rounded border">{suggestion.currentValue}</p>
              </div>
            )}

            {suggestion.suggestedValue && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Suggested:</h4>
                <p className="text-xs bg-green-50 p-2 rounded border border-green-200">{suggestion.suggestedValue}</p>
              </div>
            )}

            {suggestion.examples && suggestion.examples.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Examples:</h4>
                <ul className="text-xs text-gray-600 list-disc list-inside">
                  {suggestion.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Impact on score:</span>
              <Progress value={suggestion.impact} className="flex-1 h-2" />
              <span className="text-xs font-medium">{suggestion.impact}%</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const LiveSuggestions: React.FC<LiveSuggestionsProps> = ({
  suggestions,
  contextualSuggestions,
  grammarErrors,
  grammarScore,
  loading = false,
  onAcceptSuggestion,
  onRejectSuggestion,
  onDismissContextual,
  onApplyGrammarCorrection,
  currentField,
}) => {
  const [activeTab, setActiveTab] = useState('suggestions');

  const criticalSuggestions = suggestions.filter(s => s.priority === 'critical');
  const highSuggestions = suggestions.filter(s => s.priority === 'high');
  const mediumSuggestions = suggestions.filter(s => s.priority === 'medium');
  const lowSuggestions = suggestions.filter(s => s.priority === 'low');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSuggestions = suggestions.length + contextualSuggestions.length + grammarErrors.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Suggestions
            {totalSuggestions > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalSuggestions}
              </Badge>
            )}
          </CardTitle>
          {currentField && (
            <Badge variant="outline" className="text-xs">
              {currentField}
            </Badge>
          )}
        </div>
        <CardDescription>
          Real-time AI-powered suggestions to improve your resume
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions" className="text-xs">
              Improvements
              {suggestions.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contextual" className="text-xs">
              Contextual
              {contextualSuggestions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {contextualSuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="grammar" className="text-xs">
              Grammar
              {grammarErrors.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {grammarErrors.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4">
            <ScrollArea className="h-[400px]">
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Great job! No suggestions at this time.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Keep editing to get personalized recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {criticalSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Critical ({criticalSuggestions.length})
                      </h4>
                      {criticalSuggestions.map(suggestion => (
                        <SuggestionItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          onAccept={() => onAcceptSuggestion(suggestion.id)}
                          onReject={() => onRejectSuggestion(suggestion.id)}
                        />
                      ))}
                    </div>
                  )}

                  {highSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-orange-800 mb-2">High Priority ({highSuggestions.length})</h4>
                      {highSuggestions.map(suggestion => (
                        <SuggestionItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          onAccept={() => onAcceptSuggestion(suggestion.id)}
                          onReject={() => onRejectSuggestion(suggestion.id)}
                        />
                      ))}
                    </div>
                  )}

                  {mediumSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">Medium Priority ({mediumSuggestions.length})</h4>
                      {mediumSuggestions.map(suggestion => (
                        <SuggestionItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          onAccept={() => onAcceptSuggestion(suggestion.id)}
                          onReject={() => onRejectSuggestion(suggestion.id)}
                        />
                      ))}
                    </div>
                  )}

                  {lowSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Low Priority ({lowSuggestions.length})</h4>
                      {lowSuggestions.map(suggestion => (
                        <SuggestionItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          onAccept={() => onAcceptSuggestion(suggestion.id)}
                          onReject={() => onRejectSuggestion(suggestion.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="contextual" className="mt-4">
            <ScrollArea className="h-[400px]">
              {contextualSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Start editing to get contextual suggestions.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Suggestions will appear based on the field you're editing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contextualSuggestions.map(suggestion => (
                    <SuggestionItem
                      key={suggestion.id}
                      suggestion={suggestion}
                      onAccept={() => onAcceptSuggestion(suggestion.id)}
                      onReject={() => onDismissContextual(suggestion.id)}
                      isContextual
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="grammar" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grammar className="h-4 w-4" />
                  <span className="text-sm font-medium">Grammar Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={grammarScore} className="w-20 h-2" />
                  <span className="text-sm font-medium">{grammarScore}%</span>
                </div>
              </div>

              {grammarErrors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">No grammar issues found!</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {grammarErrors.map((error, index) => (
                      <Alert key={index} className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-sm">
                          <span className="font-medium capitalize">{error.type}:</span> {error.message}
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onApplyGrammarCorrection(error.suggestion)}
                              className="text-xs"
                            >
                              Apply Correction
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};