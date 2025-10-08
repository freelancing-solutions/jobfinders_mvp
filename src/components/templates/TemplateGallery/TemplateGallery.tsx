'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Star,
  Download,
  Eye,
  Filter,
  Grid,
  List,
  Layout,
  Briefcase,
  TrendingUp
} from 'lucide-react'
import { ResumeTemplate } from '@/types/template'

interface TemplateGalleryProps {
  onTemplateSelect: (template: ResumeTemplate) => void
  userId?: string
  jobTitle?: string
  industry?: string
  experienceLevel?: string
  enableRecommendations?: boolean
  className?: string
}

export function TemplateGallery({
  onTemplateSelect,
  userId,
  jobTitle,
  industry,
  experienceLevel,
  enableRecommendations = true,
  className
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')

  // Mock templates data - in real implementation, this would come from API
  const mockTemplates: ResumeTemplate[] = [
    {
      templateId: 'modern-professional',
      name: 'Modern Professional',
      description: 'Clean and contemporary design perfect for corporate roles',
      category: 'professional',
      preview: '/templates/modern-professional-preview.jpg',
      downloadCount: 1250,
      rating: 4.8,
      isPremium: false,
      tags: ['professional', 'corporate', 'clean'],
      features: ['ATS optimized', 'Customizable colors', 'Modern layout'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      templateId: 'creative-designer',
      name: 'Creative Designer',
      description: 'Bold and artistic template for creative professionals',
      category: 'creative',
      preview: '/templates/creative-designer-preview.jpg',
      downloadCount: 890,
      rating: 4.6,
      isPremium: true,
      tags: ['creative', 'design', 'portfolio'],
      features: ['Visual layout', 'Portfolio sections', 'Custom typography'],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    {
      templateId: 'tech-developer',
      name: 'Tech Developer',
      description: 'Optimized for software developers and IT professionals',
      category: 'technical',
      preview: '/templates/tech-developer-preview.jpg',
      downloadCount: 2100,
      rating: 4.9,
      isPremium: false,
      tags: ['technical', 'developer', 'programming'],
      features: ['Skills section', 'Project showcase', 'GitHub integration'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    }
  ]

  useEffect(() => {
    // Simulate loading templates
    setLoading(true)
    setTimeout(() => {
      setTemplates(mockTemplates)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloadCount - a.downloadCount
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'professional', label: 'Professional' },
    { value: 'creative', label: 'Creative' },
    { value: 'technical', label: 'Technical' },
    { value: 'executive', label: 'Executive' },
    { value: 'academic', label: 'Academic' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resume Templates</h2>
          <p className="text-gray-600">Choose from our collection of professional templates</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommended Templates */}
      {enableRecommendations && sortedTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Recommended for You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTemplates.slice(0, 3).map((template) => (
              <TemplateCard
                key={template.templateId}
                template={template}
                onSelect={() => onTemplateSelect(template)}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Templates</h3>
        <div className={viewMode === 'grid' ?
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" :
          "space-y-4"
        }>
          {sortedTemplates.map((template) => (
            <TemplateCard
              key={template.templateId}
              template={template}
              onSelect={() => onTemplateSelect(template)}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>

      {sortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: ResumeTemplate
  onSelect: () => void
  viewMode: 'grid' | 'list'
}

function TemplateCard({ template, onSelect, viewMode }: TemplateCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-24 h-32 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  {template.isPremium && <Badge variant="secondary">Premium</Badge>}
                </div>
                <p className="text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {template.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {template.downloadCount.toLocaleString()}
                  </span>
                  <span>{template.category}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm">Use Template</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center">
            <Layout className="w-12 h-12 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              {template.isPremium && <Badge variant="secondary">Premium</Badge>}
            </div>
            <p className="text-gray-600 text-sm">{template.description}</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm">
                <Star className="w-3 h-3 text-yellow-500" />
                {template.rating}
              </span>
              <span className="text-sm text-gray-500">
                {template.downloadCount.toLocaleString()} downloads
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {template.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}