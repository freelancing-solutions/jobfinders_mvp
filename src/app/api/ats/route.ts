import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ATSEngine } from '@/lib/services/ats/ATSEngine';
import { ComplianceChecker } from '@/lib/services/ats/ComplianceChecker';
import { IndustryParsers } from '@/lib/services/ats/IndustryParsers';

// Initialize services
const atsEngine = ATSEngine.getInstance();
const complianceChecker = ComplianceChecker.getInstance();
const industryParsers = IndustryParsers.getInstance();

// Request schemas
const AnalyzeApplicationSchema = z.object({
  applicationId: z.string(),
  settings: z.object({
    skillWeights: z.record(z.number()).optional(),
    experienceWeights: z.record(z.number()).optional(),
    educationWeights: z.record(z.number()).optional(),
    enableBiasDetection: z.boolean().optional(),
    enableComplianceChecking: z.boolean().optional(),
    customKeywords: z.array(z.string()).optional(),
    excludedKeywords: z.array(z.string()).optional()
  }).optional()
});

const AnalyzeJobSchema = z.object({
  jobId: z.string(),
  settings: z.object({
    jurisdiction: z.array(z.string()).optional(),
    industry: z.string().optional(),
    enableComplianceChecking: z.boolean().optional()
  }).optional()
});

const BulkAnalyzeSchema = z.object({
  applicationIds: z.array(z.string()),
  settings: z.object({
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    enableComplianceChecking: z.boolean().default(true),
    enableBiasDetection: z.boolean().default(true)
  }).optional()
});

// GET /api/ats - Get ATS insights and analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'job', 'application', 'analytics'
    const id = searchParams.get('id');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employerProfile: true,
        jobSeekerProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (type) {
      case 'job':
        if (!id) {
          return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }
        return await getJobATSInsights(id, user);

      case 'application':
        if (!id) {
          return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }
        return await getApplicationATSInsights(id, user);

      case 'analytics':
        return await getATSAnalytics(user);

      case 'industry':
        return await getIndustryData();

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in ATS GET:', error);
    return NextResponse.json({ error: 'Failed to process ATS request' }, { status: 500 });
  }
}

// POST /api/ats - Run ATS analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employerProfile: true,
        jobSeekerProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'analyze_application':
        return await analyzeApplication(body, user);

      case 'analyze_job':
        return await analyzeJob(body, user);

      case 'bulk_analyze':
        return await bulkAnalyzeApplications(body, user);

      case 'check_compliance':
        return await checkCompliance(body, user);

      case 'extract_keywords':
        return await extractKeywords(body, user);

      case 'update_ats_settings':
        return await updateATSSettings(body, user);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in ATS POST:', error);
    return NextResponse.json({ error: 'Failed to process ATS request' }, { status: 500 });
  }
}

// Helper functions
async function getJobATSInsights(jobId: string, user: any) {
  // Verify user owns this job
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      company: {
        userId: user.id
      }
    },
    include: {
      applications: {
        include: {
          user: {
            include: {
              resume: true
            }
          },
          aTSAnalysis: true
        }
      },
      aTSInsights: true
    }
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
  }

  // Get or generate ATS insights
  let insights = job.aTSInsights;
  if (!insights) {
    insights = await atsEngine.getATSInsights(jobId);

    await prisma.aTSInsights.create({
      data: {
        jobId,
        totalApplications: insights.totalApplications,
        averageScore: insights.averageScore,
        complianceRate: insights.complianceRate,
        topMissingSkills: insights.topMissingSkills,
        scoreDistribution: insights.scoreDistribution
      }
    });
  }

  return NextResponse.json({
    job: {
      id: job.id,
      title: job.title,
      status: job.status
    },
    insights,
    applications: job.applications.map(app => ({
      id: app.id,
      userId: app.userId,
      name: app.user.name,
      email: app.user.email,
      status: app.status,
      appliedAt: app.createdAt,
      atsAnalysis: app.aTSAnalysis
    }))
  });
}

