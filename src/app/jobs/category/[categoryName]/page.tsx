import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase, MapPin, Clock, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobGrid } from '@/components/jobs/job-grid'
import { CategoryFilter } from '@/components/jobs/CategoryFilter'

// Job categories mapping for validation and display
const jobCategories = {
  'technology': 'Technology',
  'healthcare': 'Healthcare', 
  'finance': 'Finance',
  'education': 'Education',
  'marketing': 'Marketing',
  'sales': 'Sales',
  'engineering': 'Engineering',
  'operations': 'Operations',
  'software-development': 'Software Development',
  'web-development': 'Web Development',
  'mobile-development': 'Mobile Development',
  'data-science': 'Data Science',
  'devops': 'DevOps',
  'cybersecurity': 'Cybersecurity',
  'ui-ux-design': 'UI/UX Design',
  'nursing': 'Nursing',
  'medical-practice': 'Medical Practice',
  'banking': 'Banking',
  'investment': 'Investment',
  'accounting': 'Accounting',
  'teaching': 'Teaching',
  'digital-marketing': 'Digital Marketing',
  'inside-sales': 'Inside Sales',
  'civil-engineering': 'Civil Engineering',
  'supply-chain': 'Supply Chain'
}

interface CategoryPageProps {
  params: {
    categoryName: string
  }
  searchParams: {
    location?: string
    type?: string
    experience?: string
    salary?: string
    page?: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categoryKey = params.categoryName.toLowerCase()
  const categoryDisplay = jobCategories[categoryKey as keyof typeof jobCategories]
  
  if (!categoryDisplay) {
    return {
      title: 'Category Not Found - Job Finders',
      description: 'The requested job category could not be found.'
    }
  }

  return {
    title: `${categoryDisplay} Jobs in South Africa - Job Finders`,
    description: `Find the latest ${categoryDisplay.toLowerCase()} job opportunities in South Africa. Browse through hundreds of ${categoryDisplay.toLowerCase()} positions from top companies.`,
    keywords: `${categoryDisplay.toLowerCase()} jobs, ${categoryDisplay.toLowerCase()} careers, South Africa jobs, ${categoryDisplay.toLowerCase()} opportunities`,
  }
}

// Mock function to fetch jobs by category
async function getJobsByCategory(categoryName: string, searchParams: any) {
  // In a real application, this would fetch from your API/database
  // For now, return mock data
  const mockJobs = [
    {
      id: '1',
      title: 'Senior Software Developer',
      company: 'TechCorp SA',
      location: 'Cape Town, Western Cape',
      type: 'Full-time',
      experience: 'Senior',
      salary: 'R45,000 - R65,000',
      postedAt: '2024-01-15T10:00:00Z',
      description: 'We are looking for an experienced software developer...',
      requirements: ['5+ years experience', 'React', 'Node.js'],
      category: 'Technology'
    },
    {
      id: '2', 
      title: 'Frontend Developer',
      company: 'Digital Solutions',
      location: 'Johannesburg, Gauteng',
      type: 'Full-time',
      experience: 'Mid-level',
      salary: 'R35,000 - R50,000',
      postedAt: '2024-01-14T14:30:00Z',
      description: 'Join our team as a frontend developer...',
      requirements: ['3+ years experience', 'Vue.js', 'TypeScript'],
      category: 'Technology'
    }
  ]

  // Filter based on search params
  let filteredJobs = mockJobs
  
  if (searchParams.location) {
    filteredJobs = filteredJobs.filter(job => 
      job.location.toLowerCase().includes(searchParams.location.toLowerCase())
    )
  }
  
  if (searchParams.type) {
    filteredJobs = filteredJobs.filter(job => 
      job.type.toLowerCase() === searchParams.type.toLowerCase()
    )
  }

  return {
    jobs: filteredJobs,
    total: filteredJobs.length,
    page: parseInt(searchParams.page || '1'),
    totalPages: Math.ceil(filteredJobs.length / 10)
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const categoryKey = params.categoryName.toLowerCase()
  const categoryDisplay = jobCategories[categoryKey as keyof typeof jobCategories]
  
  // Return 404 if category doesn't exist
  if (!categoryDisplay) {
    notFound()
  }

  // Fetch jobs for this category
  const { jobs, total, page, totalPages } = await getJobsByCategory(categoryKey, searchParams)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
              <Link href="/jobs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Link>
            </Button>
          </div>
          
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{categoryDisplay} Jobs</h1>
            <p className="text-xl text-blue-100 mb-6">
              Discover {total} {categoryDisplay.toLowerCase()} opportunities in South Africa
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>{total} Active Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>50+ Companies Hiring</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>All Major Cities</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Category Filter */}
              <CategoryFilter 
                selectedCategories={[categoryDisplay]}
                showMobileFilter={false}
              />
              
              {/* Additional Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Refine Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Type Filter */}
                  <div>
                    <h4 className="font-medium mb-2">Job Type</h4>
                    <div className="space-y-2">
                      {['Full-time', 'Part-time', 'Contract', 'Remote'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            defaultChecked={searchParams.type === type.toLowerCase()}
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Experience Level */}
                  <div>
                    <h4 className="font-medium mb-2">Experience Level</h4>
                    <div className="space-y-2">
                      {['Entry-level', 'Mid-level', 'Senior', 'Executive'].map((level) => (
                        <label key={level} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            defaultChecked={searchParams.experience === level.toLowerCase()}
                          />
                          <span className="text-sm">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content - Job Listings */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  {total} {categoryDisplay} Jobs Found
                </h2>
                <p className="text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
              </div>
              
              {/* Sort Options */}
              <select className="border rounded-md px-3 py-2 text-sm">
                <option value="newest">Newest First</option>
                <option value="salary-high">Highest Salary</option>
                <option value="salary-low">Lowest Salary</option>
                <option value="relevance">Most Relevant</option>
              </select>
            </div>

            {/* Job Listings */}
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Link 
                            href={`/jobs/${job.id}`}
                            className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                          >
                            {job.title}
                          </Link>
                          <p className="text-lg text-gray-600 mt-1">{job.company}</p>
                        </div>
                        <Badge variant="secondary">{job.type}</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(job.postedAt).toLocaleDateString()}
                        </div>
                        {job.salary && (
                          <div className="font-medium text-green-600">
                            {job.salary}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.slice(0, 3).map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                        {job.requirements.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.requirements.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No {categoryDisplay.toLowerCase()} jobs match your current filters.
                  </p>
                  <Button asChild>
                    <Link href="/jobs">Browse All Jobs</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      <Link href={`?page=${pageNum}`}>
                        {pageNum}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}