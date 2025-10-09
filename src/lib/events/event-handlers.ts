// Event Handlers Implementation
// Event handlers for different system components

import { PrismaClient } from '@prisma/client';
import {
  BaseEvent,
  EventType,
  AppEvent,
  UserRegisteredEvent,
  UserProfileUpdatedEvent,
  JobPostedEvent,
  ApplicationSubmittedEvent,
  MatchCreatedEvent,
  ResumeUploadedEvent,
  ResumeParsedEvent,
  ResumeAnalyzedEvent,
  NotificationCreatedEvent,
  RecommendationGeneratedEvent,
  AnalyticsDataCollectedEvent
} from './event-types';
import { eventBus } from './event-bus';
import { UserRole } from '@/types/roles';

const prisma = new PrismaClient();

// Notification Handlers
export class NotificationHandlers {
  static async handleApplicationSubmitted(event: ApplicationSubmittedEvent): Promise<void> {
    try {
      // Send notification to employer about new application
      const job = await prisma.job.findUnique({
        where: { jobId: event.payload.jobId },
        include: { employer: { include: { user: true } } }
      });

      if (job?.employer.user) {
        await eventBus.publish({
          id: `notification-${Date.now()}`,
          type: EventType.NOTIFICATION_CREATED,
          timestamp: new Date(),
          userId: job.employer.user.uid,
          priority: 'normal' as const,
          source: 'application-system',
          payload: {
            notificationId: `notif-${Date.now()}`,
            userId: job.employer.user.uid,
            type: 'application_received',
            channel: 'in_app',
            title: 'New Application Received',
            message: `A new application has been submitted for ${job.title}`,
            data: {
              applicationId: event.payload.applicationId,
              jobId: event.payload.jobId,
              applicantId: event.payload.jobSeekerProfileId
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to handle application submitted event:', error);
    }
  }

  static async handleMatchCreated(event: MatchCreatedEvent): Promise<void> {
    try {
      // Send notification to candidate about new match
      const candidate = await prisma.user.findUnique({
        where: { uid: event.payload.candidateId }
      });

      const job = await prisma.job.findUnique({
        where: { jobId: event.payload.jobId },
        include: { company: true }
      });

      if (candidate && job) {
        await eventBus.publish({
          id: `notification-${Date.now()}`,
          type: EventType.NOTIFICATION_CREATED,
          timestamp: new Date(),
          userId: candidate.uid,
          priority: 'normal' as const,
          source: 'matching-system',
          payload: {
            notificationId: `notif-${Date.now()}`,
            userId: candidate.uid,
            type: 'job_match',
            channel: 'in_app',
            title: 'New Job Match Found',
            message: `We found a great match: ${job.title} at ${job.company.name}`,
            data: {
              matchId: event.payload.matchId,
              jobId: event.payload.jobId,
              score: event.payload.score,
              confidence: event.payload.confidence
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to handle match created event:', error);
    }
  }

  static async handleRecommendationGenerated(event: RecommendationGeneratedEvent): Promise<void> {
    try {
      // Send notification about new recommendation
      await eventBus.publish({
        id: `notification-${Date.now()}`,
        type: EventType.NOTIFICATION_CREATED,
        timestamp: new Date(),
        userId: event.payload.userId,
        priority: 'low' as const,
        source: 'recommendation-system',
        payload: {
          notificationId: `notif-${Date.now()}`,
          userId: event.payload.userId,
          type: 'new_recommendation',
          channel: 'in_app',
          title: 'New Recommendation Available',
          message: `Check out your new ${event.payload.type} recommendation`,
          data: {
            recommendationId: event.payload.recommendationId,
            targetId: event.payload.targetId,
            type: event.payload.type,
            score: event.payload.score
          }
        }
      });
    } catch (error) {
      console.error('Failed to handle recommendation generated event:', error);
    }
  }
}

// Analytics Handlers
export class AnalyticsHandlers {
  static async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    try {
      // Track user registration metrics
      await eventBus.publish({
        id: `analytics-${Date.now()}`,
        type: EventType.ANALYTICS_DATA_COLLECTED,
        timestamp: new Date(),
        source: 'analytics-system',
        payload: {
          eventType: 'user_registration',
          data: {
            userId: event.payload.userId,
            role: event.payload.role,
            registrationSource: event.payload.registrationSource,
            timestamp: event.timestamp
          }
        }
      });
    } catch (error) {
      console.error('Failed to track user registration analytics:', error);
    }
  }

  static async handleJobPosted(event: JobPostedEvent): Promise<void> {
    try {
      // Track job posting metrics
      await eventBus.publish({
        id: `analytics-${Date.now()}`,
        type: EventType.ANALYTICS_DATA_COLLECTED,
        timestamp: new Date(),
        source: 'analytics-system',
        payload: {
          eventType: 'job_posted',
          data: {
            jobId: event.payload.jobId,
            companyId: event.payload.companyId,
            category: event.payload.category,
            location: event.payload.location,
            isRemote: event.payload.isRemote,
            requirements: event.payload.requirements,
            salaryRange: event.payload.salaryRange
          }
        }
      });
    } catch (error) {
      console.error('Failed to track job posting analytics:', error);
    }
  }

  static async handleApplicationSubmitted(event: ApplicationSubmittedEvent): Promise<void> {
    try {
      // Track application metrics
      await eventBus.publish({
        id: `analytics-${Date.now()}`,
        type: EventType.ANALYTICS_DATA_COLLECTED,
        timestamp: new Date(),
        source: 'analytics-system',
        payload: {
          eventType: 'application_submitted',
          data: {
            applicationId: event.payload.applicationId,
            jobId: event.payload.jobId,
            candidateId: event.payload.jobSeekerProfileId,
            matchScore: event.payload.matchScore,
            appliedAt: event.payload.appliedAt
          }
        }
      });
    } catch (error) {
      console.error('Failed to track application analytics:', error);
    }
  }

  static async handleMatchCreated(event: MatchCreatedEvent): Promise<void> {
    try {
      // Track matching metrics
      await eventBus.publish({
        id: `analytics-${Date.now()}`,
        type: EventType.ANALYTICS_DATA_COLLECTED,
        timestamp: new Date(),
        source: 'analytics-system',
        payload: {
          eventType: 'match_created',
          data: {
            matchId: event.payload.matchId,
            candidateId: event.payload.candidateId,
            jobId: event.payload.jobId,
            score: event.payload.score,
            confidence: event.payload.confidence,
            breakdown: event.payload.breakdown,
            algorithmVersion: event.payload.algorithmVersion
          }
        }
      });
    } catch (error) {
      console.error('Failed to track match analytics:', error);
    }
  }
}

// Profile Handlers
export class ProfileHandlers {
  static async handleResumeUploaded(event: ResumeUploadedEvent): Promise<void> {
    try {
      // Update user profile with resume info
      await prisma.resume.update({
        where: { resumeId: event.payload.resumeId },
        data: {
          updatedAt: new Date()
        }
      });

      // Trigger resume parsing
      await eventBus.publish({
        id: `resume-parse-${Date.now()}`,
        type: EventType.RESUME_PARSED,
        timestamp: new Date(),
        userId: event.payload.userId,
        priority: 'high' as const,
        source: 'resume-system',
        payload: {
          resumeId: event.payload.resumeId,
          userId: event.payload.userId,
          parsedData: {}, // Will be populated by parsing service
          confidence: 0
        }
      });
    } catch (error) {
      console.error('Failed to handle resume uploaded event:', error);
    }
  }

  static async handleResumeParsed(event: ResumeParsedEvent): Promise<void> {
    try {
      // Update resume with parsed data
      const { parsedData } = event.payload;

      await prisma.resume.update({
        where: { resumeId: event.payload.resumeId },
        data: {
          skills: parsedData.skills || [],
          professionalTitle: parsedData.personalInfo?.headline || '',
          summary: parsedData.personalInfo?.summary || '',
          updatedAt: new Date()
        }
      });

      // Trigger resume analysis
      await eventBus.publish({
        id: `resume-analysis-${Date.now()}`,
        type: EventType.RESUME_ANALYZED,
        timestamp: new Date(),
        userId: event.payload.userId,
        priority: 'high' as const,
        source: 'resume-system',
        payload: {
          resumeId: event.payload.resumeId,
          userId: event.payload.userId,
          analysisResults: {
            completionScore: 0, // Will be calculated by analysis service
            skillGaps: [],
            recommendations: [],
            marketFit: 0,
            suggestedImprovements: []
          }
        }
      });
    } catch (error) {
      console.error('Failed to handle resume parsed event:', error);
    }
  }

  static async handleResumeAnalyzed(event: ResumeAnalyzedEvent): Promise<void> {
    try {
      // Update candidate profile with analysis results
      const { analysisResults } = event.payload;

      const candidateProfile = await prisma.candidateProfile.findUnique({
        where: { userId: event.payload.userId }
      });

      if (candidateProfile) {
        await prisma.candidateProfile.update({
          where: { id: candidateProfile.id },
          data: {
            completionScore: analysisResults.completionScore,
            updatedAt: new Date()
          }
        });
      }

      // Trigger new matching based on updated profile
      await eventBus.publish({
        id: `matching-trigger-${Date.now()}`,
        type: EventType.MATCH_UPDATED,
        timestamp: new Date(),
        userId: event.payload.userId,
        priority: 'normal' as const,
        source: 'profile-system',
        payload: {
          matchId: '', // Will be generated by matching service
          candidateId: event.payload.userId,
          jobId: '', // Will trigger matching for all relevant jobs
          changes: {
            profileUpdated: true,
            analysisResults: analysisResults
          }
        }
      });
    } catch (error) {
      console.error('Failed to handle resume analyzed event:', error);
    }
  }
}

// Matching Handlers
export class MatchingHandlers {
  static async handleUserProfileUpdated(event: UserProfileUpdatedEvent): Promise<void> {
    try {
      // Trigger re-matching for user when profile is updated
      const relevantJobTypes = this.getRelevantJobTypes(event.payload.changes);

      for (const jobType of relevantJobTypes) {
        await eventBus.publish({
          id: `rematch-${Date.now()}-${jobType}`,
          type: EventType.MATCH_UPDATED,
          timestamp: new Date(),
          userId: event.payload.userId,
          priority: 'normal' as const,
          source: 'matching-system',
          payload: {
            matchId: '',
            candidateId: event.payload.userId,
            jobId: '',
            changes: {
              profileUpdated: true,
              updatedFields: Object.keys(event.payload.changes)
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to handle user profile updated event:', error);
    }
  }

  static async handleJobPosted(event: JobPostedEvent): Promise<void> {
    try {
      // Trigger matching for new job against all relevant candidates
      const relevantCandidates = await this.findRelevantCandidates(event.payload);

      for (const candidateId of relevantCandidates) {
        await eventBus.publish({
          id: `new-job-match-${Date.now()}-${candidateId}`,
          type: EventType.MATCH_CREATED,
          timestamp: new Date(),
          userId: candidateId,
          priority: 'high' as const,
          source: 'matching-system',
          payload: {
            matchId: `match-${Date.now()}`,
            candidateId,
            jobId: event.payload.jobId,
            score: 0, // Will be calculated by matching service
            breakdown: {
              skillsMatch: 0,
              experienceMatch: 0,
              educationMatch: 0,
              locationMatch: 0,
              overallScore: 0
            },
            confidence: 0,
            algorithmVersion: '1.0'
          }
        });
      }
    } catch (error) {
      console.error('Failed to handle job posted event:', error);
    }
  }

  private static getRelevantJobTypes(changes: Record<string, any>): string[] {
    // Logic to determine what types of jobs should be re-matched
    // based on what changed in the user profile
    const jobTypes: string[] = [];

    if (changes.skills || changes.experience) {
      jobTypes.push('skill_based');
    }

    if (changes.location || changes.remoteWorkPreference) {
      jobTypes.push('location_based');
    }

    if (changes.salaryExpectationMin || changes.salaryExpectationMax) {
      jobTypes.push('salary_based');
    }

    return jobTypes.length > 0 ? jobTypes : ['all'];
  }

  private static async findRelevantCandidates(jobData: any): Promise<string[]> {
    // Logic to find candidates that match the new job
    // This would typically involve querying the database based on job requirements
    try {
      const candidates = await prisma.candidateProfile.findMany({
        where: {
          isActive: true,
          isPublic: true
        },
        take: 100 // Limit for performance
      });

      return candidates.map(candidate => candidate.userId);
    } catch (error) {
      console.error('Failed to find relevant candidates:', error);
      return [];
    }
  }
}

// System Handlers
export class SystemHandlers {
  static async handleAllEvents(event: BaseEvent): Promise<void> {
    try {
      // Log all events for monitoring
      console.log(`Event processed: ${event.type}`, {
        eventId: event.id,
        userId: event.userId,
        timestamp: event.timestamp,
        source: event.source
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  static async handleSystemErrors(event: BaseEvent): Promise<void> {
    try {
      // Handle system-wide errors
      if (event.type === EventType.SYSTEM_ERROR_OCCURRED) {
        const errorEvent = event as any;

        // Log error details
        console.error('System error occurred:', {
          errorId: errorEvent.payload.errorId,
          errorType: errorEvent.payload.errorType,
          message: errorEvent.payload.message,
          severity: errorEvent.payload.severity,
          userId: errorEvent.payload.userId,
          context: errorEvent.payload.context
        });

        // Trigger alert if critical error
        if (errorEvent.payload.severity === 'critical') {
          await this.sendCriticalAlert(errorEvent);
        }
      }
    } catch (error) {
      console.error('Failed to handle system error:', error);
    }
  }

  private static async sendCriticalAlert(errorEvent: any): Promise<void> {
    // Send alert to administrators about critical system errors
    try {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN }
      });

      for (const admin of admins) {
        await eventBus.publish({
          id: `critical-alert-${Date.now()}-${admin.uid}`,
          type: EventType.NOTIFICATION_CREATED,
          timestamp: new Date(),
          userId: admin.uid,
          priority: 'urgent' as const,
          source: 'system-monitor',
          payload: {
            notificationId: `alert-${Date.now()}`,
            userId: admin.uid,
            type: 'system_alert',
            channel: 'in_app',
            title: 'Critical System Error',
            message: `A critical error has occurred: ${errorEvent.payload.message}`,
            data: {
              errorId: errorEvent.payload.errorId,
              errorType: errorEvent.payload.errorType,
              severity: errorEvent.payload.severity
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }
}

// Initialize all event handlers
export function initializeEventHandlers(): void {
  // User Events
  eventBus.subscribe(EventType.USER_REGISTERED, NotificationHandlers.handleUserRegistered);
  eventBus.subscribe(EventType.USER_REGISTERED, AnalyticsHandlers.handleUserRegistered);

  // Profile Events
  eventBus.subscribe(EventType.USER_PROFILE_UPDATED, ProfileHandlers.handleResumeUploaded);
  eventBus.subscribe(EventType.RESUME_UPLOADED, ProfileHandlers.handleResumeUploaded);
  eventBus.subscribe(EventType.RESUME_PARSED, ProfileHandlers.handleResumeParsed);
  eventBus.subscribe(EventType.RESUME_ANALYZED, ProfileHandlers.handleResumeAnalyzed);

  // Job Events
  eventBus.subscribe(EventType.JOB_POSTED, AnalyticsHandlers.handleJobPosted);
  eventBus.subscribe(EventType.JOB_POSTED, MatchingHandlers.handleJobPosted);

  // Application Events
  eventBus.subscribe(EventType.APPLICATION_SUBMITTED, NotificationHandlers.handleApplicationSubmitted);
  eventBus.subscribe(EventType.APPLICATION_SUBMITTED, AnalyticsHandlers.handleApplicationSubmitted);

  // Matching Events
  eventBus.subscribe(EventType.MATCH_CREATED, NotificationHandlers.handleMatchCreated);
  eventBus.subscribe(EventType.MATCH_CREATED, AnalyticsHandlers.handleMatchCreated);
  eventBus.subscribe(EventType.USER_PROFILE_UPDATED, MatchingHandlers.handleUserProfileUpdated);

  // Recommendation Events
  eventBus.subscribe(EventType.RECOMMENDATION_GENERATED, NotificationHandlers.handleRecommendationGenerated);

  // System Events
  eventBus.subscribeMultiple(
    Object.values(EventType),
    SystemHandlers.handleAllEvents
  );

  console.log('Event handlers initialized');
}