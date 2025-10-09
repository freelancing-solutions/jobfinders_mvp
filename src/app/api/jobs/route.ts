import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const positionType = searchParams.get('positionType') || '';
    const remotePolicy = searchParams.get('remotePolicy') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build the where clause
    let whereClause: any = {
      status: 'active',
    };

    // Add search conditions
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (location) {
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push(
        { city: { contains: location, mode: 'insensitive' } },
        { province: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
      );
    }

    if (positionType) {
      whereClause.positionType = positionType;
    }

    if (remotePolicy) {
      whereClause.remotePolicy = remotePolicy;
    }

    if (experienceLevel) {
      whereClause.experienceLevel = experienceLevel;
    }

    if (salaryMin || salaryMax) {
      whereClause.AND = [];
      if (salaryMin) {
        whereClause.AND.push({
          salaryMin: { gte: parseFloat(salaryMin) },
        });
      }
      if (salaryMax) {
        whereClause.AND.push({
          salaryMax: { lte: parseFloat(salaryMax) },
        });
      }
    }

    // Get jobs with pagination
    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where: whereClause,
        include: {
          company: {
            select: {
              companyId: true,
              name: true,
              logoUrl: true,
              website: true,
              isVerified: true
            }
          },
          employer: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          category: {
            select: {
              categoryId: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { isUrgent: 'desc' },
          { postedAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      db.job.count({ where: whereClause })
    ])

    // Transform the data to match the frontend interface
    const transformedJobs = jobs.map(job => ({
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
        slug: job.category.slug
      } : undefined,
      location: job.city ? `${job.city}, ${job.province || ''}`.replace(/, $/, '') : job.province || job.country || 'Remote',
      description: job.description,
      requirements: {
        essential: job.requiredSkills || [],
        preferred: job.preferredSkills || []
      },
      salary: job.salaryMin || job.salaryMax ? {
        min: job.salaryMin || 0,
        max: job.salaryMax || 0,
        currency: job.salaryCurrency || 'ZAR'
      } : undefined,
      type: job.positionType,
      experience: job.experienceLevel,
      remote: job.remotePolicy === 'remote' || job.remotePolicy === 'hybrid',
      verified: job.company.isVerified,
      createdAt: job.postedAt.toISOString(),
      updatedAt: job.postedAt.toISOString(), // Using postedAt as we don't have updatedAt
      expiresAt: job.expiresAt?.toISOString(),
      applicationCount: job.applicationCount || 0,
      companyLogo: job.company.logoUrl,
      employer: job.employer ? {
        id: job.employer.employerId,
        name: job.employer.user?.name || ''
      } : undefined,
      tags: [], // Could be derived from skills or category
      benefits: [], // Not available in current schema
      viewCount: job.viewCount || 0,
      isFeatured: job.isFeatured || false,
      isUrgent: job.isUrgent || false,
      educationRequirements: job.educationRequirements,
      requiredDocuments: job.requiredDocuments,
      matchScore: job.matchScore
    }))

    return NextResponse.json({
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      title,
      description,
      companyId,
      employerId,
      positionType,
      remotePolicy,
      salaryMin,
      salaryMax,
      city,
      province,
      country,
      experienceLevel,
      educationRequirements,
      requiredSkills,
      preferredSkills,
      requiredDocuments,
      expiresAt,
      isFeatured = false,
      isUrgent = false,
      categoryId,
    } = body;

    // Validate required fields
    if (!title || !description || !companyId || !employerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate job reference and slug
    const jobRef = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Create the job
    const job = await db.job.create({
      data: {
        jobRef,
        slug,
        title,
        description,
        companyId,
        employerId,
        positionType,
        remotePolicy,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        city,
        province,
        country,
        experienceLevel,
        educationRequirements,
        requiredSkills,
        preferredSkills,
        requiredDocuments,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isFeatured,
        isUrgent,
        categoryId
      },
      include: {
        company: {
          select: {
            companyId: true,
            name: true,
            logoUrl: true,
            website: true,
            isVerified: true
          }
        },
        employer: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        category: {
          select: {
            categoryId: true,
            name: true,
            slug: true
          }
        }
      }
    })

    // Transform the response
    const transformedJob = {
      id: job.jobId,
      title: job.title,
      company: job.company.name,
      location: job.city ? `${job.city}, ${job.province || ''}`.replace(/, $/, '') : job.province || job.country || 'Remote',
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.salaryCurrency,
      positionType: job.positionType,
      remotePolicy: job.remotePolicy,
      description: job.description,
      postedAt: job.postedAt.toISOString(),
      expiresAt: job.expiresAt?.toISOString(),
      experienceLevel: job.experienceLevel,
      educationRequirements: job.educationRequirements,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      requiredDocuments: job.requiredDocuments,
      isFeatured: job.isFeatured,
      isUrgent: job.isUrgent,
      companyLogo: job.company.logoUrl,
      companyDescription: job.company.description,
      companyWebsite: job.company.website,
      applicationCount: job.applicationCount,
      viewCount: job.viewCount,
      matchScore: job.matchScore
    }

    return NextResponse.json(transformedJob, { status: 201 })

  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}