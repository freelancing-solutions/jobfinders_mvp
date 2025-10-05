import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiHandler } from '@/lib/api-handler'

export async function GET(request: NextRequest) {
  return apiHandler(request, async (req) => {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get job title suggestions
    const titleMatches = await db.job.findMany({
      where: {
        status: 'PUBLISHED',
        expiresAt: {
          gt: new Date()
        },
        title: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        title: true,
        applicantCount: true
      },
      take: limit * 2, // Get more to have better filtering options
      orderBy: [
        { applicantCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    // Extract unique suggestions
    const suggestions = new Set<string>()

    // Add exact title matches
    titleMatches.forEach(job => {
      if (job.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(job.title)
      }
    })

    // Extract words from titles that contain the query
    titleMatches.forEach(job => {
      const words = job.title.split(' ')
      words.forEach(word => {
        if (
          word.length > 2 &&
          word.toLowerCase().includes(query.toLowerCase()) &&
          !word.toLowerCase().includes(query.toLowerCase()) // Don't add the query itself
        ) {
          suggestions.add(word)
        }
      })
    })

    // Get company name suggestions
    const companyMatches = await db.job.findMany({
      where: {
        status: 'PUBLISHED',
        expiresAt: {
          gt: new Date()
        },
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
      take: Math.floor(limit / 2),
      distinct: ['companyId']
    })

    // Add company names
    companyMatches.forEach(job => {
      if (job.company.name.toLowerCase() !== query.toLowerCase()) {
        suggestions.add(job.company.name)
      }
    })

    // Get skill/keyword suggestions from job descriptions
    const skillMatches = await db.job.findMany({
      where: {
        status: 'PUBLISHED',
        expiresAt: {
          gt: new Date()
        },
        OR: [
          {
            description: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            requirements: {
              path: '$.essential',
              array_contains: [query]
            }
          }
        ]
      },
      select: {
        description: true,
        requirements: true
      },
      take: Math.floor(limit / 2)
    })

    // Extract potential skills from descriptions
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
      'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
      'Machine Learning', 'Data Science', 'DevOps', 'Frontend', 'Backend',
      'Full Stack', 'Mobile', 'iOS', 'Android', 'React Native', 'Flutter',
      'UI/UX', 'Design', 'Product Management', 'Agile', 'Scrum'
    ]

    skillMatches.forEach(job => {
      const requirements = job.requirements as { essential: string[]; preferred: string[] } | null
      const allText = `${job.description} ${requirements?.essential?.join(' ')} ${requirements?.preferred?.join(' ')}`
      
      commonSkills.forEach(skill => {
        if (
          allText.toLowerCase().includes(skill.toLowerCase()) &&
          skill.toLowerCase().includes(query.toLowerCase())
        ) {
          suggestions.add(skill)
        }
      })
    })

    // Convert to array and sort by relevance (exact matches first, then alphabetical)
    const sortedSuggestions = Array.from(suggestions)
      .filter(suggestion => suggestion.toLowerCase() !== query.toLowerCase())
      .sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        const queryLower = query.toLowerCase()
        
        // Exact matches first
        const aExact = aLower === queryLower
        const bExact = bLower === queryLower
        
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        
        // Starts with query next
        const aStarts = aLower.startsWith(queryLower)
        const bStarts = bLower.startsWith(queryLower)
        
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        
        // Then alphabetical
        return a.localeCompare(b)
      })
      .slice(0, limit)

    return NextResponse.json({
      suggestions: sortedSuggestions
    })
  })
}