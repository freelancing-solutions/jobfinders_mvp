'use client'

import { NavigationHeader } from './navigation-header'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader user={user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}