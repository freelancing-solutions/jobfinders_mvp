import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@/types/roles';

// Request schemas
const MatchingPreferencesSchema = z.object({
  jobTitles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  jobTypes: z.array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'])).optional(),
  experienceLevels: z.array(z.enum(['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'])).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  industries: z.array(z.string()).optional(),
  companySizes: z.array(z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'])).optional(),
  skills: z.array(z.string()).optional(),
  workMode: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
  travelRequirement: z.enum(['NONE', 'OCCASIONAL', 'FREQUENT']).optional(),
  educationLevel: z.enum(['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD']).optional(),
  excludeCompanies: z.array(z.string()).optional(),
  requiredBenefits: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // UserRole.JOB_SEEKER or UserRole.EMPLOYER
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!type || ![UserRole.JOB_SEEKER, UserRole.EMPLOYER].includes(type as UserRole)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's matching preferences
    const preferences = await prisma.matchingPreference.findUnique({
      where: { userId: session.user.id },
    });

    let matches;

    if (type === UserRole.JOB_SEEKER && user.jobSeekerProfile) {
      matches = await getJobSeekerMatches(user.jobSeekerProfile.id, preferences, limit, offset);
    } else if (type === UserRole.EMPLOYER && user.employerProfile) {
      matches = await getEmployerMatches(user.employerProfile.id, preferences, limit, offset);
    } else {
      return NextResponse.json({ error: 'Invalid user profile for matching type' }, { status: 400 });
    }

    // Update last match time
    await prisma.matchingPreference.upsert({
      where: { userId: session.user.id },
      update: { lastMatchAt: new Date() },
      create: {
        userId: session.user.id,
        jobTitles: [],
        locations: [],
      },
    });

    return NextResponse.json({
      matches,
      hasMore: matches.length === limit,
      total: matches.length,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_preferences':
        return await updateMatchingPreferences(session.user.id, body.preferences);

      case 'save_match':
        return await saveMatch(session.user.id, body.matchId, body.type);

      case 'reject_match':
        return await rejectMatch(session.user.id, body.matchId, body.type, body.reason);

      case 'refresh_matches':
        return await refreshMatches(session.user.id, body.type);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in matching POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function getJobSeekerMatches(
  jobSeekerProfileId: string,
  preferences: any,
  limit: number,
  offset: number
) {
  // Get job seeker profile with skills and experience
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { id: jobSeekerProfileId },
    include: {
      user: {
        select: {
          resume: {
            include: {
              skills: true,
              experiences: true,
              educations: true,
            },
          },
        },
      },
    },
  });

  if (!profile) return [];

  const resume = profile.user?.resume?.[0];
  if (!resume) return [];

  // Extract seeker data
  const seekerSkills = resume.skills.map(skill => skill.name);
  const seekerExperience = resume.experiences.map(exp => exp.title);
  const seekerEducation = resume.educations.map(edu => edu.degree);

  // Find matching jobs with complex algorithm
  const jobs = await prisma.job.findMany({
    where: {
      AND: [
        { status: 'ACTIVE' },
        { expiresAt: { gt: new Date() } },
        // Apply preference filters
        preferences?.locations?.length ? {
          OR: preferences.locations.map((location: string) => ({
            location: { contains: location, mode: 'insensitive' }
          }))
        } : {},
        preferences?.jobTypes?.length ? {
          type: { in: preferences.jobTypes }
        } : {},
        preferences?.experienceLevels?.length ? {
          experienceLevel: { in: preferences.experienceLevels }
        } : {},
        preferences?.salaryMin ? {
          salaryMin: { gte: preferences.salaryMin }
        } : {},
        preferences?.industries?.length ? {
          company: { industry: { in: preferences.industries } }
        } : {},
      ],
    },
    include: {
      company: true,
      _count: {
        select: {
          applications: true,
          savedJobs: true,
        },
      },
    },
    orderBy: [
      { featured: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
  });

  // Calculate match scores for each job
  const scoredJobs = jobs.map(job => {
    let score = 0;
    const factors = [];

    // Skills matching (40% weight)
    const jobSkills = job.requiredSkills || [];
    const skillsMatch = calculateSkillsMatch(seekerSkills, jobSkills);
    score += skillsMatch * 0.4;
    factors.push({ type: 'skills', score: skillsMatch, weight: 0.4 });

    // Experience matching (25% weight)
    const experienceMatch = calculateExperienceMatch(seekerExperience, job.description);
    score += experienceMatch * 0.25;
    factors.push({ type: 'experience', score: experienceMatch, weight: 0.25 });

    // Education matching (15% weight)
    const educationMatch = calculateEducationMatch(seekerEducation, job.requirements);
    score += educationMatch * 0.15;
    factors.push({ type: 'education', score: educationMatch, weight: 0.15 });

    // Location preference (10% weight)
    const locationMatch = calculateLocationMatch(profile.location, job.location, preferences);
    score += locationMatch * 0.1;
    factors.push({ type: 'location', score: locationMatch, weight: 0.1 });

    // Salary alignment (10% weight)
    const salaryMatch = calculateSalaryMatch(preferences?.salaryMin, job.salaryMin, job.salaryMax);
    score += salaryMatch * 0.1;
    factors.push({ type: 'salary', score: salaryMatch, weight: 0.1 });

    return {
      ...job,
      matchScore: Math.round(score * 100),
      matchFactors: factors,
      matchReasons: generateMatchReasons(factors),
    };
  });

  // Sort by match score and paginate
  return scoredJobs
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(offset, offset + limit);
}

async function getEmployerMatches(
  employerProfileId: string,
  preferences: any,
  limit: number,
  offset: number
) {
  // Get employer's active jobs
  const jobs = await prisma.job.findMany({
    where: {
      companyId: employerProfileId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (jobs.length === 0) return [];

  // Find candidates who applied to these jobs or match the criteria
  const candidates = await prisma.user.findMany({
    where: {
      AND: [
        { role: UserRole.JOB_SEEKER },
        {
          OR: [
            // Users who applied to company jobs
            {
              applications: {
                some: {
                  job: { companyId: employerProfileId }
                }
              }
            },
            // Users with matching profiles (simplified for now)
            {
              jobSeekerProfile: {
                isNotNull: true
              }
            }
          ]
        }
      ]
    },
    include: {
      jobSeekerProfile: true,
      _count: {
        select: {
          applications: {
            where: {
              job: { companyId: employerProfileId }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
  });

  // For each candidate, get their resume and calculate match scores
  const scoredCandidates = await Promise.all(
    candidates.map(async (candidate) => {
      const resume = await prisma.resume.findFirst({
        where: { userId: candidate.id },
        include: {
          skills: true,
          experiences: true,
          educations: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!resume) return null;

      // Calculate match score based on employer's jobs
      let bestMatchScore = 0;
      let matchingJob = null;

      for (const job of jobs) {
        const jobDetails = await prisma.job.findUnique({
          where: { id: job.id },
          include: { company: true }
        });

        if (jobDetails) {
          const score = calculateCandidateJobMatch(resume, jobDetails);
          if (score > bestMatchScore) {
            bestMatchScore = score;
            matchingJob = jobDetails;
          }
        }
      }

      return {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        avatar: candidate.image,
        location: candidate.jobSeekerProfile?.location,
        title: resume.title,
        experience: resume.experiences.length,
        matchScore: Math.round(bestMatchScore * 100),
        appliedCount: candidate._count.applications,
        lastActive: candidate.lastActive,
        matchingJob,
        skills: resume.skills.slice(0, 6).map(skill => skill.name),
        availability: candidate.jobSeekerProfile?.availability,
      };
    })
  );

  // Filter out nulls and sort by match score
  return scoredCandidates
    .filter(candidate => candidate !== null)
    .sort((a, b) => b!.matchScore - a!.matchScore)
    .slice(offset, offset + limit);
}

// Matching algorithm functions
function calculateSkillsMatch(seekerSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 0.5; // Default score if no job skills specified

  const matchingSkills = seekerSkills.filter(skill =>
    jobSkills.some(jobSkill =>
      jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );

  return matchingSkills.length / jobSkills.length;
}

function calculateExperienceMatch(seekerExperience: string[], jobDescription: string): number {
  if (!jobDescription || seekerExperience.length === 0) return 0.5;

  const experienceKeywords = seekerExperience.join(' ').toLowerCase();
  const descriptionWords = jobDescription.toLowerCase().split(' ');

  const matchingWords = descriptionWords.filter(word =>
    experienceKeywords.includes(word) || word.includes(experienceKeywords)
  );

  return Math.min(matchingWords.length / 20, 1); // Cap at 1, normalize by 20 words
}

function calculateEducationMatch(seekerEducation: string[], jobRequirements: string): number {
  if (!jobRequirements || seekerEducation.length === 0) return 0.5;

  const educationKeywords = seekerEducation.join(' ').toLowerCase();
  const requirementsText = jobRequirements.toLowerCase();

  const hasDegree = educationKeywords.includes('bachelor') ||
                   educationKeywords.includes('master') ||
                   educationKeywords.includes('phd');
  const requiresDegree = requirementsText.includes('degree') ||
                        requirementsText.includes('bachelor') ||
                        requirementsText.includes('master');

  if (requiresDegree && hasDegree) return 1;
  if (requiresDegree && !hasDegree) return 0.3;
  if (!requiresDegree) return 0.8;

  return 0.5;
}

function calculateLocationMatch(seekerLocation: string | null, jobLocation: string, preferences: any): number {
  if (!seekerLocation) return 0.5;

  if (preferences?.workMode === 'REMOTE') return 1;
  if (preferences?.workMode === 'HYBRID' && jobLocation.toLowerCase().includes('remote')) return 0.9;

  // Simple location matching - can be enhanced with geolocation
  const seekerCity = seekerLocation.toLowerCase().split(',')[0];
  const jobCity = jobLocation.toLowerCase().split(',')[0];

  return seekerCity === jobCity ? 1 : 0.3;
}

function calculateSalaryMatch(seekerSalaryMin: number | undefined, jobSalaryMin: number | undefined, jobSalaryMax: number | undefined): number {
  if (!seekerSalaryMin || !jobSalaryMin) return 0.5;

  if (jobSalaryMax && seekerSalaryMin > jobSalaryMax) return 0.2; // Too high
  if (jobSalaryMin && seekerSalaryMin < jobSalaryMin) return 0.6; // Below range but possible
  return 1; // Within range
}

function calculateCandidateJobMatch(resume: any, job: any): number {
  let score = 0;

  // Skills matching
  const candidateSkills = resume.skills.map((skill: any) => skill.name);
  const jobSkills = job.requiredSkills || [];
  const skillsScore = calculateSkillsMatch(candidateSkills, jobSkills);
  score += skillsScore * 0.4;

  // Experience matching
  const experienceTitles = resume.experiences.map((exp: any) => exp.title);
  const experienceScore = calculateExperienceMatch(experienceTitles, job.description);
  score += experienceScore * 0.3;

  // Education matching
  const educationDegrees = resume.educations.map((edu: any) => edu.degree);
  const educationScore = calculateEducationMatch(educationDegrees, job.requirements);
  score += educationScore * 0.2;

  // Availability bonus
  if (resume.experiences.some((exp: any) => !exp.current)) {
    score += 0.1;
  }

  return Math.min(score, 1);
}

function generateMatchReasons(factors: Array<{type: string, score: number, weight: number}>): string[] {
  const reasons = [];

  for (const factor of factors) {
    if (factor.score > 0.7) {
      switch (factor.type) {
        case 'skills':
          reasons.push('Strong skills alignment');
          break;
        case 'experience':
          reasons.push('Relevant experience match');
          break;
        case 'education':
          reasons.push('Education requirements met');
          break;
        case 'location':
          reasons.push('Preferred location');
          break;
        case 'salary':
          reasons.push('Salary expectations aligned');
          break;
      }
    }
  }

  return reasons.length > 0 ? reasons : ['Good overall match'];
}

async function updateMatchingPreferences(userId: string, preferences: any) {
  try {
    const validatedPreferences = MatchingPreferencesSchema.parse(preferences);

    await prisma.matchingPreference.upsert({
      where: { userId },
      update: validatedPreferences,
      create: {
        userId,
        ...validatedPreferences,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid preferences', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

async function saveMatch(userId: string, matchId: string, type: string) {
  if (type === UserRole.JOB_SEEKER) {
    await prisma.savedJob.create({
      data: {
        userId,
        jobId: matchId,
      },
    });
  } else {
    // Save candidate match for employer
    await prisma.savedCandidate.create({
      data: {
        employerId: userId,
        candidateId: matchId,
      },
    });
  }

  return NextResponse.json({ success: true });
}

async function rejectMatch(userId: string, matchId: string, type: string, reason?: string) {
  if (type === UserRole.JOB_SEEKER) {
    await prisma.rejectedJob.create({
      data: {
        userId,
        jobId: matchId,
        reason,
      },
    });
  } else {
    await prisma.rejectedCandidate.create({
      data: {
        employerId: userId,
        candidateId: matchId,
        reason,
      },
    });
  }

  return NextResponse.json({ success: true });
}

async function refreshMatches(userId: string, type: string) {
  // Trigger ML retraining for this user
  // This would typically enqueue a background job
  await prisma.matchingPreference.update({
    where: { userId },
    data: { lastMatchAt: new Date() },
  });

  return NextResponse.json({ success: true, message: 'Matches refreshed' });
}