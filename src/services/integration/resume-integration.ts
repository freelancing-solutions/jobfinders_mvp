/**
 * Resume Builder Integration Service
 * Integrates the resume builder system with the main Next.js application
 */

import { ResumeService } from '@/lib/resume/resume-service';
import { MatchingIntegrationService } from './matching-integration';
import { NotificationService } from '@/lib/notifications/notification-service';
import { Logger } from '@/lib/logger';

export interface ResumeUploadResponse {
  id: string;
  originalName: string;
  uploadedAt: Date;
  status: 'processing' | 'completed' | 'failed';
  analysisResult?: ResumeAnalysis;
}

export interface ResumeAnalysis {
  overallScore: number;
  atsScore: number;
  sections: ResumeSection[];
  skills: SkillAnalysis;
  experience: ExperienceAnalysis;
  education: EducationAnalysis;
  suggestions: string[];
  strengths: string[];
  improvements: string[];
  keywords: string[];
}

export interface ResumeSection {
  name: string;
  score: number;
  present: boolean;
  suggestions: string[];
}

export interface SkillAnalysis {
  technical: string[];
  soft: string[];
  industry: string[];
  missing: string[];
  matchScore: number;
}

export interface ExperienceAnalysis {
  totalYears: number;
  relevantYears: number;
  progression: 'good' | 'average' | 'poor';
  gaps: ExperienceGap[];
}

export interface ExperienceGap {
  period: string;
  reason: string;
  impact: string;
}

export interface EducationAnalysis {
  level: string;
  relevance: number;
  suggestions: string[];
}

export interface ResumeVersion {
  id: string;
  name: string;
  uploadedAt: Date;
  analysisResult: ResumeAnalysis;
  isActive: boolean;
  downloadUrl: string;
}

export class ResumeIntegrationService {
  private resumeService: ResumeService;
  private matchingIntegration: MatchingIntegrationService;
  private notificationService: NotificationService;
  private logger: Logger;

  constructor() {
    this.resumeService = new ResumeService();
    this.matchingIntegration = new MatchingIntegrationService();
    this.notificationService = new NotificationService();
    this.logger = new Logger('ResumeIntegration');
  }

  /**
   * Upload and process a resume
   */
  async uploadResume(
    userId: string,
    file: File,
    resumeName?: string
  ): Promise<ResumeUploadResponse> {
    try {
      this.logger.info(`Processing resume upload for user: ${userId}`);

      // Validate file
      this.validateResumeFile(file);

      // Upload file
      const uploadResult = await this.resumeService.uploadResume(file, userId);

      // Start analysis
      const analysisPromise = this.analyzeResume(uploadResult.id, userId);

      // Return initial response
      const response: ResumeUploadResponse = {
        id: uploadResult.id,
        originalName: file.name,
        uploadedAt: new Date(),
        status: 'processing'
      };

      // Process analysis asynchronously
      analysisPromise
        .then(analysisResult => {
          response.analysisResult = analysisResult;
          response.status = 'completed';
          this.notifyAnalysisComplete(userId, analysisResult);
          this.triggerProfileUpdate(userId, analysisResult);
        })
        .catch(error => {
          this.logger.error('Resume analysis failed:', error);
          response.status = 'failed';
          this.notifyAnalysisFailed(userId, error);
        });

      return response;

    } catch (error) {
      this.logger.error('Error uploading resume:', error);
      throw error;
    }
  }

  /**
   * Get resume analysis result
   */
  async getResumeAnalysis(resumeId: string, userId: string): Promise<ResumeAnalysis | null> {
    try {
      const analysis = await this.resumeService.getAnalysis(resumeId, userId);
      return analysis;

    } catch (error) {
      this.logger.error('Error getting resume analysis:', error);
      throw error;
    }
  }

  /**
   * Get all resume versions for a user
   */
  async getUserResumes(userId: string): Promise<ResumeVersion[]> {
    try {
      const resumes = await this.resumeService.getUserResumes(userId);

      return resumes.map(resume => ({
        id: resume.id,
        name: resume.name || `Resume ${resume.id.slice(-8)}`,
        uploadedAt: resume.uploadedAt,
        analysisResult: resume.analysisResult,
        isActive: resume.isActive,
        downloadUrl: resume.downloadUrl
      }));

    } catch (error) {
      this.logger.error('Error getting user resumes:', error);
      throw error;
    }
  }

  /**
   * Set active resume
   */
  async setActiveResume(userId: string, resumeId: string): Promise<void> {
    try {
      await this.resumeService.setActiveResume(userId, resumeId);

      // Trigger matching update with new active resume
      const analysis = await this.getResumeAnalysis(resumeId, userId);
      if (analysis) {
        await this.triggerProfileUpdate(userId, analysis);
      }

      this.logger.info(`Set active resume: ${userId} -> ${resumeId}`);

    } catch (error) {
      this.logger.error('Error setting active resume:', error);
      throw error;
    }
  }