async function getApplicationATSInsights(applicationId: string, user: any) {
  // Verify user can access this application
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      OR: [
        { userId: user.id }, // Applicant
        { job: { company: { userId: user.id } } } // Employer
      ]
    },
    include: {
      user: {
        include: {
          resume: true
        }
      },
      job: true,
      aTSAnalysis: true,
      aTSCompliance: true
    }
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found or access denied' }, { status: 404 });
  }

  return NextResponse.json({
    application: {
      id: application.id,
      userId: application.userId,
      jobId: application.jobId,
      status: application.status,
      appliedAt: application.createdAt
    },
    atsAnalysis: application.aTSAnalysis,
    atsCompliance: application.aTSCompliance
  });
}

async function getATSAnalytics(user: any) {
  // Get comprehensive ATS analytics for employer
  if (user.role === 'EMPLOYER' && user.employerProfile) {
    const jobs = await prisma.job.findMany({
      where: {
        company: {
          userId: user.id
        }
      },
      include: {
        applications: {
          include: {
            aTSAnalysis: true,
            aTSCompliance: true
          }
        },
        aTSInsights: true
      }
    });

    const totalApplications = jobs.reduce((sum, job) => sum + job.applications.length, 0);
    const totalJobs = jobs.length;

    // Calculate average scores
    const analyzedApplications = jobs.flatMap(job =>
      job.applications.filter(app => app.aTSAnalysis)
    );

    const averageScore = analyzedApplications.length > 0
      ? analyzedApplications.reduce((sum, app) => sum + app.aTSAnalysis!.overallScore, 0) / analyzedApplications.length
      : 0;

    // Compliance statistics
    const compliantApplications = analyzedApplications.filter(app =>
      app.aTSCompliance && app.aTSCompliance.status === 'compliant'
    ).length;

    const complianceRate = analyzedApplications.length > 0
      ? (compliantApplications / analyzedApplications.length) * 100
      : 0;

    // Time-based analytics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentApplications = jobs.flatMap(job =>
      job.applications.filter(app => app.createdAt >= last30Days)
    );

    return NextResponse.json({
      overview: {
        totalJobs,
        totalApplications,
        averageScore: Math.round(averageScore),
        complianceRate: Math.round(complianceRate),
        recentApplications: recentApplications.length
      },
      jobBreakdown: jobs.map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: job.applications.length,
        averageScore: job.aTSInsights?.averageScore || 0,
        complianceRate: job.aTSInsights?.complianceRate || 0
      })),
      trends: {
        applicationGrowth: recentApplications.length,
        scoreImprovement: 0, // Would calculate from historical data
        complianceImprovement: 0 // Would calculate from historical data
      }
    });
  }

  return NextResponse.json({ error: 'Analytics not available for this user type' }, { status: 403 });
}

async function getIndustryData() {
  const industries = industryParsers.getAllIndustries();

  return NextResponse.json({
    industries,
    supportedFeatures: [
      'Industry-specific keyword extraction',
      'Custom parsing rules',
      'Industry compliance checks',
      'Specialized scoring algorithms'
    ]
  });
}

