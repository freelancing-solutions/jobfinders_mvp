'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Bookmark, MapPin, Clock, Building, Trash2, ExternalLink, Filter, Search, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

// Note: This would typically be in a separate metadata file for SSG
// export const metadata: Metadata = {
//   title: 'Saved Jobs - Job Finders',
//   description: 'View and manage your saved job opportunities. Keep track of positions you\'re interested in and apply when ready.',
//   keywords: 'saved jobs, bookmarked jobs, job applications, career opportunities',
// }

// Mock saved jobs data - in a real app, this would come from your API
const mockSavedJobs = [
  {
    id: '1',
    title: 'Senior Software Developer',
    company: 'TechCorp Solutions',
    location: 'Cape Town, Western Cape',
    type: 'Full-time',
    experience: 'Senior',
    salary: 'R45,000 - R65,000',
    postedAt: '2024-01-15T10:00:00Z',
    savedAt: '2024-01-16T14:30:00Z',
    description: 'We are looking for an experienced software developer to join our dynamic team...',
    requirements: ['5+ years experience', 'React', 'Node.js', 'TypeScript'],
    category: 'Technology',
    urgent: false,
    remote: true
  },
  {
    id: '2',
    title: 'Marketing Manager',
    company: 'Digital Marketing Pro',
    location: 'Johannesburg, Gauteng',
    type: 'Full-time',
    experience: 'Mid-level',
    salary: 'R35,000 - R50,000',
    postedAt: '2024-01-14T09:00:00Z',
    savedAt: '2024-01-15T11:20:00Z',
    description: 'Lead our marketing initiatives and drive brand growth across multiple channels...',
    requirements: ['3+ years marketing experience', 'Digital Marketing', 'Analytics', 'Team Leadership'],
    category: 'Marketing',
    urgent: true,
    remote: false
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'Creative Studios',
    location: 'Cape Town, Western Cape',
    type: 'Contract',
    experience: 'Mid-level',
    salary: 'R400 - R600/hour',
    postedAt: '2024-01-13T16:00:00Z',
    savedAt: '2024-01-14T10:45:00Z',
    description: 'Create beautiful and intuitive user experiences for our client projects...',
    requirements: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
    category: 'Design',
    urgent: false,
    remote: true
  },
  {
    id: '4',
    title: 'Data Scientist',
    company: 'Analytics Inc',
    location: 'Durban, KwaZulu-Natal',
    type: 'Full-time',
    experience: 'Senior',
    salary: 'R55,000 - R75,000',
    postedAt: '2024-01-12T08:30:00Z',
    savedAt: '2024-01-13T15:10:00Z',
    description: 'Analyze complex datasets and provide actionable insights to drive business decisions...',
    requirements: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'PhD preferred'],
    category: 'Data Science',
    urgent: false,
    remote: true
  }
]

export default function SavedJobsPage() {
  const { toast } = useToast()
  const [savedJobs, setSavedJobs] = useState(mockSavedJobs)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('saved-date')

  const handleRemoveJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId))
    toast({
      title: "Job Removed",
      description: "The job has been removed from your saved list.",
    })
  }

  const handleApplyToJob = (jobId: string) => {
    toast({
      title: "Redirecting to Application",
      description: "Opening job application page...",
    })
    // In a real app, this would redirect to the job application page
  }

  // Filter and sort jobs
  const filteredJobs = savedJobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === 'all' || job.type.toLowerCase() === filterType
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'saved-date':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case 'posted-date':
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        case 'salary':
          // Simple salary comparison (would need more sophisticated parsing in real app)
          return b.salary.localeCompare(a.salary)
        case 'company':
          return a.company.localeCompare(b.company)
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Bookmark className="h-8 w-8" />
              <h1 className="text-4xl font-bold">Saved Jobs</h1>
            </div>
            <p className="text-xl text-blue-100 mb-6">
              Keep track of opportunities you're interested in and apply when you're ready
            </p>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                <span>{savedJobs.length} Saved Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{savedJobs.filter(job => job.urgent).length} Urgent Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{new Set(savedJobs.map(job => job.company)).size} Companies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {savedJobs.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4">No Saved Jobs Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start exploring job opportunities and save the ones that interest you. 
              You can bookmark jobs to review and apply to them later.
            </p>
            <Button asChild size="lg">
              <Link href="/jobs">
                Browse Jobs
                <ExternalLink className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search saved jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved-date">Recently Saved</SelectItem>
                    <SelectItem value="posted-date">Recently Posted</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="company">Company Name</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>{filteredJobs.length} of {savedJobs.length} jobs</span>
                </div>
              </div>
            </div>

            {/* Job Listings */}
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link 
                            href={`/jobs/${job.id}`}
                            className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                          >
                            {job.title}
                          </Link>
                          {job.urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          {job.remote && (
                            <Badge variant="secondary" className="text-xs">
                              Remote
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg text-gray-600 mb-2">{job.company}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {job.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Posted {new Date(job.postedAt).toLocaleDateString()}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveJob(job.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApplyToJob(job.id)}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requirements.slice(0, 4).map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                      {job.requirements.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.requirements.length - 4} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Saved on {new Date(job.savedAt).toLocaleDateString()}</span>
                      </div>
                      <Link 
                        href={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        View Details
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination would go here in a real app */}
            {filteredJobs.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  No saved jobs match your search criteria. Try adjusting your filters.
                </p>
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tips Section */}
      {savedJobs.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Job Application Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Apply Early</h3>
                    <p className="text-sm text-muted-foreground">
                      Apply within the first few days of a job posting to increase your chances
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <Building className="h-8 w-8 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Research Companies</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn about the company culture and values before applying
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <ExternalLink className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Customize Applications</h3>
                    <p className="text-sm text-muted-foreground">
                      Tailor your resume and cover letter for each specific role
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}