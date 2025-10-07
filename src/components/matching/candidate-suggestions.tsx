'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CandidateRecommendation, MatchFilters, MatchSortOptions } from '@/types/matching';
import { useCandidateSuggestions } from '@/hooks/use-candidate-suggestions';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Briefcase, GraduationCap, Star, Filter, RefreshCw, Mail, Phone, Eye, Save, UserCheck } from 'lucide-react';

interface CandidateSuggestionsProps {
  jobId: string;
  className?: string;
}

export function CandidateSuggestions({ jobId, className }: CandidateSuggestionsProps) {
  const [filters, setFilters] = useState<MatchFilters>({});
  const [sort, setSort] = useState<MatchSortOptions>({ field: 'matchScore', order: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  const {
    suggestions,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
    total,
    refreshing
  } = useCandidateSuggestions(jobId, { filters, sort });

  const handleSaveCandidate = async (candidateId: string) => {
    try {
      const response = await fetch('/api/employers/candidates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      });

      if (response.ok) {
        console.log('Candidate saved successfully');
      }
    } catch (error) {
      console.error('Failed to save candidate:', error);
    }
  };

  const handleContactCandidate = async (candidateId: string) => {
    try {
      const response = await fetch('/api/employers/candidates/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      });

      if (response.ok) {
        console.log('Contact request sent successfully');
      }
    } catch (error) {
      console.error('Failed to send contact request:', error);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'lead':
      case 'principal':
        return 'bg-purple-100 text-purple-800';
      case 'senior':
        return 'bg-blue-100 text-blue-800';
      case 'mid':
        return 'bg-green-100 text-green-800';
      case 'junior':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Failed to load candidate suggestions</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Candidate Suggestions</CardTitle>
              <CardDescription>
                Qualified candidates for this position ({total} total)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Filter Candidates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Enter city or 'remote'"
                    value={filters.location || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select
                    value={filters.experienceLevel || ''}
                    onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, experienceLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Required Skills</label>
                  <Input
                    placeholder="e.g., JavaScript, React, Node.js"
                    value={filters.skills?.join(', ') || ''}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))
                    }
                  />
                </div>

                {/* Remote Work */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={filters.remote || false}
                    onCheckedChange={(checked) =>
                      setFilters(prev => ({ ...prev, remote: checked as boolean }))
                    }
                  />
                  <label htmlFor="remote" className="text-sm font-medium">
                    Remote Candidates Only
                  </label>
                </div>

                {/* Minimum Match Score */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Minimum Match Score: {filters.minScore || 50}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minScore || 50}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))
                    }
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {filters.minScore || 50}% minimum match score
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select
                    value={`${sort.field}-${sort.order}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-');
                      setSort({ field: field as any, order: order as any });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matchScore-desc">Best Match</SelectItem>
                      <SelectItem value="matchScore-asc">Worst Match</SelectItem>
                      <SelectItem value="matchConfidence-desc">Highest Confidence</SelectItem>
                      <SelectItem value="lastMatched-desc">Recently Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Sort and View Options */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {suggestions.length} of {total} candidates
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tabs defaultValue="grid" className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Loading State */}
          {loading && suggestions.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Finding qualified candidates...</p>
              </div>
            </div>
          )}

          {/* Suggestions Grid/List */}
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <CandidateSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onSave={() => handleSaveCandidate(suggestion.candidate.id)}
                onContact={() => handleContactCandidate(suggestion.candidate.id)}
                onView={() => {/* Open candidate profile */}}
                getMatchScoreColor={getMatchScoreColor}
                getMatchScoreLabel={getMatchScoreLabel}
                getExperienceLevelColor={getExperienceLevelColor}
              />
            ))}

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => loadMore()}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Candidates'}
                </Button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {!loading && suggestions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <UserCheck className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No candidates found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or expanding your search criteria.
              </p>
              <Button onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CandidateSuggestionCardProps {
  suggestion: CandidateRecommendation;
  onSave: () => void;
  onContact: () => void;
  onView: () => void;
  getMatchScoreColor: (score: number) => string;
  getMatchScoreLabel: (score: number) => string;
  getExperienceLevelColor: (level: string) => string;
}

function CandidateSuggestionCard({
  suggestion,
  onSave,
  onContact,
  onView,
  getMatchScoreColor,
  getMatchScoreLabel,
  getExperienceLevelColor
}: CandidateSuggestionCardProps) {
  const { candidate, matchScore, matchConfidence, matchDetails, explanation, lastMatched } = suggestion;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                {candidate.title && (
                  <Badge variant="secondary" className="text-xs">
                    {candidate.title}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {candidate.experience && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{candidate.experience.years} years experience</span>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{candidate.location.city}, {candidate.location.state}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="text-right ml-4">
            <div className={`text-2xl font-bold ${getMatchScoreColor(matchScore)}`}>
              {matchScore}%
            </div>
            <div className="text-xs text-gray-500">
              {getMatchScoreLabel(matchScore)}
            </div>
          </div>
        </div>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Key Skills</h4>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.slice(0, 8).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Match Breakdown */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Match Breakdown</h4>
          <div className="space-y-2">
            {matchDetails?.skillsMatch && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Skills Match</span>
                  <span>{matchDetails.skillsMatch}%</span>
                </div>
                <Progress value={matchDetails.skillsMatch} className="h-2" />
              </div>
            )}
            {matchDetails?.experienceMatch && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Experience Match</span>
                  <span>{matchDetails.experienceMatch}%</span>
                </div>
                <Progress value={matchDetails.experienceMatch} className="h-2" />
              </div>
            )}
            {matchDetails?.locationMatch && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Location Match</span>
                  <span>{matchDetails.locationMatch}%</span>
                </div>
                <Progress value={matchDetails.locationMatch} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Experience Level Badge */}
        {candidate.experience?.level && (
          <div className="mb-4">
            <Badge className={getExperienceLevelColor(candidate.experience.level)}>
              {candidate.experience.level}
            </Badge>
          </div>
        )}

        {/* Explanation */}
        {explanation?.strengths && explanation.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Why This Candidate is a Good Match</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {explanation.strengths.slice(0, 3).map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Star className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            Last updated: {formatDistanceToNow(lastMatched, { addSuffix: true })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={onContact}
              className="flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              Contact
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}