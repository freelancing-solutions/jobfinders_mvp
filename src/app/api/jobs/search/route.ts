import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { JobStatus } from '@prisma/client'
import { apiHandler, APIError } from '@/lib/api-handler'

export async function GET(request: NextRequest) {
  return apiHandler(request, async (req) => {
    const { searchParams } = new URL(req.url)
    
    const query = searchParams.get('query') || ''
    const location = searchParams.get('location') || ''
    const employmentType = searchParams.get('employmentType') || ''
    const isRemote = searchParams.get('isRemote') === 'true'
    const experienceLevel = searchParams.get('experienceLevel') || ''
    const categoryId = searchParams.get('categoryId') || undefined
    const salaryMin = searchParams.get('salaryMin') ? parseFloat(searchParams.get('salaryMin')!) : undefined
    const salaryMax = searchParams.get('salaryMax') ? parseFloat(searchParams.get('salaryMax')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Cap at 50
    const offset = (page - 1) * limit

    // Validate page and limit
    if (page < 1) {
      throw new APIError('Page must be greater than 0', 400)
    }
    if (limit < 1 || limit > 50) {
      throw new APIError('Limit must be between 1 and 50', 400)
    }

    // Build the where clause dynamically
    let whereClause: any = {
      status: 'PUBLISHED',
      expiresAt: {
        gt: new Date() // Only show jobs that haven't expired
      }
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          company: {
            name: { contains: query, mode: 'insensitive' }
          }
        }
      ]
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' }
    }

    if (employmentType) {
      whereClause.employmentType = employmentType
    }

    if (isRemote) {
      whereClause.isRemote = true
    }

    if (experienceLevel) {
      whereClause.experienceLevel = experienceLevel
    }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    if (salaryMin !== undefined || salaryMax !== undefined) {
      const salaryFilter: any = {}
      if (salaryMin !== undefined) {
        salaryFilter.gte = salaryMin
      }
      if (salaryMax !== undefined) {
        salaryFilter.lte = salaryMax
      }
      whereClause.salary = {
        path: '$.min',
        ...salaryFilter
      }
    }

    // Build order by clause
    let orderBy: any[] = []
    switch (sortBy) {
      case 'salary':
        orderBy = [
          { salary: { path: '$.min', sort: sortOrder as any } },
          { updatedAt: 'desc' }
        ]
        break
      case 'applicantCount':
        orderBy = [
          { applicantCount: sortOrder as any },
          { updatedAt: 'desc' }
        ]
        break
      case 'relevance':
        // For relevance, we could implement a more sophisticated ranking
        // For now, just sort by updated date
        orderBy = [
          { updatedAt: 'desc' }
        ]
        break
      case 'createdAt':
        orderBy = [
          { createdAt: sortOrder as any },
          { updatedAt: sortOrder as any }
        ]
        break
      default:
        orderBy = [
          { updatedAt: sortOrder as any }
        ]
    }

    // Get total count for pagination
    const totalCount = await db.job.count({ where: whereClause })

    // Get jobs with pagination
    const jobs = await db.job.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            companyId: true,
            name: true,
            logoUrl: true,
            isVerified: true
          }
        },
        category: {
          select: {
            categoryId: true,
            name: true,
            icon: true,
            color: true
          }
        },
        employer: {
          select: {
            employerId: true,
            fullName: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limit
    })

    // Transform the data to match the frontend interface
    const transformedJobs = jobs.map(job => {
      const salaryData = job.salary as { min: number; max: number; currency: string } | null
      
      return {
        id: job.jobId,
        title: job.title,
        company: {
          id: job.company.companyId,
          name: job.company.name,
          logo: job.company.logoUrl,
          isVerified: job.company.isVerified
        },
        category: job.category ? {
          id: job.category.categoryId,
          name: job.category.name,
          icon: job.category.icon,
          color: job.category.color
        } : null,
        location: job.location || '',
        salary: salaryData ? {
          min: salaryData.min,
          max: salaryData.max,
          currency: salaryData.currency
        } : null,
        type: job.employmentType as any,
        category: job.category?.name || '',
        experience: job.experienceLevel as any,
        remote: job.isRemote,
        verified: job.company.isVerified,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        expiresAt: job.expiresAt?.toISOString(),
        applicationCount: job.applicantCount || 0,
        companyLogo: job.company.logoUrl,
        description: job.description,
        requirements: job.requirements as {
          essential: string[];
          preferred: string[];
        },
        employer: {
          id: job.employer.employerId,
          name: job.employer.fullName
        },
        tags: [], // Could be implemented later
        benefits: [] // Could be implemented later
      }
    })

    // Generate facets for filtering
    const facets = await generateFacets(whereClause)

    // Generate suggestions if query is provided
    let suggestions: string[] = []
    if (query && query.length > 2) {
      suggestions = await generateSuggestions(query, whereClause)
    }

    return NextResponse.json({
      success: true,
      data: transformedJobs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      facets,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    })
  })
}

