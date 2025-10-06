'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ConsentPreferences } from '@/lib/consent-manager'
import { X, Settings, Shield, BarChart3, Target, Zap } from 'lucide-react'
import Link from 'next/link'

interface CookieConsentBannerProps {
  onConsentChange?: (preferences: ConsentPreferences) => void
  className?: string
}

export function CookieConsentBanner({ onConsentChange, className }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
    emailMarketing: false,
    smsMarketing: false,
    dataProcessing: false,
    profileSharing: false,
    jobRecommendations: false,
    thirdPartyIntegrations: false,
  })

  // Check if consent banner should be shown
  useEffect(() => {
    checkConsentStatus()
  }, [])

  const checkConsentStatus = async () => {
    try {
      // Generate session ID for anonymous users
      const newSessionId = crypto.randomUUID()
      setSessionId(newSessionId)

      const response = await fetch(`/api/v1/consent?sessionId=${newSessionId}`)
      const data = await response.json()

      if (data.needsRefresh || !response.ok) {
        setIsVisible(true)
      } else {
        setPreferences(data.preferences)
        onConsentChange?.(data.preferences)
      }
    } catch (error) {
      console.error('Error checking consent status:', error)
      setIsVisible(true) // Show banner on error to be safe
    }
  }

  const handlePreferenceChange = (key: keyof ConsentPreferences, value: boolean) => {
    // Essential cookies cannot be disabled
    if (key === 'essential') return

    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveConsent = async (acceptAll: boolean = false) => {
    setIsLoading(true)
    
    try {
      const consentPreferences = acceptAll ? {
        essential: true,
        analytics: true,
        marketing: true,
        functional: true,
        emailMarketing: true,
        smsMarketing: true,
        dataProcessing: true,
        profileSharing: true,
        jobRecommendations: true,
        thirdPartyIntegrations: true,
      } : preferences

      const response = await fetch('/api/v1/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: consentPreferences,
          source: acceptAll ? 'accept_all_button' : 'consent_banner',
          sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        onConsentChange?.(data.preferences)
        setIsVisible(false)
        
        // Store consent in localStorage for quick access
        localStorage.setItem('jobfinders_consent', JSON.stringify({
          preferences: data.preferences,
          timestamp: new Date().toISOString(),
          sessionId: data.sessionId,
        }))
      } else {
        throw new Error('Failed to save consent')
      }
    } catch (error) {
      console.error('Error saving consent:', error)
      // Show error message to user
    } finally {
      setIsLoading(false)
    }
  }

  const rejectAll = async () => {
    const minimalPreferences: ConsentPreferences = {
      essential: true, // Cannot be disabled
      analytics: false,
      marketing: false,
      functional: false,
      emailMarketing: false,
      smsMarketing: false,
      dataProcessing: false,
      profileSharing: false,
      jobRecommendations: false,
      thirdPartyIntegrations: false,
    }
    
    setPreferences(minimalPreferences)
    await saveConsent(false)
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t ${className}`}>
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cookie & Privacy Preferences</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. 
            Your privacy matters to us - choose your preferences below.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!showDetails ? (
            // Simple banner view
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  We respect your privacy. Essential cookies are required for the site to function. 
                  You can customize other preferences or accept all for the best experience.
                </p>
                <div className="flex gap-2 mt-2">
                  <Link href="/privacy" className="text-xs text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/cookies" className="text-xs text-primary hover:underline">
                    Cookie Policy
                  </Link>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  disabled={isLoading}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rejectAll}
                  disabled={isLoading}
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveConsent(true)}
                  disabled={isLoading}
                >
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            // Detailed preferences view
            <div className="space-y-6">
              <div className="grid gap-4">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <Label className="font-medium">Essential Cookies</Label>
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Necessary for the website to function properly. These cannot be disabled.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.essential}
                    disabled={true}
                    className="ml-4"
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <Label className="font-medium">Analytics Cookies</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how visitors interact with our website by collecting anonymous information.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                    className="ml-4"
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <Label className="font-medium">Marketing Cookies</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Used to track visitors across websites to display relevant advertisements.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                    className="ml-4"
                  />
                </div>

                {/* Functional Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <Label className="font-medium">Functional Cookies</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable enhanced functionality like chat widgets, videos, and personalized content.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.functional}
                    onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                    className="ml-4"
                  />
                </div>
              </div>

              <Separator />

              {/* Data Processing Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Data Processing Preferences</h4>
                
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Email Marketing</Label>
                      <p className="text-xs text-muted-foreground">Receive job alerts and promotional emails</p>
                    </div>
                    <Switch
                      checked={preferences.emailMarketing}
                      onCheckedChange={(checked) => handlePreferenceChange('emailMarketing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Job Recommendations</Label>
                      <p className="text-xs text-muted-foreground">Personalized job suggestions based on your profile</p>
                    </div>
                    <Switch
                      checked={preferences.jobRecommendations}
                      onCheckedChange={(checked) => handlePreferenceChange('jobRecommendations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Profile Sharing</Label>
                      <p className="text-xs text-muted-foreground">Allow employers to find your profile</p>
                    </div>
                    <Switch
                      checked={preferences.profileSharing}
                      onCheckedChange={(checked) => handlePreferenceChange('profileSharing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Third-party Integrations</Label>
                      <p className="text-xs text-muted-foreground">Connect with external services and platforms</p>
                    </div>
                    <Switch
                      checked={preferences.thirdPartyIntegrations}
                      onCheckedChange={(checked) => handlePreferenceChange('thirdPartyIntegrations', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  disabled={isLoading}
                >
                  Back to Simple View
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={rejectAll}
                    disabled={isLoading}
                  >
                    Reject All
                  </Button>
                  <Button
                    onClick={() => saveConsent(false)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>

              {/* POPIA Compliance Notice */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium mb-1">POPIA Compliance Notice:</p>
                <p>
                  Your consent preferences are recorded in compliance with the Protection of Personal Information Act (POPIA). 
                  You can change these preferences at any time through your account settings or by contacting us at{' '}
                  <Link href="mailto:privacy@jobfinders.site" className="text-primary hover:underline">
                    privacy@jobfinders.site
                  </Link>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}