'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/design-system'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Password strength validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    // Validate token on component mount
    const validateToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          setTokenValid(true)
        } else {
          const data = await response.json()
          setTokenValid(false)
          setError(data.error || 'Invalid or expired reset token')
        }
      } catch (err) {
        setTokenValid(false)
        setError('Failed to validate reset token. Please try again.')
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements')
      setLoading(false)
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          password 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password. Please try again.')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="elevated" className="transition-base">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground text-lg-fluid">Validating reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="elevated" className="transition-base">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl-fluid font-bold text-foreground">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg-fluid">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/forgot-password')}
                  variant="outline"
                  size="lg"
                  fullWidth
                  className="transition-base"
                >
                  Request New Reset Link
                </Button>

                <Button
                  onClick={handleSignIn}
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

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Password Reset Successful
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  You can now sign in with your new password. For security, you'll need to sign in again on all your devices.
                </p>
              </div>

              <Button
                onClick={handleSignIn}
                className="w-full"
              >
                Continue to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password requirements */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                    <div className="space-y-1">
                      {Object.entries({
                        'At least 8 characters': passwordRequirements.minLength,
                        'One lowercase letter': passwordRequirements.hasLowercase,
                        'One uppercase letter': passwordRequirements.hasUppercase,
                        'One number': passwordRequirements.hasNumber,
                      }).map(([requirement, met]) => (
                        <div key={requirement} className="flex items-center text-sm">
                          <CheckCircle 
                            className={`h-3 w-3 mr-2 ${
                              met ? 'text-green-500' : 'text-gray-300'
                            }`} 
                          />
                          <span className={met ? 'text-green-700' : 'text-gray-500'}>
                            {requirement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {confirmPassword && (
                  <div className="flex items-center text-sm mt-1">
                    <CheckCircle 
                      className={`h-3 w-3 mr-2 ${
                        passwordsMatch ? 'text-green-500' : 'text-gray-300'
                      }`} 
                    />
                    <span className={passwordsMatch ? 'text-green-700' : 'text-gray-500'}>
                      Passwords match
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSignIn}
                  className="text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}