async function generateFacets(baseWhereClause: any) {
  // Get category facets
  const categoryFacets = await db.job.groupBy({
    by: ['categoryId'],
    where: baseWhereClause,
    _count: {
      categoryId: true
    },
    orderBy: {
      _count: {
        categoryId: 'desc'
      }
    },
    take: 10
  })

  const categories = await Promise.all(
    categoryFacets.map(async (facet) => {
      if (!facet.categoryId) return null
      const category = await db.jobCategory.findUnique({
        where: { categoryId: facet.categoryId },
        select: { name: true }
      })
      return category ? {
        name: category.name,
        count: facet._count.categoryId
      } : null
    })
  )

  // Get location facets
  const locationFacets = await db.job.groupBy({
    by: ['location'],
    where: baseWhereClause,
    _count: {
      location: true
    },
    orderBy: {
      _count: {
        location: 'desc'
      }
    },
    take: 10
  })

  // Get employment type facets
  const typeFacets = await db.job.groupBy({
    by: ['employmentType'],
    where: baseWhereClause,
    _count: {
      employmentType: true
    },
    orderBy: {
      _count: {
        employmentType: 'desc'
      }
    }
  })

  // Get experience level facets
  const experienceFacets = await db.job.groupBy({
    by: ['experienceLevel'],
    where: baseWhereClause,
    _count: {
      experienceLevel: true
    },
    orderBy: {
      _count: {
        experienceLevel: 'desc'
      }
    }
  })

  return {
    categories: categories.filter(Boolean) as { name: string; count: number }[],
    locations: locationFacets
      .filter(facet => facet.location)
      .map(facet => ({
        name: facet.location!,
        count: facet._count.location
      })),
    types: typeFacets
      .filter(facet => facet.employmentType)
      .map(facet => ({
        name: facet.employmentType!,
        count: facet._count.employmentType
      })),
    experience: experienceFacets
      .filter(facet => facet.experienceLevel)
      .map(facet => ({
        name: facet.experienceLevel!,
        count: facet._count.experienceLevel
      }))
  }
}

async function generateSuggestions(query: string, baseWhereClause: any) {
  // Get job titles that match the query
  const titleMatches = await db.job.findMany({
    where: {
      ...baseWhereClause,
      title: {
        contains: query,
        mode: 'insensitive'
      }
    },
    select: {
      title: true
    },
    take: 5,
    orderBy: {
      applicantCount: 'desc'
    }
  })

  // Extract unique words from titles
  const titleWords = new Set<string>()
  titleMatches.forEach(job => {
    job.title.split(' ').forEach(word => {
      if (word.length > 2 && word.toLowerCase().includes(query.toLowerCase())) {
        titleWords.add(word)
      }
    })
  })

  // Get company names that match
  const companyMatches = await db.job.findMany({
    where: {
      ...baseWhereClause,
      company: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      }
    },
    select: {
      company: {
        select: {
          name: true
        }
      }
    },
    take: 3
  })

  const suggestions = [
    ...Array.from(titleWords).slice(0, 3),
    ...companyMatches.map(job => job.company.name).slice(0, 2)
  ]

  return suggestions.filter(suggestion => 
    suggestion.toLowerCase() !== query.toLowerCase()
  ).slice(0, 5)
}