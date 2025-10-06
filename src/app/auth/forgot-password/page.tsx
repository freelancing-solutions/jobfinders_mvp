'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/design-system'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Mail, CheckCircle, Home } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    retryAfter?: string
    remaining?: number
  }>({})

  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await response.json()

      if (response.status === 429) {
        // Rate limited
        setError(data.error || 'Too many requests. Please try again later.')
        if (data.retryAfter) {
          const retryDate = new Date(data.retryAfter)
          const now = new Date()
          const minutesUntilRetry = Math.ceil((retryDate.getTime() - now.getTime()) / (1000 * 60))
          setRateLimitInfo({
            retryAfter: `${minutesUntilRetry} minute${minutesUntilRetry !== 1 ? 's' : ''}`,
            remaining: 0
          })
        }
      } else if (!response.ok) {
        setError(data.error || 'An error occurred. Please try again.')
      } else {
        setSuccess(true)
        // Update rate limit info from headers
        const remaining = response.headers.get('X-RateLimit-Remaining')
        if (remaining) {
          setRateLimitInfo({ remaining: parseInt(remaining) })
        }
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSignIn = () => {
    router.push('/auth/signin')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        {/* Back to Home Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-base"
          asChild
        >
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="w-full max-w-md">
          <Card variant="elevated" hover className="transition-base">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/10 mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <CardTitle className="text-2xl-fluid font-bold text-foreground">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg-fluid">
                We've sent password reset instructions to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-primary">
                    <p className="font-medium mb-1">Email sent to:</p>
                    <p className="break-all">{email}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm-fluid text-muted-foreground space-y-2">
                <p>• Check your inbox and spam folder</p>
                <p>• The reset link expires in 1 hour</p>
                <p>• If you don't receive the email, you can request another one</p>
                {rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining > 0 && (
                  <p className="text-primary">
                    • You have {rateLimitInfo.remaining} more attempt{rateLimitInfo.remaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  variant="outline"
                  size="lg"
                  fullWidth
                  disabled={rateLimitInfo.remaining === 0}
                  className="transition-base"
                >
                  Send Another Email
                </Button>

                <Button
                  onClick={handleBackToSignIn}
                  variant="ghost"
                  size="lg"
                  fullWidth
                  className="transition-base"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-base"
        asChild
      >
        <Link href="/">
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </Button>

      <div className="w-full max-w-md">
        <Card variant="elevated" hover className="transition-base">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl-fluid font-bold text-foreground">
              Forgot Your Password?
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg-fluid">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                  {rateLimitInfo.retryAfter && (
                    <AlertDescription className="mt-2 text-sm">
                      Please try again in {rateLimitInfo.retryAfter}.
                    </AlertDescription>
                  )}
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="transition-base"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={!email.trim()}
                className="transition-base"
              >
                Send Reset Link
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToSignIn}
                  size="sm"
                  className="transition-base"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm-fluid text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-medium text-primary hover:underline transition-base"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}