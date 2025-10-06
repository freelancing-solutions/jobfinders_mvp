/**
 * Design System Integration Test
 * This file verifies all components work together properly
 */

'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from './index'
import { HeroSection, SectionLayout, PageLayout } from './index'
import { useTheme } from './theme/theme-context'

export function DesignSystemTest() {
  const { theme, resolvedTheme, colors, gradients, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Test Theme Switching */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Theme Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Current theme: {theme} (resolved: {resolvedTheme})</p>
              <div className="flex gap-2">
                <Button onClick={() => setTheme('light')} size="sm">Light</Button>
                <Button onClick={() => setTheme('dark')} size="sm">Dark</Button>
                <Button onClick={() => setTheme('system')} size="sm">System</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Components Integration */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Color Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded mx-auto mb-2" />
                <p className="text-sm">Primary</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary rounded mx-auto mb-2" />
                <p className="text-sm">Secondary</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success rounded mx-auto mb-2" />
                <p className="text-sm">Success</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-warning rounded mx-auto mb-2" />
                <p className="text-sm">Warning</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Typography */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Typography Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h1 className="text-4xl-fluid font-bold">Heading 1 (4xl-fluid)</h1>
              <h2 className="text-3xl-fluid font-bold">Heading 2 (3xl-fluid)</h2>
              <h3 className="text-2xl-fluid font-bold">Heading 3 (2xl-fluid)</h3>
              <p className="text-lg-fluid">Large text (lg-fluid)</p>
              <p className="text-base-fluid">Base text (base-fluid)</p>
              <p className="text-sm-fluid">Small text (sm-fluid)</p>
            </div>
          </CardContent>
        </Card>

        {/* Test Spacing */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Spacing Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-primary/10 rounded">Section 1 (p-4)</div>
              <div className="p-6 bg-secondary/10 rounded">Section 2 (p-6)</div>
              <div className="p-8 bg-success/10 rounded">Section 3 (p-8)</div>
            </div>
          </CardContent>
        </Card>

        {/* Test Gradients */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Gradient Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="gradient-primary h-20 rounded-lg" />
              <div className="gradient-secondary h-20 rounded-lg" />
              <div className="gradient-hero h-20 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}