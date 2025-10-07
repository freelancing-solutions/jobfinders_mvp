/**
 * Home page component for the Job Finders application
 * Displays hero section, statistics, job search, categories, and call-to-action sections
 */

import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { JobSearch } from '@/components/jobs/job-search'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase, Building2, Users, TrendingUp, Search } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

// Constants for magic numbers
const HERO_SECTION_PADDING = { top: 'py-12 sm:py-20' }
const STATS_SECTION_PADDING = { top: 'py-8 sm:py-12' }
const SEARCH_SECTION_PADDING = 'py-12'
const CATEGORIES_PADDING = { top: 'py-8 sm:py-12' }
const CTA_SECTION_PADDING = 'py-12 sm:py-16'
const CONTAINER_PADDING = 'px-4'
const HEADING_MAX_WIDTH = 'max-w-4xl'
const SEARCH_MAX_WIDTH = 'max-w-2xl'
const STATS_ICON_SIZE = { base: 'h-10 w-10', large: 'sm:h-12 sm:w-12' }

// This can be fetched from a database in the future
const jobCategories = [
  { id: '1', name: 'Technology', icon: '💻' },
  { id: '2', name: 'Marketing', icon: '📈' },
  { id: '3', name: 'Design', icon: '🎨' },
  { id: '4', name: 'Sales', icon: '💼' },
  { id: '5', name: 'Finance', icon: '💰' },
  { id: '6', name: 'Healthcare', icon: '🏥' }
]

/**
 * Hero section component with main heading and quick search
 */
function HeroSection() {
  return (
    <section className={`relative bg-gradient-to-r from-slate-700 to-gray-800 text-white ${HERO_SECTION_PADDING.top}`}>
      <div className={`container mx-auto ${CONTAINER_PADDING}`}>
        <div className={`text-center ${HEADING_MAX_WIDTH} mx-auto`}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Find Your Dream Job in South Africa
          </h1>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-slate-200 px-4">
            Connect with top companies and discover opportunities that match your skills and aspirations
          </p>

          <div className="bg-white rounded-lg shadow-lg p-4 mx-auto" style={{ maxWidth: '42rem' }}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  placeholder="Search jobs, companies, or keywords..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  disabled
                />
              </div>
              <Button className="bg-slate-600 hover:bg-slate-700" asChild>
                <Link href="#job-search-section">Search</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Statistics section showing platform metrics
 */
function StatsSection() {
  return (
    <section className={`${STATS_SECTION_PADDING.top} bg-white`}>
      <div className={`container mx-auto ${CONTAINER_PADDING}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 text-center">
          <div className="flex flex-col items-center">
            <Briefcase className={`${STATS_ICON_SIZE.base} ${STATS_ICON_SIZE.large} text-slate-600 mb-2 sm:mb-4`} />
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">10,000+</h3>
            <p className="text-sm sm:text-base text-gray-600">Active Jobs</p>
          </div>
          <div className="flex flex-col items-center">
            <Building2 className={`${STATS_ICON_SIZE.base} ${STATS_ICON_SIZE.large} text-emerald-600 mb-2 sm:mb-4`} />
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">2,500+</h3>
            <p className="text-sm sm:text-base text-gray-600">Companies</p>
          </div>
          <div className="flex flex-col items-center">
            <Users className={`${STATS_ICON_SIZE.base} ${STATS_ICON_SIZE.large} text-violet-600 mb-2 sm:mb-4`} />
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">50,000+</h3>
            <p className="text-sm sm:text-base text-gray-600">Job Seekers</p>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className={`${STATS_ICON_SIZE.base} ${STATS_ICON_SIZE.large} text-amber-600 mb-2 sm:mb-4`} />
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">95%</h3>
            <p className="text-sm sm:text-base text-gray-600">Success Rate</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Job search section with the main search component
 */
function JobSearchSection() {
  return (
    <section id="job-search-section" className={`${SEARCH_SECTION_PADDING} bg-gray-50`}>
      <div className={`container mx-auto ${CONTAINER_PADDING}`}>
        <h2 className="text-3xl font-bold text-center mb-8">Find Your Next Opportunity</h2>
        <Suspense fallback={<div className="flex justify-center items-center py-8">Loading search...</div>}>
          <JobSearch />
        </Suspense>
      </div>
    </section>
  )
}

/**
 * Job categories section displaying popular job categories
 */
function JobCategoriesSection() {
  return (
    <section className={`${CATEGORIES_PADDING.top} bg-white`}>
      <div className={`container mx-auto ${CONTAINER_PADDING}`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Popular Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {jobCategories.map((category) => (
            <Link key={category.id} href={`/jobs?category=${category.name.toLowerCase()}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl mb-2">{category.icon}</div>
                  <h3 className="text-sm sm:font-semibold">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Call-to-action section with action buttons
 */
function CTASection() {
  return (
    <section className={`${CTA_SECTION_PADDING} bg-gradient-to-r from-emerald-600 to-slate-700 text-white`}>
      <div className={`container mx-auto ${CONTAINER_PADDING} text-center`}>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Find Your Next Opportunity?</h2>
        <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-slate-200 px-4">
          Join thousands of professionals who have found their dream jobs through our platform
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link href="#job-search-section">Browse Jobs</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-slate-700" asChild>
            <Link href="/employer/post">Post a Job</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/**
 * Main home page component
 * @returns The complete home page layout with all sections
 */
export default function Home() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <HeroSection />
        <StatsSection />
        <JobSearchSection />
        <JobCategoriesSection />
        <CTASection />
      </div>
    </AppLayout>
  )
}