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
import { Slider } from '@/components/ui/slider';
import { JobRecommendation, MatchFilters, MatchSortOptions } from '@/types/matching';
import { useJobRecommendations } from '@/hooks/use-job-recommendations';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, DollarSign, Briefcase, Clock, Star, Filter, RefreshCw, Save, ExternalLink } from 'lucide-react';

interface JobRecommendationsProps {
  userId: string;
  className?: string;
}

export function JobRecommendations({ userId, className }: JobRecommendationsProps) {
  const [filters, setFilters] = useState<MatchFilters>({});
  const [sort, setSort] = useState<MatchSortOptions>({ field: 'matchScore', order: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  const {
    recommendations,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
    total,
    refreshing
  } = useJobRecommendations(userId, { filters, sort });

  const handleSaveJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        // Update local state to show saved status
        console.log('Job saved successfully');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        // Navigate to application or show success message
        console.log('Application submitted successfully');
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
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

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Failed to load job recommendations</p>
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
              <CardTitle className="text-xl">Job Recommendations</CardTitle>
              <CardDescription>
                Personalized job matches based on your profile ({total} total)
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
              <h3 className="font-medium mb-4">Filter Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Enter city or remote"
                    value={filters.location || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                {/* Salary Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Salary Range: ${filters.salaryRange?.min || 0}k - ${filters.salaryRange?.max || 200}k
                  </label>
                  <Slider
                    value={[filters.salaryRange?.min || 0, filters.salaryRange?.max || 200]}
                    onValueChange={([min, max]) =>
                      setFilters(prev => ({
                        ...prev,
                        salaryRange: { min, max }
                      }))
                    }
                    max={200}
                    step={10}
                    className="mt-2"
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
                    Remote Only
                  </label>
                </div>

                {/* Minimum Match Score */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Minimum Match Score: {filters.minScore || 50}%
                  </label>
                  <Slider
                    value={[filters.minScore || 50]}
                    onValueChange={([minScore]) =>
                      setFilters(prev => ({ ...prev, minScore }))
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
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
                Showing {recommendations.length} of {total} recommendations
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
          {loading && recommendations.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Loading personalized recommendations...</p>
              </div>
            </div>
          )}

          {/* Recommendations Grid/List */}
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <JobRecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onSave={() => handleSaveJob(recommendation.job.id)}
                onApply={() => handleApplyJob(recommendation.job.id)}
                getMatchScoreColor={getMatchScoreColor}
                getMatchScoreLabel={getMatchScoreLabel}
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
                  {loading ? 'Loading...' : 'Load More Recommendations'}
                </Button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {!loading && recommendations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Briefcase className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recommendations found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or complete your profile to get better matches.
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

interface JobRecommendationCardProps {
  recommendation: JobRecommendation;
  onSave: () => void;
  onApply: () => void;
  getMatchScoreColor: (score: number) => string;
  getMatchScoreLabel: (score: number) => string;
}

function JobRecommendationCard({
  recommendation,
  onSave,
  onApply,
  getMatchScoreColor,
  getMatchScoreLabel
}: JobRecommendationCardProps) {
  const { job, matchScore, matchConfidence, matchDetails, explanation, lastMatched } = recommendation;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              <Badge variant="outline">{job.employmentType}</Badge>
            </div>
            <p className="text-gray-600 mb-2">{job.company?.name}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{job.location?.city}, {job.location?.state}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>
                  {job.salaryRange?.min && `$${job.salaryRange.min}k`}
                  {job.salaryRange?.max && job.salaryRange?.min && ` - $${job.salaryRange.max}k`}
                  {job.salaryRange?.max && !job.salaryRange?.min && `Up to $${job.salaryRange.max}k`}
                </span>
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

        {/* Explanation */}
        {explanation?.strengths && explanation.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Why You're a Good Match</h4>
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

        {/* Skills */}
        {job.requirements?.skills && job.requirements.skills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-1">
              {job.requirements.skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.requirements.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{job.requirements.skills.length - 5} more
                </Badge>
              )}
            </div>
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
              onClick={onSave}
              className="flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={onApply}
              className="flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              Apply Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}