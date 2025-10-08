'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSavedJobs } from '@/hooks/use-saved-jobs'
import {
  Bookmark,
  MapPin,
  Clock,
  Building,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Plus,
  Edit3,
  Folder,
  Tag,
  MoreHorizontal,
  Download,
  Share2,
  X,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { AppLayout } from '@/components/layout/app-layout'
import { SavedJobsAnalytics } from '@/components/saved-jobs/SavedJobsAnalytics'
import type { SavedJob } from '@/hooks/use-saved-jobs'

interface Collection {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: string
  jobCount: number
}


// Default collections
const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'applied', name: 'Applied', description: 'Jobs you\'ve applied to', color: '#3b82f6', createdAt: new Date().toISOString(), jobCount: 0 },
  { id: 'interviewing', name: 'Interviewing', description: 'Jobs in interview process', color: '#8b5cf6', createdAt: new Date().toISOString(), jobCount: 0 },
  { id: 'follow-up', name: 'Follow-up', description: 'Jobs requiring follow-up', color: '#f59e0b', createdAt: new Date().toISOString(), jobCount: 0 },
  { id: 'saved', name: 'Saved', description: 'All saved jobs', color: '#10b981', createdAt: new Date().toISOString(), jobCount: 0 }
]

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved', color: 'bg-gray-100 text-gray-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-purple-100 text-purple-800' },
  { value: 'follow-up', label: 'Follow-up', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-600' }
]

