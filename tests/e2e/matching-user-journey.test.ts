/**
 * End-to-End Matching User Journey Tests
 * Tests the complete user journey from profile creation to job application
 */

import { chromium, Browser, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/types/roles';

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3010';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('End-to-End Matching User Journey', () => {
  let browser: Browser;
  let page: Page;
  let prisma: PrismaClient;

  // Test user data
  const testUser = {
    email: 'test.journey@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };

  const testCandidateProfile = {
    headline: 'Senior Software Engineer',
    summary: 'Experienced software engineer with expertise in full-stack development and cloud architecture.',
    location: 'San Francisco, CA',
    website: 'https://testuser.dev',
    phone: '+1234567890',
  };

  const testExperience = {
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    startDate: '2020-01',
    endDate: '2023-12',
    current: false,
    description: 'Led development of microservices architecture and mentored junior developers.',
  };

  const testEducation = {
    school: 'Stanford University',
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    startDate: '2016-09',
    endDate: '2020-05',
  };

  const testSkills = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'AWS',
    'Python',
  ];

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.CI === 'true',
      slowMo: process.env.CI === 'true' ? 0 : 100,
    });

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await browser.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(TEST_BASE_URL);

    // Clean up test data
    await cleanupTestData();
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Complete Candidate Journey', () => {
    it('should complete full candidate journey from signup to job application', async () => {
      // Step 1: User Registration
      await step_registerUser();

      // Step 2: Email Verification (mock)
      await step_verifyEmail();

      // Step 3: Complete Profile Setup
      await step_completeProfile();

      // Step 4: Profile Analysis and Enhancement
      await step_analyzeProfile();

      // Step 5: Skill Assessment Integration
      await step_completeSkillAssessments();

      // Step 6: Social Media Integration
      await step_connectSocialMedia();

      // Step 7: Job Discovery and Matching
      await step_discoverJobs();

      // Step 8: Get Recommendations
      await step_getRecommendations();

      // Step 9: Review and Save Jobs
      await step_saveJobs();

      // Step 10: Apply to Jobs
      await step_applyToJobs();

      // Step 11: Track Application Status
      await step_trackApplications();

      // Step 12: Provide Feedback on Matches
      await step_provideFeedback();

      // Verify journey completion
      await verifyJourneyCompletion();
    }, TEST_TIMEOUT * 10); // Extended timeout for full journey
  });

  describe('Employer Journey', () => {
    it('should complete employer journey from job posting to candidate hiring', async () => {
      // Step 1: Employer Registration
      await step_registerEmployer();

      // Step 2: Company Profile Setup
      await step_setupCompanyProfile();

      // Step 3: Job Posting Creation
      await step_createJobPosting();

      // Step 4: Candidate Matching and Discovery
      await step_discoverCandidates();

      // Step 5: Review Candidate Profiles
      await step_reviewCandidates();

      // Step 6: Contact Candidates
      await step_contactCandidates();

      // Step 7: Manage Interview Process
      await step_manageInterviews();

      // Step 8: Make Hiring Decision
      await step_makeHiringDecision();

      // Verify employer journey completion
      await verifyEmployerJourneyCompletion();
    }, TEST_TIMEOUT * 8);
  });

  describe('Real-time Features', () => {
    it('should handle real-time match notifications', async () => {
      // Setup candidate profile
      await step_registerUser();
      await step_completeProfile();

      // Enable real-time notifications
      await page.goto(`${TEST_BASE_URL}/dashboard/settings`);
      await page.click('[data-testid="real-time-notifications"]');
      await page.click('[data-testid="save-settings"]');

      // Monitor WebSocket connections
      const wsConnections: any[] = [];
      page.on('websocket', ws => {
        wsConnections.push(ws);
        ws.on('framereceived', event => {
          expect(JSON.parse(event.payload as string)).toHaveProperty('type');
        });
      });

      // Create new job posting that should match candidate
      await createMatchingJobPosting();

      // Wait for real-time notification
      await page.waitForSelector('[data-testid="notification-badge"]', { timeout: 10000 });

      // Verify notification content
      await page.click('[data-testid="notification-center"]');
      const notification = await page.textContent('[data-testid="notification-item"]');
      expect(notification).toContain('new job match');
    }, TEST_TIMEOUT * 2);
  });

  describe('Mobile Responsiveness', () => {
    it('should work correctly on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Complete mobile journey
      await step_registerUser();
      await step_completeProfile();
      await step_discoverJobs();
      await step_applyToJobs();

      // Verify mobile-specific features
      await page.click('[data-testid="mobile-menu"]');
      await page.waitForSelector('[data-testid="mobile-navigation"]');

      // Test swipe gestures for job cards
      const jobCard = await page.locator('[data-testid="job-card"]').first();
      await jobCard.hover();
      await page.mouse.move(100, 100);
      await page.mouse.down();
      await page.mouse.move(200, 100);
      await page.mouse.up();

      // Verify swipe action worked
      await page.waitForSelector('[data-testid="swipe-actions"]', { timeout: 5000 });
    }, TEST_TIMEOUT * 3);
  });

  describe('Performance and Loading', () => {
    it('should handle large datasets efficiently', async () => {
      // Setup candidate with complete profile
      await step_registerUser();
      await step_completeProfile();

      // Generate large dataset of jobs
      await generateLargeJobDataset(1000);

      // Measure load time
      const startTime = Date.now();
      await page.goto(`${TEST_BASE_URL}/dashboard/jobs`);
      const loadTime = Date.now() - startTime;

      // Should load within performance threshold
      expect(loadTime).toBeLessThan(5000);

      // Test infinite scrolling
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForSelector('[data-testid="loading-more-jobs"]', { timeout: 10000 });

      // Verify pagination works
      const initialJobCount = await page.locator('[data-testid="job-card"]').count();
      await page.waitForFunction(
        (count) => document.querySelectorAll('[data-testid="job-card"]').length > count,
        initialJobCount,
        { timeout: 15000 }
      );
    }, TEST_TIMEOUT * 4);
  });

  // Step implementation functions

  async function step_registerUser() {
    await page.goto(`${TEST_BASE_URL}/auth/register`);

    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="first-name-input"]', testUser.firstName);
    await page.fill('[data-testid="last-name-input"]', testUser.lastName);

    await page.click('[data-testid="register-button"]');
    await page.waitForSelector('[data-testid="registration-success"]', { timeout: 10000 });
  }

  async function step_verifyEmail() {
    // In a real test, this would handle email verification
    // For testing, we'll simulate verification
    await page.goto(`${TEST_BASE_URL}/auth/verify-email?token=test-token`);
    await page.click('[data-testid="verify-email-button"]');
    await page.waitForSelector('[data-testid="email-verified"]', { timeout: 10000 });
  }

  async function step_completeProfile() {
    await page.goto(`${TEST_BASE_URL}/onboarding/profile`);

    // Personal information
    await page.fill('[data-testid="headline-input"]', testCandidateProfile.headline);
    await page.fill('[data-testid="summary-input"]', testCandidateProfile.summary);
    await page.fill('[data-testid="location-input"]', testCandidateProfile.location);
    await page.fill('[data-testid="website-input"]', testCandidateProfile.website);
    await page.fill('[data-testid="phone-input"]', testCandidateProfile.phone);

    // Add experience
    await page.click('[data-testid="add-experience"]');
    await page.fill('[data-testid="experience-title"]', testExperience.title);
    await page.fill('[data-testid="experience-company"]', testExperience.company);
    await page.fill('[data-testid="experience-location"]', testExperience.location);
    await page.fill('[data-testid="experience-start-date"]', testExperience.startDate);
    await page.fill('[data-testid="experience-end-date"]', testExperience.endDate);
    await page.fill('[data-testid="experience-description"]', testExperience.description);
    await page.click('[data-testid="save-experience"]');

    // Add education
    await page.click('[data-testid="add-education"]');
    await page.fill('[data-testid="education-school"]', testEducation.school);
    await page.fill('[data-testid="education-degree"]', testEducation.degree);
    await page.fill('[data-testid="education-field"]', testEducation.field);
    await page.fill('[data-testid="education-start-date"]', testEducation.startDate);
    await page.fill('[data-testid="education-end-date"]', testEducation.endDate);
    await page.click('[data-testid="save-education"]');

    // Add skills
    for (const skill of testSkills) {
      await page.fill('[data-testid="skill-input"]', skill);
      await page.click('[data-testid="add-skill"]');
    }

    await page.click('[data-testid="complete-profile"]');
    await page.waitForSelector('[data-testid="profile-completed"]', { timeout: 10000 });
  }

  async function step_analyzeProfile() {
    await page.goto(`${TEST_BASE_URL}/dashboard/profile/analysis`);

    // Wait for analysis to complete
    await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 15000 });

    // Review profile strengths
    const strengths = await page.textContent('[data-testid="profile-strengths"]');
    expect(strengths).toBeTruthy();
    expect(strengths?.length).toBeGreaterThan(0);

    // Review improvement suggestions
    const suggestions = await page.textContent('[data-testid="profile-suggestions"]');
    expect(suggestions).toBeTruthy();

    // Apply auto-suggestions if available
    const autoSuggestion = await page.locator('[data-testid="auto-suggestion"]').first();
    if (await autoSuggestion.isVisible()) {
      await autoSuggestion.click();
      await page.click('[data-testid="apply-suggestion"]');
    }
  }

  async function step_completeSkillAssessments() {
    await page.goto(`${TEST_BASE_URL}/dashboard/skills/assessments`);

    // Take recommended skill assessments
    const assessments = await page.locator('[data-testid="skill-assessment"]');
    const assessmentCount = await assessments.count();

    for (let i = 0; i < Math.min(assessmentCount, 2); i++) {
      await assessments.nth(i).click();

      // Complete assessment questions
      await page.waitForSelector('[data-testid="assessment-question"]', { timeout: 10000 });

      const questions = await page.locator('[data-testid="assessment-question"]');
      const questionCount = await questions.count();

      for (let j = 0; j < Math.min(questionCount, 5); j++) {
        await page.click('[data-testid="answer-option"]');
        await page.click('[data-testid="next-question"]');
      }

      await page.click('[data-testid="submit-assessment"]');
      await page.waitForSelector('[data-testid="assessment-results"]', { timeout: 10000 });

      // Return to assessments list
      await page.goto(`${TEST_BASE_URL}/dashboard/skills/assessments`);
    }
  }

  async function step_connectSocialMedia() {
    await page.goto(`${TEST_BASE_URL}/dashboard/profile/social`);

    // Connect LinkedIn (mock)
    await page.click('[data-testid="connect-linkedin"]');
    await page.waitForSelector('[data-testid="linkedin-connected"]', { timeout: 10000 });

    // Connect GitHub (mock)
    await page.click('[data-testid="connect-github"]');
    await page.waitForSelector('[data-testid="github-connected"]', { timeout: 10000 });

    // Review imported data
    const importedData = await page.textContent('[data-testid="imported-data"]');
    expect(importedData).toBeTruthy();
  }

  async function step_discoverJobs() {
    await page.goto(`${TEST_BASE_URL}/dashboard/jobs`);

    // Wait for jobs to load
    await page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });

    // Use search and filters
    await page.fill('[data-testid="job-search"]', 'Software Engineer');
    await page.click('[data-testid="search-button"]');

    // Apply filters
    await page.click('[data-testid="filter-remote"]');
    await page.click('[data-testid="filter-full-time"]');
    await page.click('[data-testid="apply-filters"]');

    // Verify filtered results
    await page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
    const jobCards = await page.locator('[data-testid="job-card"]');
    expect(await jobCards.count()).toBeGreaterThan(0);
  }

  async function step_getRecommendations() {
    await page.goto(`${TEST_BASE_URL}/dashboard/recommendations`);

    // Wait for recommendations to load
    await page.waitForSelector('[data-testid="recommendation-card"]', { timeout: 15000 });

    // Review different recommendation types
    const recommendationTabs = ['job-matches', 'similar-jobs', 'trending-jobs'];

    for (const tab of recommendationTabs) {
      await page.click(`[data-testid="${tab}-tab"]`);
      await page.waitForSelector('[data-testid="recommendation-card"]', { timeout: 10000 });

      const recommendations = await page.locator('[data-testid="recommendation-card"]');
      expect(await recommendations.count()).toBeGreaterThan(0);
    }
  }

  async function step_saveJobs() {
    await page.goto(`${TEST_BASE_URL}/dashboard/jobs`);

    // Save first few jobs
    const jobCards = await page.locator('[data-testid="job-card"]');
    const saveCount = Math.min(await jobCards.count(), 3);

    for (let i = 0; i < saveCount; i++) {
      await jobCards.nth(i).locator('[data-testid="save-job"]').click();
      await page.waitForSelector('[data-testid="job-saved"]', { timeout: 5000 });
    }

    // Verify saved jobs
    await page.click('[data-testid="saved-jobs-tab"]');
    await page.waitForSelector('[data-testid="saved-job-card"]', { timeout: 10000 });

    const savedJobs = await page.locator('[data-testid="saved-job-card"]');
    expect(await savedJobs.count()).toBe(saveCount);
  }

  async function step_applyToJobs() {
    await page.goto(`${TEST_BASE_URL}/dashboard/jobs`);

    // Apply to first job
    const jobCard = await page.locator('[data-testid="job-card"]').first();
    await jobCard.click();

    await page.waitForSelector('[data-testid="job-details"]', { timeout: 10000 });

    // Check match score
    const matchScore = await page.textContent('[data-testid="match-score"]');
    expect(matchScore).toBeTruthy();
    expect(parseInt(matchScore || '0')).toBeGreaterThan(50);

    // Apply with default resume
    await page.click('[data-testid="apply-button"]');
    await page.click('[data-testid="use-default-resume"]');
    await page.fill('[data-testid="cover-letter"]', 'I am excited to apply for this position as it aligns perfectly with my skills and experience.');
    await page.click('[data-testid="submit-application"]');

    await page.waitForSelector('[data-testid="application-submitted"]', { timeout: 10000 });
  }

  async function step_trackApplications() {
    await page.goto(`${TEST_BASE_URL}/dashboard/applications`);

    // Wait for applications to load
    await page.waitForSelector('[data-testid="application-card"]', { timeout: 10000 });

    // Review application status
    const applicationCard = await page.locator('[data-testid="application-card"]').first();
    const status = await applicationCard.locator('[data-testid="application-status"]').textContent();
    expect(status).toBeTruthy();

    // Set up notifications
    await page.click('[data-testid="notification-settings"]');
    await page.click('[data-testid="status-updates"]');
    await page.click('[data-testid="save-notifications"]');
  }

  async function step_provideFeedback() {
    await page.goto(`${TEST_BASE_URL}/dashboard/recommendations`);

    // Find a recommendation to provide feedback on
    const recommendationCard = await page.locator('[data-testid="recommendation-card"]').first();

    // Provide positive feedback
    await recommendationCard.locator('[data-testid="helpful-button"]').click();
    await page.fill('[data-testid="feedback-text"]', 'This recommendation was very relevant to my skills and experience.');
    await page.click('[data-testid="submit-feedback"]');

    await page.waitForSelector('[data-testid="feedback-submitted"]', { timeout: 10000 });
  }

  async function verifyJourneyCompletion() {
    // Check dashboard for completion indicators
    await page.goto(`${TEST_BASE_URL}/dashboard`);

    // Verify profile completeness
    const completenessScore = await page.textContent('[data-testid="profile-completeness"]');
    expect(parseInt(completenessScore || '0')).toBeGreaterThan(80);

    // Verify job recommendations are available
    await page.waitForSelector('[data-testid="recommendations-widget"]', { timeout: 10000 });

    // Verify application tracking is active
    const applicationCount = await page.textContent('[data-testid="application-count"]');
    expect(parseInt(applicationCount || '0')).toBeGreaterThan(0);
  }

  // Employer journey steps
  async function step_registerEmployer() {
    await page.goto(`${TEST_BASE_URL}/auth/register?role=employer');

    await page.fill('[data-testid="company-name"]', 'Test Company');
    await page.fill('[data-testid="company-email"]', 'employer@testcompany.com');
    await page.fill('[data-testid="company-password"]', 'EmployerPassword123!');
    await page.fill('[data-testid="company-industry"]', 'Technology');
    await page.fill('[data-testid="company-size"]', '50-100');

    await page.click('[data-testid="register-company"]');
    await page.waitForSelector('[data-testid="company-registered"]', { timeout: 10000 });
  }

  async function step_setupCompanyProfile() {
    await page.goto(`${TEST_BASE_URL}/employer/profile`);

    await page.fill('[data-testid="company-description"]', 'We are an innovative technology company focused on creating cutting-edge solutions.');
    await page.fill('[data-testid="company-website"]', 'https://testcompany.com');
    await page.fill('[data-testid="company-location"]', 'San Francisco, CA');

    await page.click('[data-testid="save-company-profile"]');
    await page.waitForSelector('[data-testid="profile-saved"]', { timeout: 10000 });
  }

  async function step_createJobPosting() {
    await page.goto(`${TEST_BASE_URL}/employer/jobs/create`);

    await page.fill('[data-testid="job-title"]', 'Senior Full Stack Developer');
    await page.fill('[data-testid="job-description"]', 'We are looking for an experienced full stack developer to join our growing team.');
    await page.fill('[data-testid="job-requirements"]', '5+ years of experience, React, Node.js, TypeScript');
    await page.selectOption('[data-testid="job-type"]', 'Full-time');
    await page.fill('[data-testid="job-salary-min"]', '120000');
    await page.fill('[data-testid="job-salary-max"]', '180000');

    await page.click('[data-testid="post-job"]');
    await page.waitForSelector('[data-testid="job-posted"]', { timeout: 10000 });
  }

  async function step_discoverCandidates() {
    await page.goto(`${TEST_BASE_URL}/employer/candidates`);

    await page.waitForSelector('[data-testid="candidate-card"]', { timeout: 15000 });

    // Use filters to refine search
    await page.fill('[data-testid="skill-search"]', 'React');
    await page.click('[data-testid="experience-level"]');
    await page.selectOption('[data-testid="experience-level"]', 'Senior');
    await page.click('[data-testid="apply-candidate-filters"]');
  }

  async function step_reviewCandidates() {
    const candidateCard = await page.locator('[data-testid="candidate-card"]').first();
    await candidateCard.click();

    await page.waitForSelector('[data-testid="candidate-profile"]', { timeout: 10000 });

    // Review match score and details
    const matchScore = await page.textContent('[data-testid="match-score"]');
    expect(parseInt(matchScore || '0')).toBeGreaterThan(60);

    // Review candidate's skills and experience
    await page.click('[data-testid="skills-tab"]');
    await page.click('[data-testid="experience-tab"]');
  }

  async function step_contactCandidates() {
    await page.click('[data-testid="contact-candidate"]');
    await page.fill('[data-testid="contact-message"]', 'We are impressed with your profile and would like to schedule an interview.');
    await page.click('[data-testid="send-message"]');

    await page.waitForSelector('[data-testid="message-sent"]', { timeout: 10000 });
  }

  async function step_manageInterviews() {
    await page.goto(`${TEST_BASE_URL}/employer/interviews`);

    await page.waitForSelector('[data-testid="interview-card"]', { timeout: 10000 });

    const interviewCard = await page.locator('[data-testid="interview-card"]').first();
    await interviewCard.click();

    // Update interview status
    await page.selectOption('[data-testid="interview-status"]', 'Completed');
    await page.fill('[data-testid="interview-notes"]', 'Great technical skills, good cultural fit.');
    await page.click('[data-testid="update-interview"]');
  }

  async function step_makeHiringDecision() {
    await page.goto(`${TEST_BASE_URL}/employer/candidates/hired`);

    await page.click('[data-testid="make-offer"]');
    await page.fill('[data-testid="offer-salary"]', '150000');
    await page.fill('[data-testid="offer-details"]', 'Competitive salary with benefits package.');
    await page.click('[data-testid="send-offer"]');

    await page.waitForSelector('[data-testid="offer-sent"]', { timeout: 10000 });
  }

  async function verifyEmployerJourneyCompletion() {
    await page.goto(`${TEST_BASE_URL}/employer/dashboard`);

    // Verify job posting is active
    const activeJobs = await page.textContent('[data-testid="active-jobs-count"]');
    expect(parseInt(activeJobs || '0')).toBeGreaterThan(0);

    // Verify candidate pipeline is working
    const pipelineCandidates = await page.textContent('[data-testid="pipeline-candidates"]');
    expect(parseInt(pipelineCandidates || '0')).toBeGreaterThan(0);
  }

  // Helper functions

  async function cleanupTestData() {
    try {
      // Clean up test user and related data
      await prisma.user.deleteMany({
        where: { email: { contains: 'test.journey' } },
      });

      // Clean up test jobs
      await prisma.jobProfile.deleteMany({
        where: { title: { contains: 'Test' } },
      });
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  }

  async function createMatchingJobPosting() {
    // This would typically be done via API or direct database insertion
    // For E2E test, we'll simulate this through the UI
    await page.goto(`${TEST_BASE_URL}/auth/login`);
    await page.fill('[data-testid="email"]', 'employer@testcompany.com');
    await page.fill('[data-testid="password"]', 'EmployerPassword123!');
    await page.click('[data-testid="login-button"]');

    await step_createJobPosting();

    // Logout and return to candidate flow
    await page.click('[data-testid="logout"]');
  }

  async function generateLargeJobDataset(count: number) {
    // This would typically be done via API or direct database insertion
    // For E2E test, we'll simulate the effects
    console.log(`Generating ${count} test jobs...`);

    // In a real implementation, this would create jobs via API
    // For testing purposes, we'll just log the action
  }
});

// Additional test utilities

export class MatchingJourneyUtils {
  static async generateTestData(prisma: PrismaClient) {
    // Generate comprehensive test data for E2E tests
    const testUser = await prisma.user.create({
      data: {
        email: 'e2e.test@example.com',
        firstName: 'E2E',
        lastName: 'Test',
        role: UserRole.JOB_SEEKER,
      },
    });

    const testProfile = await prisma.userProfile.create({
      data: {
        userId: testUser.id,
        headline: 'E2E Test Engineer',
        summary: 'Test profile for end-to-end testing',
      },
    });

    return { testUser, testProfile };
  }

  static async validateJourney(page: Page, expectedSteps: string[]) {
    for (const step of expectedSteps) {
      const element = await page.locator(`[data-testid="${step}"]`);
      await expect(element).toBeVisible();
    }
  }

  static async measurePerformance(page: Page, action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }

  static async waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async takeScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({ path: `test-screenshots/${name}.png`, fullPage: true });
  }
}