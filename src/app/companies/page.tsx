import { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, Users, Briefcase, Star, Filter, Building, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppLayout } from '@/components/layout/app-layout'

export const metadata: Metadata = {
  title: 'Companies - Job Finders',
  description: 'Discover top companies and employers in South Africa. Browse company profiles, learn about their culture, and find job opportunities that match your career goals.',
  keywords: 'companies south africa, employers, company profiles, job opportunities, corporate careers',
}

// Mock company data - in a real app, this would come from your API
const companies = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    logo: 'TC',
    industry: 'Technology',
    location: 'Cape Town, Western Cape',
    size: '500-1000',
    rating: 4.5,
    reviewCount: 127,
    openJobs: 15,
    description: 'Leading software development company specializing in enterprise solutions and digital transformation.',
    benefits: ['Remote Work', 'Health Insurance', 'Learning Budget', 'Flexible Hours'],
    featured: true
  },
  {
    id: '2',
    name: 'FinanceFirst Bank',
    logo: 'FF',
    industry: 'Finance',
    location: 'Johannesburg, Gauteng',
    size: '1000+',
    rating: 4.2,
    reviewCount: 89,
    openJobs: 8,
    description: 'Premier financial institution offering comprehensive banking and investment services.',
    benefits: ['Pension Fund', 'Medical Aid', 'Performance Bonus', 'Career Development'],
    featured: true
  },
  {
    id: '3',
    name: 'HealthCare Plus',
    logo: 'HC',
    industry: 'Healthcare',
    location: 'Durban, KwaZulu-Natal',
    size: '200-500',
    rating: 4.7,
    reviewCount: 156,
    openJobs: 12,
    description: 'Private healthcare provider committed to delivering exceptional patient care and medical services.',
    benefits: ['Medical Coverage', 'Professional Development', 'Work-Life Balance', 'Continuing Education'],
    featured: false
  },
  {
    id: '4',
    name: 'EduTech Innovations',
    logo: 'ET',
    industry: 'Education',
    location: 'Pretoria, Gauteng',
    size: '50-200',
    rating: 4.3,
    reviewCount: 67,
    openJobs: 6,
    description: 'Educational technology company revolutionizing learning through innovative digital platforms.',
    benefits: ['Flexible Schedule', 'Learning Opportunities', 'Stock Options', 'Team Building'],
    featured: false
  },
  {
    id: '5',
    name: 'Green Energy Co',
    logo: 'GE',
    industry: 'Energy',
    location: 'Cape Town, Western Cape',
    size: '100-500',
    rating: 4.4,
    reviewCount: 93,
    openJobs: 9,
    description: 'Renewable energy company focused on sustainable solutions and environmental conservation.',
    benefits: ['Environmental Impact', 'Competitive Salary', 'Health Benefits', 'Innovation Time'],
    featured: false
  },
  {
    id: '6',
    name: 'Retail Giants SA',
    logo: 'RG',
    industry: 'Retail',
    location: 'Multiple Locations',
    size: '1000+',
    rating: 3.9,
    reviewCount: 234,
    openJobs: 25,
    description: 'Leading retail chain with stores across South Africa, offering diverse career opportunities.',
    benefits: ['Employee Discounts', 'Career Progression', 'Training Programs', 'Store Incentives'],
    featured: false
  }
]

const industries = [
  'All Industries',
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Energy',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Media'
]

const companySizes = [
  'All Sizes',
  '1-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
]

const locations = [
  'All Locations',
  'Cape Town, Western Cape',
  'Johannesburg, Gauteng',
  'Durban, KwaZulu-Natal',
  'Pretoria, Gauteng',
  'Port Elizabeth, Eastern Cape',
  'Bloemfontein, Free State'
]

export default function CompaniesPage() {
  const featuredCompanies = companies.filter(company => company.featured)
  const allCompanies = companies

  return (
    <AppLayout>
      <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Discover Great Companies</h1>
            <p className="text-xl text-blue-100 mb-8">
              Explore top employers in South Africa, learn about their culture, 
              and find the perfect company to advance your career.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search companies..."
                    className="pl-10 bg-white text-gray-900"
                  />
                </div>
                <Button size="lg" variant="secondary">
                  Search Companies
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">2,000+</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">15,000+</div>
              <div className="text-sm text-muted-foreground">Open Positions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Industries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">9</div>
              <div className="text-sm text-muted-foreground">Provinces</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Companies</h2>
            <p className="text-lg text-muted-foreground">
              Top-rated employers actively hiring talented professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {featuredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      {company.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold">{company.name}</h3>
                        <Badge variant="secondary">Featured</Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{company.industry}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {company.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {company.size} employees
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {company.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {company.benefits.slice(0, 3).map((benefit, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{company.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({company.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium">{company.openJobs} jobs</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/companies/${company.id}`}>
                        View Company
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Companies */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">All Companies</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Showing {allCompanies.length} companies
              </span>
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry.toLowerCase()}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Company Size" />
              </SelectTrigger>
              <SelectContent>
                {companySizes.map((size) => (
                  <SelectItem key={size} value={size.toLowerCase()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location.toLowerCase()}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="jobs">Most Jobs</SelectItem>
                <SelectItem value="size">Company Size</SelectItem>
                <SelectItem value="name">Company Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Company Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {company.logo}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">{company.industry}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {company.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {company.size} employees
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {company.openJobs} open positions
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{company.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({company.reviewCount})
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/companies/${company.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Companies
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Company?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their perfect workplace through Job Finders
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                Create Your Profile
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
          </div>
        </div>
      </section>
      </div>
    </AppLayout>
  )
}