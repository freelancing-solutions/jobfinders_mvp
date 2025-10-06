'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Job categories with subcategories
const jobCategories = {
  'Technology': [
    'Software Development',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'DevOps',
    'Cybersecurity',
    'UI/UX Design',
    'System Administration',
    'Database Administration',
    'Quality Assurance'
  ],
  'Healthcare': [
    'Nursing',
    'Medical Practice',
    'Pharmacy',
    'Medical Technology',
    'Healthcare Administration',
    'Mental Health',
    'Physical Therapy',
    'Dental',
    'Veterinary',
    'Medical Research'
  ],
  'Finance': [
    'Banking',
    'Investment',
    'Insurance',
    'Accounting',
    'Financial Planning',
    'Risk Management',
    'Auditing',
    'Tax Services',
    'Credit Analysis',
    'Financial Technology'
  ],
  'Education': [
    'Teaching',
    'Educational Administration',
    'Curriculum Development',
    'Educational Technology',
    'Training & Development',
    'Academic Research',
    'Student Services',
    'Special Education',
    'Early Childhood Education',
    'Higher Education'
  ],
  'Marketing': [
    'Digital Marketing',
    'Content Marketing',
    'Social Media Marketing',
    'SEO/SEM',
    'Brand Management',
    'Market Research',
    'Public Relations',
    'Advertising',
    'Email Marketing',
    'Growth Marketing'
  ],
  'Sales': [
    'Inside Sales',
    'Outside Sales',
    'Account Management',
    'Business Development',
    'Sales Management',
    'Retail Sales',
    'Technical Sales',
    'Customer Success',
    'Sales Operations',
    'Channel Sales'
  ],
  'Engineering': [
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Industrial Engineering',
    'Environmental Engineering',
    'Aerospace Engineering',
    'Biomedical Engineering',
    'Materials Engineering',
    'Petroleum Engineering'
  ],
  'Operations': [
    'Supply Chain',
    'Logistics',
    'Project Management',
    'Operations Management',
    'Process Improvement',
    'Quality Control',
    'Procurement',
    'Facilities Management',
    'Production Planning',
    'Inventory Management'
  ]
}

interface CategoryFilterProps {
  selectedCategories?: string[]
  onCategoryChange?: (categories: string[]) => void
  className?: string
  showMobileFilter?: boolean
}

export function CategoryFilter({ 
  selectedCategories = [], 
  onCategoryChange,
  className,
  showMobileFilter = true 
}: CategoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(selectedCategories)
  const [isOpen, setIsOpen] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sync with URL parameters
  useEffect(() => {
    const categoriesFromUrl = searchParams.get('categories')?.split(',').filter(Boolean) || []
    setLocalSelectedCategories(categoriesFromUrl)
  }, [searchParams])

  // Filter categories based on search term
  const filteredCategories = Object.entries(jobCategories).reduce((acc, [category, subcategories]) => {
    const matchingSubcategories = subcategories.filter(sub =>
      sub.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (matchingSubcategories.length > 0 || category.toLowerCase().includes(searchTerm.toLowerCase())) {
      acc[category] = searchTerm ? matchingSubcategories : subcategories
    }
    
    return acc
  }, {} as Record<string, string[]>)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleCategorySelect = (category: string, isSubcategory = false) => {
    const newSelected = localSelectedCategories.includes(category)
      ? localSelectedCategories.filter(c => c !== category)
      : [...localSelectedCategories, category]
    
    setLocalSelectedCategories(newSelected)
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    if (newSelected.length > 0) {
      params.set('categories', newSelected.join(','))
    } else {
      params.delete('categories')
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
    
    // Call parent callback
    onCategoryChange?.(newSelected)
  }

  const clearAllCategories = () => {
    setLocalSelectedCategories([])
    const params = new URLSearchParams(searchParams.toString())
    params.delete('categories')
    router.push(`?${params.toString()}`, { scroll: false })
    onCategoryChange?.([])
  }

  const CategoryContent = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Categories */}
      {localSelectedCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Selected Categories</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllCategories}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localSelectedCategories.map((category) => (
              <Badge
                key={category}
                variant="default"
                className="cursor-pointer"
                onClick={() => handleCategorySelect(category)}
              >
                {category}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(filteredCategories).map(([category, subcategories]) => (
          <Collapsible
            key={category}
            open={expandedCategories.includes(category)}
            onOpenChange={() => toggleCategory(category)}
          >
            <div className="space-y-2">
              {/* Main Category */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={localSelectedCategories.includes(category)}
                  onCheckedChange={() => handleCategorySelect(category)}
                />
                <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left">
                  <label
                    htmlFor={category}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {category}
                  </label>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                </CollapsibleTrigger>
              </div>

              {/* Subcategories */}
              <CollapsibleContent className="space-y-2 ml-6">
                {subcategories.map((subcategory) => (
                  <div key={subcategory} className="flex items-center space-x-2">
                    <Checkbox
                      id={subcategory}
                      checked={localSelectedCategories.includes(subcategory)}
                      onCheckedChange={() => handleCategorySelect(subcategory, true)}
                    />
                    <label
                      htmlFor={subcategory}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {subcategory}
                    </label>
                  </div>
                ))}
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {Object.keys(filteredCategories).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No categories found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop Filter */}
      <div className="hidden md:block">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Filter by Category</h3>
          <CategoryContent />
        </div>
      </div>

      {/* Mobile Filter */}
      {showMobileFilter && (
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Categories
                {localSelectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {localSelectedCategories.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filter by Category</SheetTitle>
                <SheetDescription>
                  Select job categories to filter your search results.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <CategoryContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  )
}