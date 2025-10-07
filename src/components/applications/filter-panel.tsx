'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ApplicationStatus } from './status-badge'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Archive,
  Trash2,
} from 'lucide-react'

export interface ApplicationFilters {
  search: string
  status: ApplicationStatus[]
  dateRange: {
    from: Date
    to: Date
  }
  companies: string[]
  locations: string[]
  positionTypes: string[]
  salaryRanges: string[]
  remotePolicies: string[]
  hasMatchScore: boolean | null
  isArchived: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface FilterPanelProps {
  filters: ApplicationFilters
  onFiltersChange: (filters: ApplicationFilters) => void
  availableCompanies: string[]
  availableLocations: string[]
  className?: string
}

const positionTypes = [
  'full-time',
  'part-time',
  'contract',
  'internship',
  'temporary',
  'freelance',
]

const remotePolicies = [
  'onsite',
  'hybrid',
  'remote',
]

const salaryRanges = [
  '0-50000',
  '50000-75000',
  '75000-100000',
  '100000-150000',
  '150000+',
]

const sortOptions = [
  { value: 'appliedAt', label: 'Application Date' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'job.title', label: 'Job Title' },
  { value: 'job.company.name', label: 'Company' },
  { value: 'matchScore', label: 'Match Score' },
  { value: 'job.postedAt', label: 'Job Posted Date' },
]

const statusOptions: ApplicationStatus[] = [
  'applied',
  'reviewing',
  'shortlisted',
  'interview_scheduled',
  'interview_completed',
  'offered',
  'rejected',
  'withdrawn',
  'hired',
  'archived',
]

export function FilterPanel({
  filters,
  onFiltersChange,
  availableCompanies,
  availableLocations,
  className,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof ApplicationFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const addStatus = (status: ApplicationStatus) => {
    if (!filters.status.includes(status)) {
      updateFilter('status', [...filters.status, status])
    }
  }

  const removeStatus = (status: ApplicationStatus) => {
    updateFilter(
      'status',
      filters.status.filter(s => s !== status)
    )
  }

  const addCompany = (company: string) => {
    if (!filters.companies.includes(company)) {
      updateFilter('companies', [...filters.companies, company])
    }
  }

  const removeCompany = (company: string) => {
    updateFilter(
      'companies',
      filters.companies.filter(c => c !== company)
    )
  }

  const addLocation = (location: string) => {
    if (!filters.locations.includes(location)) {
      updateFilter('locations', [...filters.locations, location])
    }
  }

  const removeLocation = (location: string) => {
    updateFilter(
      'locations',
      filters.locations.filter(l => l !== location)
    )
  }

  const addPositionType = (type: string) => {
    if (!filters.positionTypes.includes(type)) {
      updateFilter('positionTypes', [...filters.positionTypes, type])
    }
  }

  const removePositionType = (type: string) => {
    updateFilter(
      'positionTypes',
      filters.positionTypes.filter(t => t !== type)
    )
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
      companies: [],
      locations: [],
      positionTypes: [],
      salaryRanges: [],
      remotePolicies: [],
      hasMatchScore: null,
      isArchived: false,
      sortBy: 'appliedAt',
      sortOrder: 'desc',
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length > 0) count++
    if (filters.companies.length > 0) count++
    if (filters.locations.length > 0) count++
    if (filters.positionTypes.length > 0) count++
    if (filters.salaryRanges.length > 0) count++
    if (filters.remotePolicies.length > 0) count++
    if (filters.hasMatchScore !== null) count++
    if (filters.isArchived) count++
    return count
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-600"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by job title or company..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-2">
            {filters.status.map(status => (
              <Badge
                key={status}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeStatus(status)}
              >
                {status.replace('_', ' ')}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
          <Select onValueChange={(value) => addStatus(value as ApplicationStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Add status filter..." />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem
                  key={status}
                  value={status}
                  disabled={filters.status.includes(status)}
                >
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(filters.dateRange.from, 'MMM dd, yyyy')} -{' '}
                {format(filters.dateRange.to, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateRange.from,
                  to: filters.dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    updateFilter('dateRange', {
                      from: range.from,
                      to: range.to,
                    })
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {isExpanded && (
          <>
            <Separator />

            {/* Company Filter */}
            <div className="space-y-2">
              <Label>Companies</Label>
              <div className="flex flex-wrap gap-2">
                {filters.companies.map(company => (
                  <Badge
                    key={company}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => removeCompany(company)}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {company}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Add company filter..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies
                    .filter(company => !filters.companies.includes(company))
                    .map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label>Locations</Label>
              <div className="flex flex-wrap gap-2">
                {filters.locations.map(location => (
                  <Badge
                    key={location}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => removeLocation(location)}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {location}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Add location filter..." />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations
                    .filter(location => !filters.locations.includes(location))
                    .map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Type Filter */}
            <div className="space-y-2">
              <Label>Position Type</Label>
              <div className="space-y-2">
                {positionTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={filters.positionTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          addPositionType(type)
                        } else {
                          removePositionType(type)
                        }
                      }}
                    />
                    <Label htmlFor={type} className="capitalize">
                      {type.replace('-', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Score Filter */}
            <div className="space-y-2">
              <Label>Match Score</Label>
              <Select
                value={
                  filters.hasMatchScore === true
                    ? 'has'
                    : filters.hasMatchScore === false
                    ? 'none'
                    : 'all'
                }
                onValueChange={(value) => {
                  const hasMatchScore =
                    value === 'has' ? true : value === 'none' ? false : null
                  updateFilter('hasMatchScore', hasMatchScore)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="has">With Match Score</SelectItem>
                  <SelectItem value="none">Without Match Score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Archived Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="archived"
                checked={filters.isArchived}
                onCheckedChange={(checked) => updateFilter('isArchived', !!checked)}
              />
              <Label htmlFor="archived" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Show archived applications
              </Label>
            </div>
          </>
        )}

        <Separator />

        {/* Sort Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilter('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}