async function analyzeApplication(body: any, user: any) {
  try {
    const { applicationId, settings } = AnalyzeApplicationSchema.parse(body);

    // Verify access
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: {
          company: {
            userId: user.id
          }
        }
      },
      include: {
        user: {
          include: {
            resume: true
          }
        },
        job: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found or access denied' }, { status: 404 });
    }

    // Run ATS analysis
    const result = await atsEngine.processApplication(applicationId);

    // Store compliance check if requested
    if (settings?.enableComplianceChecking !== false) {
      const resumeText = [
        application.user.resume?.[0]?.title || '',
        application.user.resume?.[0]?.summary || '',
        application.user.resume?.[0]?.experiences?.map((exp: any) => `${exp.title} ${exp.description}`).join(' ') || '',
        application.user.resume?.[0]?.skills?.map((skill: any) => skill.name).join(' ') || ''
      ].join(' ');

      const jobText = [
        application.job.title,
        application.job.description,
        application.job.requirements
      ].join(' ');

      const complianceReport = await complianceChecker.checkCompliance(jobText, {
        jurisdiction: settings?.jurisdiction || ['US'],
        industry: settings?.industry || 'general',
        documentType: 'job'
      });

      await prisma.aTSCompliance.create({
        data: {
          applicationId,
          status: complianceReport.overallStatus,
          overallScore: complianceReport.overallScore,
          riskLevel: complianceReport.riskLevel,
          violations: complianceReport.checks.flatMap(check => check.result.violations),
          recommendations: complianceReport.checks.flatMap(check => check.result.recommendations),
          createdAt: new Date()
        }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATS_ANALYSIS_APPLICATION',
        resource: `application:${applicationId}`,
        details: {
          score: result.score.overallScore,
          confidence: result.score.confidence,
          complianceStatus: result.compliance.status
        },
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

async function analyzeJob(body: any, user: any) {
  try {
    const { jobId, settings } = AnalyzeJobSchema.parse(body);

    // Verify job ownership
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        company: {
          userId: user.id
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
    }

    const jobText = [job.title, job.description, job.requirements].join(' ');

    // Detect industry
    const industry = industryParsers.detectIndustry(jobText);

    // Extract keywords
    const keywords = await atsEngine.extractKeywords(jobText, 'job');

    // Compliance check
    let complianceReport = null;
    if (settings?.enableComplianceChecking !== false) {
      complianceReport = await complianceChecker.checkCompliance(jobText, {
        jurisdiction: settings?.jurisdiction || ['US'],
        industry: industry.industry,
        documentType: 'job'
      });
    }

    // Store job analysis
    await prisma.jobAnalysis.create({
      data: {
        jobId,
        industry: industry.industry,
        industryConfidence: industry.confidence,
        keywords: keywords as any,
        complianceScore: complianceReport?.overallScore || null,
        riskLevel: complianceReport?.riskLevel || null,
        createdAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATS_ANALYSIS_JOB',
        resource: `job:${jobId}`,
        details: {
          industry: industry.industry,
          keywordCount: keywords.skills.length,
          complianceScore: complianceReport?.overallScore
        },
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      industry,
      keywords,
      compliance: complianceReport
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

async function bulkAnalyzeApplications(body: any, user: any) {
  try {
    const { applicationIds, settings } = BulkAnalyzeSchema.parse(body);

    // Verify access to all applications
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        job: {
          company: {
            userId: user.id
          }
        }
      },
      include: {
        user: {
          include: {
            resume: true
          }
        },
        job: true
      }
    });

    if (applications.length !== applicationIds.length) {
      return NextResponse.json({ error: 'Some applications not found or access denied' }, { status: 404 });
    }

    // Create bulk processing job
    const bulkJob = await prisma.aTSBulkJob.create({
      data: {
        userId: user.id,
        applicationIds,
        settings: settings || {},
        status: 'pending',
        priority: settings?.priority || 'medium',
        createdAt: new Date()
      }
    });

    // Process in background (in production, this would use a job queue)
    processBulkJob(bulkJob.id, applications, settings);

    return NextResponse.json({
      success: true,
      jobId: bulkJob.id,
      message: 'Bulk analysis started'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

async function processBulkJob(jobId: string, applications: any[], settings: any) {
  try {
    // Update job status
    await prisma.aTSBulkJob.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date() }
    });

    const results = [];

    for (const application of applications) {
      try {
        const result = await atsEngine.processApplication(application.id);
        results.push({
          applicationId: application.id,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          applicationId: application.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update job with results
    await prisma.aTSBulkJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        results,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    await prisma.aTSBulkJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

async function checkCompliance(body: any, user: any) {
  const { text, context } = body;

  if (!text) {
    return NextResponse.json({ error: 'Text is required for compliance checking' }, { status: 400 });
  }

  try {
    const report = await complianceChecker.checkCompliance(text, context);

    // Store compliance check if related to a job or application
    if (context?.jobId) {
      await prisma.complianceCheck.create({
        data: {
          jobId: context.jobId,
          userId: user.id,
          text,
          report,
          createdAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    return NextResponse.json({ error: 'Failed to check compliance' }, { status: 500 });
  }
}

async function extractKeywords(body: any, user: any) {
  const { text, type } = body;

  if (!text || !type) {
    return NextResponse.json({ error: 'Text and type are required' }, { status: 400 });
  }

  try {
    const keywords = await atsEngine.extractKeywords(text, type);

    return NextResponse.json({
      success: true,
      keywords
    });
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract keywords' }, { status: 500 });
  }
}

async function updateATSSettings(body: any, user: any) {
  const { settings } = body;

  try {
    await prisma.aTSSettings.upsert({
      where: { userId: user.id },
      update: settings,
      create: {
        userId: user.id,
        ...settings
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}