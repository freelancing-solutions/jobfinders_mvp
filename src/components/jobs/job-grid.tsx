import { Job } from '@/types/jobs'
import { JobCard } from './job-card'

interface JobGridProps {
  jobs: Job[]
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
}

export function JobGrid({ jobs, isLoading, viewMode = 'grid' }: JobGridProps) {
  if (isLoading) {
    return (
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[280px] rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold">No jobs found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your search filters
        </p>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
