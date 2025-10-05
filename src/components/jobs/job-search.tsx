'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useJobSearch } from '@/hooks/use-job-search'
import { JobGrid } from './job-grid'
import { SearchHistory } from './search-history'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Briefcase, Filter, DollarSign, Calendar, X } from 'lucide-react'
import type { SearchFilters } from '@/types/jobs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const filterSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  isRemote: z.boolean().optional(),
  experienceLevel: z.string().optional(),
  categoryId: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  datePosted: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  skills: z.array(z.string()).optional(),
})

const defaultValues: SearchFilters = {
  query: '',
  location: '',
  employmentType: '',
  isRemote: false,
  experienceLevel: '',
  categoryId: '',
  salaryMin: undefined,
  salaryMax: undefined,
  datePosted: '',
  companySize: '',
  industry: '',
  skills: [],
  page: 1,
  limit: 10,
}

export function JobSearch() {
  const [filters, setFilters] = useState<SearchFilters>(defaultValues)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const { data, isLoading } = useJobSearch(filters)
  
  const form = useForm<SearchFilters>({
    resolver: zodResolver(filterSchema),
    defaultValues,
  })

  // Add to search history when search is performed
  const addToSearchHistory = (searchFilters: SearchFilters) => {
    if (searchFilters.query.trim()) {
      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]')
      const newItem = {
        id: Date.now().toString(),
        query: searchFilters.query,
        filters: { ...searchFilters, page: 1 },
        timestamp: new Date(),
        isSaved: false
      }
      
      // Remove duplicates and add new item
      const filteredHistory = history.filter(
        (item: any) => item.query !== searchFilters.query || 
        JSON.stringify(item.filters) !== JSON.stringify(newItem.filters)
      )
      
      const updatedHistory = [newItem, ...filteredHistory.slice(0, 19)]
      localStorage.setItem('jobSearchHistory', JSON.stringify(updatedHistory))
    }
  }

  // Calculate active filters count
  useEffect(() => {
    let count = 0
    if (filters.location) count++
    if (filters.employmentType) count++
    if (filters.isRemote) count++
    if (filters.experienceLevel) count++
    if (filters.categoryId) count++
    if (filters.salaryMin || filters.salaryMax) count++
    if (filters.datePosted) count++
    if (filters.companySize) count++
    if (filters.industry) count++
    if (filters.skills && filters.skills.length > 0) count++
    setActiveFiltersCount(count)
  }, [filters])

  const clearAllFilters = () => {
    const clearedFilters = {
      ...defaultValues,
      query: filters.query, // Keep the search query
      page: 1,
    }
    setFilters(clearedFilters)
    form.reset(clearedFilters)
  }

  const removeFilter = (filterKey: keyof SearchFilters) => {
    const newFilters = { ...filters }
    if (filterKey === 'salaryMin' || filterKey === 'salaryMax') {
      newFilters.salaryMin = undefined
      newFilters.salaryMax = undefined
    } else if (filterKey === 'skills') {
      newFilters.skills = []
    } else {
      newFilters[filterKey] = filterKey === 'isRemote' ? false : ''
    }
    setFilters(newFilters)
    form.setValue(filterKey as any, newFilters[filterKey])
  }

  const onSubmit = (values: SearchFilters) => {
    const newFilters = {
      ...values,
      page: 1, // Reset to first page on new search
    }
    setFilters(newFilters)
    addToSearchHistory(newFilters)
  }

  return (
    <div className="space-y-6">
      {/* Search History */}
      <SearchHistory 
        onApplySearch={(searchFilters) => {
          setFilters({ ...searchFilters, page: 1 })
          form.reset(searchFilters)
        }}
        currentFilters={filters}
      />

      {/* Quick Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs..."
              className="pl-9"
              value={filters.query}
              onChange={(e) => {
                const newFilters = { ...filters, query: e.target.value, page: 1 }
                setFilters(newFilters)
                // Add to history if user presses Enter or if search is performed
                if (e.target.value.trim()) {
                  // We'll add it on form submission or when user stops typing
                  setTimeout(() => {
                    if (newFilters.query === e.target.value) {
                      addToSearchHistory(newFilters)
                    }
                  }, 2000) // Add to history after 2 seconds of no typing
                }
              }}
            />
          </div>
          <div className="relative sm:w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Location..."
              className="pl-9"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value, page: 1 })}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:w-[120px]">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Search Filters</SheetTitle>
                <SheetDescription>
                  Refine your job search with additional filters
                </SheetDescription>
              </SheetHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="full-time">Full Time</SelectItem>
                            <SelectItem value="part-time">Part Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="freelance">Freelance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                            <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                            <SelectItem value="senior">Senior Level (6-10 years)</SelectItem>
                            <SelectItem value="lead">Lead/Principal (10+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="datePosted"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Posted</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="3days">Last 3 days</SelectItem>
                            <SelectItem value="week">Last week</SelectItem>
                            <SelectItem value="month">Last month</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="501-1000">501-1000 employees</SelectItem>
                            <SelectItem value="1000+">1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="consulting">Consulting</SelectItem>
                            <SelectItem value="media">Media & Entertainment</SelectItem>
                            <SelectItem value="nonprofit">Non-profit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel>Salary Range (per year)</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="salaryMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Min salary"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="salaryMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Max salary"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="isRemote"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Remote Only</FormLabel>
                          <FormDescription>
                            Show only remote positions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Apply Filters
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearAllFilters}
                    >
                      Clear All
                    </Button>
                  </div>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {filters.location}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('location')}
                />
              </Badge>
            )}
            {filters.employmentType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {filters.employmentType}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('employmentType')}
                />
              </Badge>
            )}
            {filters.experienceLevel && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.experienceLevel}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('experienceLevel')}
                />
              </Badge>
            )}
            {filters.isRemote && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Remote
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('isRemote')}
                />
              </Badge>
            )}
            {(filters.salaryMin || filters.salaryMax) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {filters.salaryMin && `R${filters.salaryMin.toLocaleString()}`}
                {filters.salaryMin && filters.salaryMax && ' - '}
                {filters.salaryMax && `R${filters.salaryMax.toLocaleString()}`}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('salaryMin')}
                />
              </Badge>
            )}
            {filters.datePosted && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {filters.datePosted}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('datePosted')}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <JobGrid
        jobs={data?.data || []}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
            disabled={!data.pagination.hasPrev}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
            disabled={!data.pagination.hasNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