  /**
   * Generate optimized resume based on job description
   */
  async generateOptimizedResume(
    userId: string,
    resumeId: string,
    jobDescription: string,
    targetTitle: string
  ): Promise<{ content: string; suggestions: string[] }> {
    try {
      const originalResume = await this.resumeService.getResumeContent(resumeId, userId);

      const optimized = await this.resumeService.optimizeResumeForJob(
        originalResume,
        jobDescription,
        targetTitle
      );

      return optimized;

    } catch (error) {
      this.logger.error('Error generating optimized resume:', error);
      throw error;
    }
  }

  /**
   * Download resume in different formats
   */
  async downloadResume(
    resumeId: string,
    userId: string,
    format: 'pdf' | 'docx' | 'txt'
  ): Promise<Blob> {
    try {
      const blob = await this.resumeService.downloadResume(resumeId, userId, format);
      return blob;

    } catch (error) {
      this.logger.error('Error downloading resume:', error);
      throw error;
    }
  }

  /**
   * Compare two resume versions
   */
  async compareResumes(
    userId: string,
    resumeId1: string,
    resumeId2: string
  ): Promise<{
    resume1: ResumeAnalysis;
    resume2: ResumeAnalysis;
    improvements: string[];
    downgrades: string[];
    summary: string;
  }> {
    try {
      const [analysis1, analysis2] = await Promise.all([
        this.getResumeAnalysis(resumeId1, userId),
        this.getResumeAnalysis(resumeId2, userId)
      ]);

      if (!analysis1 || !analysis2) {
        throw new Error('Resume analysis not found');
      }

      const comparison = this.resumeService.compareAnalyses(analysis1, analysis2);

      return {
        resume1: analysis1,
        resume2: analysis2,
        improvements: comparison.improvements,
        downgrades: comparison.downgrades,
        summary: comparison.summary
      };

    } catch (error) {
      this.logger.error('Error comparing resumes:', error);
      throw error;
    }
  }

  /**
   * Get ATS optimization suggestions
   */
  async getATSOptimization(resumeId: string, userId: string): Promise<{
    currentScore: number;
    targetScore: number;
    suggestions: string[];
    keywordGaps: string[];
    formatIssues: string[];
    actionPlan: string[];
  }> {
    try {
      const analysis = await this.getResumeAnalysis(resumeId, userId);
      if (!analysis) {
        throw new Error('Resume analysis not found');
      }

      return this.resumeService.getATSOptimizationSuggestions(analysis);

    } catch (error) {
      this.logger.error('Error getting ATS optimization:', error);
      throw error;
    }
  }

  /**
   * Delete a resume
   */
  async deleteResume(userId: string, resumeId: string): Promise<void> {
    try {
      await this.resumeService.deleteResume(resumeId, userId);
      this.logger.info(`Deleted resume: ${userId} -> ${resumeId}`);

    } catch (error) {
      this.logger.error('Error deleting resume:', error);
      throw error;
    }
  }

  // Private methods
  private validateResumeFile(file: File): void {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }
  }

  private async analyzeResume(resumeId: string, userId: string): Promise<ResumeAnalysis> {
    return await this.resumeService.analyzeResume(resumeId, userId);
  }

  private async notifyAnalysisComplete(userId: string, analysis: ResumeAnalysis): Promise<void> {
    await this.notificationService.sendNotification({
      userId,
      type: 'resume_analysis_complete',
      title: 'Resume Analysis Complete',
      message: `Your resume has been analyzed with an overall score of ${analysis.overallScore}/100.`,
      data: {
        score: analysis.overallScore,
        atsScore: analysis.atsScore,
        suggestions: analysis.suggestions.slice(0, 3)
      },
      channels: ['in_app', 'email']
    });
  }

  private async notifyAnalysisFailed(userId: string, error: Error): Promise<void> {
    await this.notificationService.sendNotification({
      userId,
      type: 'resume_analysis_failed',
      title: 'Resume Analysis Failed',
      message: 'There was an error analyzing your resume. Please try uploading it again.',
      channels: ['in_app']
    });
  }

  private async triggerProfileUpdate(userId: string, analysis: ResumeAnalysis): Promise<void> {
    try {
      // Update user profile with resume data
      await this.updateUserProfileFromResume(userId, analysis);

      // Trigger matching with new profile data
      await this.matchingIntegration.triggerProfileUpdateMatching(userId);

    } catch (error) {
      this.logger.error('Error triggering profile update:', error);
    }
  }

  private async updateUserFromResume(userId: string, analysis: ResumeAnalysis): Promise<void> {
    // This would update the user's profile with extracted resume data
    // Implementation depends on your user profile structure
    this.logger.info(`Updating user profile from resume: ${userId}`);
  }
}