export default function SavedJobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Use the saved jobs hook
  const {
    savedJobs,
    loading,
    error,
    updateSavedJob,
    removeSavedJob,
    exportSavedJobs
  } = useSavedJobs()

  // State
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCollection, setFilterCollection] = useState('all')
  const [sortBy, setSortBy] = useState('saved-date')
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')

  // Edit states
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [editingStatus, setEditingStatus] = useState('')

  // Redirect if not authenticated or not a seeker
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user?.role !== 'seeker') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Update collection job counts when saved jobs change
  useEffect(() => {
    const updatedCollections = DEFAULT_COLLECTIONS.map(collection => ({
      ...collection,
      jobCount: savedJobs.filter(job =>
        collection.id === 'saved' ? true : job.status === collection.id
      ).length
    }))
    setCollections(updatedCollections)
  }, [savedJobs])

  const handleRemoveJob = async (jobId: string) => {
    await removeSavedJob(jobId)
    setSelectedJobs(prev => prev.filter(id => id !== jobId))
  }

  const handleUpdateJob = async (jobId: string, updates: Partial<SavedJob>) => {
    await updateSavedJob(jobId, updates)
    setEditingJobId(null)
  }

  const handleBulkRemove = async () => {
    await Promise.all(selectedJobs.map(jobId => removeSavedJob(jobId)))
    setSelectedJobs([])
  }

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim(),
      createdAt: new Date().toISOString(),
      jobCount: 0
    }

    setCollections(prev => [...prev, newCollection])
    setNewCollectionName('')
    setNewCollectionDescription('')
    setIsCreateCollectionOpen(false)

    toast({
      title: "Collection Created",
      description: `Collection "${newCollection.name}" has been created.`
    })
  }

  const handleExport = async (format: 'csv' | 'json') => {
    const jobsToExport = selectedJobs.length > 0 ? selectedJobs : filteredJobs.map(job => job.id)

    if (jobsToExport.length === 0) {
      toast({
        title: "No Jobs to Export",
        description: "Please select jobs to export or adjust your filters.",
        variant: "destructive"
      })
      return
    }

    await exportSavedJobs(format, jobsToExport)
  }

  // Filter and sort jobs
  const filteredJobs = savedJobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (job.notes && job.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = filterStatus === 'all' || job.status === filterStatus
      const matchesCollection = filterCollection === 'all' ||
        (filterCollection === 'saved' && !job.status) ||
        job.status === filterCollection
      return matchesSearch && matchesStatus && matchesCollection
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'saved-date':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'company':
          return a.company.localeCompare(b.company)
        case 'salary':
          const aSalary = a.salaryMax || a.salaryMin || 0
          const bSalary = b.salaryMax || b.salaryMin || 0
          return bSalary - aSalary
        default:
          return 0
      }
    })

  const formatSalary = (job: SavedJob) => {
    if (!job.salaryMin && !job.salaryMax) return null
    const currency = job.currency || 'ZAR'
    const min = job.salaryMin ? `${job.salaryMin.toLocaleString()}` : ''
    const max = job.salaryMax ? `${job.salaryMax.toLocaleString()}` : ''
    if (min && max) return `${currency} ${min} - ${max}`
    if (min) return `${currency} ${min}+`
    return `Up to ${currency} ${max}`
  }

  const getStatusColor = (status?: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option ? option.color : 'bg-gray-100 text-gray-800'
  }

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    )
  }

  const handleSelectAll = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([])
    } else {
      setSelectedJobs(filteredJobs.map(job => job.id))
    }
  }

  if (status === 'loading' || loading || error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!session || session.user?.role !== 'seeker') {
    return null // Will redirect
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load saved jobs. Please try again later.'}
            </AlertDescription>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Try Again
            </Button>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={session.user}>
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
                Keep track of opportunities you're interested in and manage your job search
              </p>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  <span>{savedJobs.length} Saved Jobs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span>{collections.length} Collections</span>
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
                <a href="/jobs">
                  Browse Jobs
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          ) : (
            <>
              {/* Collections and Filters */}
              <div className="mb-8">
                <Tabs defaultValue="all-jobs" className="w-full">
                  <div className="flex justify-between items-center mb-6">
                    <TabsList>
                      <TabsTrigger value="all-jobs">All Jobs ({savedJobs.length})</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      {collections.map(collection => (
                        <TabsTrigger key={collection.id} value={collection.id}>
                          {collection.name} ({collection.jobCount})
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <div className="flex gap-2">
                      <Dialog open={isCreateCollectionOpen} onOpenChange={setIsCreateCollectionOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Collection
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Collection</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Collection Name</label>
                              <Input
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                placeholder="e.g. Remote Jobs, Dream Companies"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Description (Optional)</label>
                              <Textarea
                                value={newCollectionDescription}
                                onChange={(e) => setNewCollectionDescription(e.target.value)}
                                placeholder="Describe this collection..."
                                className="mt-1"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsCreateCollectionOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleCreateCollection}>
                                Create Collection
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <TabsContent value="all-jobs">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search saved jobs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saved-date">Recently Saved</SelectItem>
                          <SelectItem value="title">Job Title</SelectItem>
                          <SelectItem value="company">Company Name</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Filter className="h-4 w-4" />
                          <span>{filteredJobs.length} of {savedJobs.length} jobs</span>
                        </div>

                        {selectedJobs.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {selectedJobs.length} selected
                            </span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove {selectedJobs.length} Jobs?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove all selected jobs from your saved list. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleBulkRemove}>
                                    Remove Jobs
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    {filteredJobs.length > 0 && (
                      <div className="flex items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedJobs.length === filteredJobs.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">
                          {selectedJobs.length === filteredJobs.length
                            ? 'All jobs selected'
                            : `${selectedJobs.length} of ${filteredJobs.length} selected`}
                        </span>

                        {selectedJobs.length > 0 && (
                          <div className="flex items-center gap-2 ml-auto">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                  Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('json')}>
                                  Export as JSON
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Job Listings */}
                    <div className="space-y-4">
                      {filteredJobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={selectedJobs.includes(job.id)}
                                onChange={() => handleSelectJob(job.id)}
                                className="h-4 w-4 mt-1"
                              />

                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <a
                                        href={`/jobs/${job.id}`}
                                        className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                                      >
                                        {job.title}
                                      </a>
                                      {job.remotePolicy === 'remote' && (
                                        <Badge variant="secondary" className="text-xs">
                                          Remote
                                        </Badge>
                                      )}
                                      {job.status && (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${getStatusColor(job.status)}`}
                                        >
                                          {STATUS_OPTIONS.find(opt => opt.value === job.status)?.label || job.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-lg text-gray-600 mb-2">{job.company}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {job.location}
                                      </div>
                                      {job.positionType && (
                                        <div className="flex items-center gap-1">
                                          <Building className="h-4 w-4" />
                                          {job.positionType}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        Saved {new Date(job.savedAt).toLocaleDateString()}
                                      </div>
                                      {formatSalary(job) && (
                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                          <DollarSign className="h-4 w-4" />
                                          {formatSalary(job)}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          setEditingJobId(job.id)
                                          setEditingNotes(job.notes || '')
                                          setEditingStatus(job.status || 'saved')
                                        }}>
                                          <Edit3 className="h-4 w-4 mr-2" />
                                          Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleRemoveJob(job.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remove
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button size="sm" asChild>
                                      <a href={`/jobs/${job.id}`}>
                                        Apply Now
                                      </a>
                                    </Button>
                                  </div>
                                </div>

                                {/* Notes Section */}
                                {job.notes && editingJobId !== job.id && (
                                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-gray-700">{job.notes}</p>
                                  </div>
                                )}

                                {/* Edit Mode */}
                                {editingJobId === job.id && (
                                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium mb-2 block">Status</label>
                                        <Select value={editingStatus} onValueChange={setEditingStatus}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {STATUS_OPTIONS.map(status => (
                                              <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium mb-2 block">Notes</label>
                                        <Textarea
                                          value={editingNotes}
                                          onChange={(e) => setEditingNotes(e.target.value)}
                                          placeholder="Add your notes about this job..."
                                          rows={3}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingJobId(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateJob(job.id, {
                                          status: editingStatus as any,
                                          notes: editingNotes
                                        })}
                                      >
                                        Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Tags */}
                                {job.tags && job.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {job.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <div className="flex items-center gap-4">
                                    <span>Saved on {new Date(job.savedAt).toLocaleDateString()}</span>
                                    <a
                                      href={`/jobs/${job.id}`}
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                      View Details
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredJobs.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                        <p className="text-muted-foreground mb-4">
                          No saved jobs match your search criteria. Try adjusting your filters.
                        </p>
                        <Button variant="outline" onClick={() => {
                          setSearchTerm('')
                          setFilterStatus('all')
                          setFilterCollection('all')
                        }}>
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Collection Tabs */}
                  {collections.map(collection => (
                    <TabsContent key={collection.id} value={collection.id}>
                      <div className="text-center py-8">
                        <h3 className="text-lg font-semibold mb-2">{collection.name} Collection</h3>
                        <p className="text-muted-foreground">
                          {collection.description || `Jobs in ${collection.name}`}
                        </p>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}