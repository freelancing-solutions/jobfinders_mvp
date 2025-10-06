import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { suggestionEngine, SuggestionRequest } from '@/services/resume-builder/suggestion-engine';
import { rateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Request schema for validation
const ResumeSuggestionsRequestSchema = z.object({
  section: z.enum(['personal', 'experience', 'education', 'skills', 'summary', 'all']).default('all'),
  focus: z.enum(['ats', 'content', 'formatting', 'keywords']).default('content'),
  targetJobTitle: z.string().optional(),
  targetIndustry: z.string().optional(),
});

const FieldSuggestionRequestSchema = z.object({
  field: z.string(),
  value: z.string(),
  context: z.object({
    targetJobTitle: z.string().optional(),
    industry: z.string().optional(),
    experience: z.string().optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resumeId = params.id;

    // Check if resume belongs to user
    const resume = await prisma.resume.findFirst({
      where: {
        resumeId,
        userUid: session.user.id,
      },
      include: {
        experience: true,
        education: true,
        certifications: true,
        languages: true,
        projects: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Rate limiting
    const ip = request.ip || 'unknown';
    const rateLimitResult = await rateLimit(`resume-suggestions:${ip}`, 10, 60000); // 10 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') as any || 'all';
    const focus = searchParams.get('focus') as any || 'content';
    const targetJobTitle = searchParams.get('targetJobTitle') || undefined;
    const targetIndustry = searchParams.get('targetIndustry') || undefined;

    // Build resume data object
    const resumeData = {
      personal: {
        professionalTitle: resume.professionalTitle,
        summary: resume.summary,
        location: resume.location,
        phone: resume.phone,
        website: resume.website,
        linkedin: resume.linkedin,
        github: resume.github,
      },
      experience: resume.experience.map(exp => ({
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        description: exp.description,
        location: exp.location,
        skills: exp.skills,
      })),
      education: resume.education.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
        isCurrent: edu.isCurrent,
        gpa: edu.gpa,
        description: edu.description,
      })),
      certifications: resume.certifications.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        credentialId: cert.credentialId,
        credentialUrl: cert.credentialUrl,
      })),
      languages: resume.languages.map(lang => ({
        language: lang.language,
        proficiency: lang.proficiency,
      })),
      projects: resume.projects.map(proj => ({
        title: proj.title,
        description: proj.description,
        technologies: proj.technologies,
        projectUrl: proj.projectUrl,
        githubUrl: proj.githubUrl,
        startDate: proj.startDate,
        endDate: proj.endDate,
        isCurrent: proj.isCurrent,
      })),
      skills: resume.skills as string[],
    };

    const suggestionRequest: SuggestionRequest = {
      resumeData,
      targetJobTitle,
      targetIndustry,
      section,
      focus,
    };

    const suggestions = await suggestionEngine.generateSuggestions(suggestionRequest);

    return NextResponse.json({
      success: true,
      data: suggestions,
      resumeId,
    });
  } catch (error) {
    console.error('Error in resume suggestions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resumeId = params.id;

    // Check if resume belongs to user
    const resume = await prisma.resume.findFirst({
      where: {
        resumeId,
        userUid: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Rate limiting
    const ip = request.ip || 'unknown';
    const rateLimitResult = await rateLimit(`resume-suggestions:${ip}`, 20, 60000); // 20 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'contextual':
        return handleContextualSuggestions(resumeId, body);
      case 'grammar':
        return handleGrammarCheck(body);
      case 'keywords':
        return handleKeywordAnalysis(resumeId, body);
      default:
        return NextResponse.json(
          { error: 'Invalid suggestion type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in resume suggestions POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleContextualSuggestions(resumeId: string, body: any) {
  try {
    const { field, value, context } = FieldSuggestionRequestSchema.parse(body);

    // Get full resume data for context
    const resume = await prisma.resume.findUnique({
      where: { resumeId },
      include: {
        experience: true,
        education: true,
        certifications: true,
        languages: true,
        projects: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    const resumeData = {
      personal: {
        professionalTitle: resume.professionalTitle,
        summary: resume.summary,
        // ... other personal fields
      },
      // ... build full resume data
    };

    const suggestions = await suggestionEngine.generateContextualSuggestions(
      resumeData,
      field,
      value,
      context || {}
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Error generating contextual suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate contextual suggestions' },
      { status: 500 }
    );
  }
}

async function handleGrammarCheck(body: any) {
  try {
    const { text } = GrammarCheckRequestSchema.parse(body);

    const result = await suggestionEngine.checkGrammar(text);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking grammar:', error);
    return NextResponse.json(
      { error: 'Failed to check grammar' },
      { status: 500 }
    );
  }
}

async function handleKeywordAnalysis(resumeId: string, body: any) {
  try {
    const { jobDescription, industry } = KeywordAnalysisRequestSchema.parse(body);

    // Get resume text from database
    const resume = await prisma.resume.findUnique({
      where: { resumeId },
      include: {
        experience: true,
        education: true,
        certifications: true,
        languages: true,
        projects: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Build resume text from all sections
    const resumeText = [
      resume.professionalTitle,
      resume.summary,
      ...resume.experience.map(exp => `${exp.position} at ${exp.company}. ${exp.description}`),
      ...resume.education.map(edu => `${edu.degree} in ${edu.field} from ${edu.institution}`),
      ...resume.certifications.map(cert => `${cert.name} from ${cert.issuer}`),
      ...resume.languages.map(lang => `${lang.language} - ${lang.proficiency}`),
      ...resume.projects.map(proj => `${proj.title}: ${proj.description}`),
    ].join(' ');

    const result = await suggestionEngine.analyzeKeywords(
      resumeText,
      jobDescription,
      industry
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error analyzing keywords:', error);
    return NextResponse.json(
      { error: 'Failed to analyze keywords' },
      { status: 500 }
    );
  }
}