'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, AlertCircle } from 'lucide-react'
import type { JobSeekerProfile } from '@/types/profile'

interface ProfileCompletionProps {
  profile: JobSeekerProfile
}

interface CompletionItem {
  key: keyof JobSeekerProfile
  label: string
  points: number
  isCompleted: boolean
}

export function ProfileCompletion({ profile }: ProfileCompletionProps) {
  const completionItems: CompletionItem[] = [
    {
      key: 'professionalTitle',
      label: 'Professional Title',
      points: 10,
      isCompleted: !!profile.professionalTitle?.trim()
    },
    {
      key: 'summary',
      label: 'Professional Summary',
      points: 15,
      isCompleted: !!profile.summary?.trim() && profile.summary.length > 50
    },
    {
      key: 'skills',
      label: 'Skills (at least 3)',
      points: 15,
      isCompleted: !!(profile.skills && profile.skills.length >= 3)
    },
    {
      key: 'experienceYears',
      label: 'Experience Level',
      points: 10,
      isCompleted: profile.experienceYears !== undefined
    },
    {
      key: 'location',
      label: 'Location',
      points: 10,
      isCompleted: !!profile.location?.trim()
    },
    {
      key: 'phone',
      label: 'Phone Number',
      points: 10,
      isCompleted: !!profile.phone?.trim()
    },
    {
      key: 'website',
      label: 'Website/Portfolio',
      points: 5,
      isCompleted: !!profile.website?.trim()
    },
    {
      key: 'linkedin',
      label: 'LinkedIn Profile',
      points: 5,
      isCompleted: !!profile.linkedin?.trim()
    },
    {
      key: 'github',
      label: 'GitHub Profile',
      points: 5,
      isCompleted: !!profile.github?.trim()
    },
    {
      key: 'portfolioLinks',
      label: 'Portfolio Links',
      points: 5,
      isCompleted: !!(profile.portfolioLinks && profile.portfolioLinks.length > 0)
    },
    {
      key: 'availability',
      label: 'Availability',
      points: 5,
      isCompleted: !!profile.availability?.trim()
    },
    {
      key: 'resumeFileUrl',
      label: 'Resume Uploaded',
      points: 10,
      isCompleted: !!profile.resumeFileUrl?.trim()
    }
  ]

  const totalPoints = completionItems.reduce((sum, item) => sum + item.points, 0)
  const earnedPoints = completionItems.reduce((sum, item) => sum + (item.isCompleted ? item.points : 0), 0)
  const completionPercentage = Math.round((earnedPoints / totalPoints) * 100)

  const getCompletionLevel = () => {
    if (completionPercentage >= 90) return { level: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' }
    if (completionPercentage >= 75) return { level: 'Very Good', color: 'bg-emerald-500', textColor: 'text-emerald-700' }
    if (completionPercentage >= 60) return { level: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' }
    if (completionPercentage >= 40) return { level: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    return { level: 'Needs Work', color: 'bg-red-500', textColor: 'text-red-700' }
  }

  const completionLevel = getCompletionLevel()
  const incompleteItems = completionItems.filter(item => !item.isCompleted)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Profile Completion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completion Status</span>
            <Badge className={completionLevel.textColor} variant="secondary">
              {completionLevel.level}
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{earnedPoints} of {totalPoints} points</span>
            <span>{completionPercentage}%</span>
          </div>
        </div>

        {completionPercentage >= 90 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Excellent! Your profile is highly complete</p>
              <p className="text-xs text-green-600">Employers are more likely to contact candidates with complete profiles</p>
            </div>
          </div>
        )}

        {incompleteItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Suggested improvements ({incompleteItems.length} remaining):
            </p>
            <div className="space-y-1">
              {incompleteItems.slice(0, 5).map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-sm">
                  <Circle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.label}</span>
                  <Badge variant="outline" className="text-xs">
                    +{item.points}pts
                  </Badge>
                </div>
              ))}
              {incompleteItems.length > 5 && (
                <p className="text-xs text-muted-foreground pl-5">
                  +{incompleteItems.length - 5} more items
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Complete profiles receive 3x more views from employers
          </p>
        </div>
      </CardContent>
    </Card>
  )
}