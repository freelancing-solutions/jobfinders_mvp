'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Target,
  Lightbulb,
  FileText,
  Search,
  Zap,
  Award,
  BarChart3
} from 'lucide-react'
import { ATSAnalysisResult } from '@/types/resume'

interface ATSAnalysisDashboardProps {
  analysis: ATSAnalysisResult
  className?: string
}

const COLORS = {
  excellent: '#10b981',
  good: '#3b82f6',
  warning: '#f59e0b',
  poor: '#ef4444'
}

export function ATSAnalysisDashboard({ analysis, className }: ATSAnalysisDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return COLORS.excellent
    if (score >= 75) return COLORS.good
    if (score >= 60) return COLORS.warning
    return COLORS.poor
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Needs Improvement'
    return 'Poor'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 75) return <CheckCircle className="w-5 h-5 text-blue-600" />
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-orange-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  // Prepare data for charts
  const sectionData = Object.entries(analysis.sectionCompleteness).map(([section, score]) => ({
    name: section.charAt(0).toUpperCase() + section.slice(1),
    value: score,
    fill: getScoreColor(score)
  }))

  const keywordData = Object.entries(analysis.keywordDensity).slice(0, 10).map(([keyword, density]) => ({
    keyword,
    density: Math.round(density * 100),
    fill: density > 1 ? COLORS.excellent : COLORS.warning
  }))

  const radarData = [
    { subject: 'Keywords', score: Math.min(100, Object.keys(analysis.keywordDensity).length * 10), fullMark: 100 },
    { subject: 'Structure', score: analysis.sectionCompleteness.summary || 80, fullMark: 100 },
    { subject: 'Content', score: analysis.strengths.length * 15, fullMark: 100 },
    { subject: 'Optimization', score: Math.max(0, 100 - analysis.recommendations.length * 10), fullMark: 100 }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            ATS Analysis Results
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your resume's compatibility with Applicant Tracking Systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={getScoreColor(analysis.score)}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(analysis.score / 100) * 352} 352`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{analysis.score}</div>
                    <div className="text-sm text-gray-600">ATS Score</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getScoreIcon(analysis.score)}
                  <span className="text-xl font-semibold">{getScoreLabel(analysis.score)}</span>
                </div>
                <p className="text-gray-600 max-w-md">
                  {analysis.score >= 90 && "Excellent! Your resume is highly optimized for ATS systems."}
                  {analysis.score >= 75 && analysis.score < 90 && "Good! Your resume is well-optimized with minor improvements possible."}
                  {analysis.score >= 60 && analysis.score < 75 && "Your resume needs some improvements to better pass ATS systems."}
                  {analysis.score < 60 && "Your resume requires significant optimization to pass ATS systems."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="recommendations">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Strengths ({analysis.strengths.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{strength}</p>
                    </div>
                  ))}
                  {analysis.strengths.length === 0 && (
                    <p className="text-sm text-gray-500">No strengths identified yet. Add more content to see improvements.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Areas for Improvement ({analysis.weaknesses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{weakness}</p>
                    </div>
                  ))}
                  {analysis.weaknesses.length === 0 && (
                    <p className="text-sm text-gray-500">Great! No major weaknesses identified.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={getScoreColor(analysis.score)}
                      fill={getScoreColor(analysis.score)}
                      fillOpacity={0.6}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Section Completeness
              </CardTitle>
              <CardDescription>
                Analysis of each resume section's completeness and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectionData.map((section) => (
                  <div key={section.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{section.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{section.value}%</span>
                        {getScoreIcon(section.value)}
                      </div>
                    </div>
                    <Progress value={section.value} className="h-2" />
                    <p className="text-xs text-gray-500">
                      {section.value >= 90 && "Excellent - Section is complete and well-optimized"}
                      {section.value >= 75 && section.value < 90 && "Good - Section is mostly complete"}
                      {section.value >= 50 && section.value < 75 && "Needs work - Add more details"}
                      {section.value < 50 && "Incomplete - This section needs significant content"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Section Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Keyword Analysis
              </CardTitle>
              <CardDescription>
                Important keywords and their density in your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keywordData.map((item) => (
                  <div key={item.keyword} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.fill }} />
                      <span className="font-medium">{item.keyword}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.density > 1 ? 'default' : 'secondary'}>
                        {item.density}% density
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {item.density > 1 ? 'Optimal' : 'Low density'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Missing Keywords */}
          {analysis.missingKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Missing Keywords ({analysis.missingKeywords.length})
                </CardTitle>
                <CardDescription>
                  Important keywords that could improve your ATS score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.slice(0, 20).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="border-orange-200 text-orange-700">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                {analysis.missingKeywords.length > 20 && (
                  <p className="text-sm text-gray-500 mt-3">
                    And {analysis.missingKeywords.length - 20} more keywords...
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Actionable suggestions to improve your ATS score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <Zap className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Recommendation {index + 1}:</strong> {recommendation}
                    </AlertDescription>
                  </Alert>
                ))}
                {analysis.recommendations.length === 0 && (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-600 mb-2">Perfect!</h3>
                    <p className="text-gray-600">
                      Your resume is already well-optimized for ATS systems.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common improvements that can boost your ATS score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Add Quantifiable Achievements</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Include specific numbers, percentages, and metrics in your experience
                  </p>
                  <Badge variant="outline">+15-25 ATS points</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Include Industry Keywords</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Add relevant technical skills and industry-specific terminology
                  </p>
                  <Badge variant="outline">+10-20 ATS points</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Improve Section Balance</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Ensure all sections have adequate content and detail
                  </p>
                  <Badge variant="outline">+5-15 ATS points</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Format Optimization</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Use clean formatting that's ATS-friendly and readable
                  </p>
                  <Badge variant="outline">+5-10 ATS points</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}