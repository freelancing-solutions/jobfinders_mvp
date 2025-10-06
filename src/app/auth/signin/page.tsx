'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/design-system'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Home } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Get user session to determine redirect path
        const session = await getSession()
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else if (session?.user?.role === 'EMPLOYER') {
          router.push('/employer/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
        <div className="text-center mb-8">
          <h1 className="text-4xl-fluid font-bold text-foreground mb-2">Job Finders</h1>
          <p className="text-muted-foreground text-lg-fluid">Sign in to your account</p>
        </div>

        <Card variant="elevated" hover className="transition-base">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="transition-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="transition-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="transition-base"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-8 text-center text-sm-fluid text-muted-foreground">
              <p>
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline transition-base">
                  Sign up
                </Link>
              </p>
              <p className="mt-2">
                <Link href="/auth/forgot-password" className="text-primary hover:underline transition-base">
                  Forgot your password?
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}