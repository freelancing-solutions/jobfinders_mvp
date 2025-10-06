/**
 * LinkedIn Profile Import Module
 *
 * Handles importing user profile data from LinkedIn for profile enrichment.
 * This is separate from the job board integration and focuses on user data.
 */

import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { textExtractor } from '@/lib/text-extractor';
import { keywordAnalyzer } from '@/lib/keyword-analyzer';

export interface LinkedInProfileImportConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

export interface LinkedInUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture: {
    displayImage: string;
  };
  vanityName?: string;
}

export interface LinkedInContactInfo {
  emailAddress?: string;
  phoneNumbers?: Array<{
    phoneNumber: string;
    phoneType: string;
  }>;
  twitterHandles?: Array<{
      name: string;
  }>;
  websites?: Array<{
    url: string;
    label?: string;
  }>;
}

export interface LinkedInPosition {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  isCurrentJob: boolean;
  description?: string;
  companyUrn: string;
}

export interface LinkedInEducation {
  id: string;
  schoolName: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  grade?: string;
  activities?: string[];
  description?: string;
  schoolUrn: string;
}

export interface LinkedInSkill {
  id: string;
  name: string;
}

export interface LinkedInCertification {
  id: string;
  name: string;
  authority?: string;
  startDate?: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  url?: string;
}

export interface LinkedInProject {
  id: string;
  title: string;
  description?: string;
  startDate?: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  url?: string;
}

export interface LinkedInLanguage {
  id: string;
  name: string;
  proficiency: string;
}

export interface LinkedInHonorsAward {
  id: string;
  title: string;
  issuer?: string;
  startDate?: {
    month: number;
    year: number;
  };
  description?: string;
}

export interface LinkedInRecommendation {
  id: string;
  recommendationText: string;
  recommender: {
    firstName: string;
    lastName: string;
  };
  recommendationType: string;
  startDate?: {
    month: number;
    year: number;
  };
}

export interface LinkedInCompleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  emailAddress?: string;
  phoneNumbers?: string[];
  websites?: string[];
  profilePicture?: string;
  profileUrl: string;
  positions: LinkedInPosition[];
  educations: LinkedInEducation[];
  skills: LinkedInSkill[];
  certifications: LinkedInCertification[];
  projects: LinkedInProject[];
  languages: LinkedInLanguage[];
  honors: LinkedInHonorsAward[];
  recommendations: LinkedInRecommendation[];
}

export interface ParsedLinkedInProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    headline?: string;
    summary?: string;
    location?: string;
    industry?: string;
    email?: string;
    phone?: string;
    website?: string;
    profilePicture?: string;
    profileUrl: string;
  };
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    isCurrentJob: boolean;
    description?: string;
    skills: string[];
    achievements: string[];
  }>;
  education: Array<{
    schoolName: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: Date;
    endDate?: Date;
    grade?: string;
    activities?: string[];
    description?: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuingOrganization?: string;
    issueDate?: Date;
    expirationDate?: Date;
    credentialUrl?: string;
  }>;
  projects: Array<{
    title: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    url?: string;
    skills: string[];
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  honors: Array<{
    title: string;
    issuer?: string;
    date?: Date;
    description?: string;
  }>;
  recommendations: Array<{
    text: string;
    recommender: string;
    date?: Date;
    relationship?: string;
  }>;
}

class LinkedInProfileImport {
  private config: LinkedInProfileImportConfig;
  private baseUrl = 'https://api.linkedin.com/v2';

  constructor(config: LinkedInProfileImportConfig) {
    this.config = config;
  }

  /**
   * Get LinkedIn OAuth authorization URL for profile import
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state || '',
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<LinkedInTokenResponse> {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`LinkedIn token exchange failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error exchanging LinkedIn code for token', error);
      throw error;
    }
  }

  /**
   * Get complete LinkedIn profile data
   */
  async getCompleteProfile(accessToken: string): Promise<ParsedLinkedInProfile> {
    try {
      const cacheKey = `linkedin_complete_profile:${this.hashToken(accessToken)}`;

      return cache.wrap(cacheKey, async () => {
        const [
          profile,
          contactInfo,
          positions,
          educations,
          skills,
          certifications,
          projects,
          languages,
          honors,
          recommendations
        ] = await Promise.all([
          this.getProfile(accessToken),
          this.getContactInfo(accessToken),
          this.getPositions(accessToken),
          this.getEducations(accessToken),
          this.getSkills(accessToken),
          this.getCertifications(accessToken),
          this.getProjects(accessToken),
          this.getLanguages(accessToken),
          this.getHonors(accessToken),
          this.getRecommendations(accessToken),
        ]);

        return this.parseLinkedInData({
          profile,
          contactInfo,
          positions,
          educations,
          skills,
          certifications,
          projects,
          languages,
          honors,
          recommendations,
        });
      }, 3600); // Cache for 1 hour
    } catch (error) {
      logger.error('Error fetching complete LinkedIn profile', error);
      throw error;
    }
  }

  /**
   * Get basic user profile
   */
  private async getProfile(accessToken: string): Promise<LinkedInUserProfile> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:(${encodeURIComponent('id,firstName,lastName,profilePicture(displayImage~),vanityName')})`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn profile fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching LinkedIn profile', error);
      throw error;
    }
  }

  /**
   * Get contact information
   */
  private async getContactInfo(accessToken: string): Promise<LinkedInContactInfo> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('emailAddress,phoneNumbers,twitterHandles,websites')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn contact info fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching LinkedIn contact info', error);
      return {};
    }
  }

  /**
   * Get work positions
   */
  private async getPositions(accessToken: string): Promise<LinkedInPosition[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('positions')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn positions fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn positions', error);
      return [];
    }
  }

  /**
   * Get education history
   */
  private async getEducations(accessToken: string): Promise<LinkedInEducation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('educations')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn educations fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn educations', error);
      return [];
    }
  }

  /**
   * Get skills
   */
  private async getSkills(accessToken: string): Promise<LinkedInSkill[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('skills')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn skills fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn skills', error);
      return [];
    }
  }

  /**
   * Get certifications
   */
  private async getCertifications(accessToken: string): Promise<LinkedInCertification[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('certifications')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn certifications fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn certifications', error);
      return [];
    }
  }

  /**
   * Get projects
   */
  private async getProjects(accessToken: string): Promise<LinkedInProject[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('projects')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn projects fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn projects', error);
      return [];
    }
  }

  /**
   * Get languages
   */
  private async getLanguages(accessToken: string): Promise<LinkedInLanguage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('languages')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn languages fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn languages', error);
      return [];
    }
  }

  /**
   * Get honors and awards
   */
  private async getHonors(accessToken: string): Promise<LinkedInHonorsAward[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('honors')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn honors fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn honors', error);
      return [];
    }
  }

  /**
   * Get recommendations
   */
  private async getRecommendations(accessToken: string): Promise<LinkedInRecommendation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:${encodeURIComponent('recommendations')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn recommendations fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Error fetching LinkedIn recommendations', error);
      return [];
    }
  }

  /**
   * Parse LinkedIn data into standardized format
   */
  private parseLinkedInData(data: {
    profile: LinkedInUserProfile;
    contactInfo: LinkedInContactInfo;
    positions: LinkedInPosition[];
    educations: LinkedInEducation[];
    skills: LinkedInSkill[];
    certifications: LinkedInCertification[];
    projects: LinkedInProject[];
    languages: LinkedInLanguage[];
    honors: LinkedInHonorsAward[];
    recommendations: LinkedInRecommendation[];
  }): ParsedLinkedInProfile {
    const { profile, contactInfo, positions, educations, skills, certifications, projects, languages, honors, recommendations } = data;

    // Build profile URL
    const profileUrl = profile.vanityName
      ? `https://www.linkedin.com/in/${profile.vanityName}`
      : `https://www.linkedin.com/profile/view?id=${profile.id}`;

    return {
      personalInfo: {
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        headline: undefined, // Would need additional API call
        summary: undefined, // Would need additional API call
        location: undefined, // Would need additional API call
        industry: undefined, // Would need additional API call
        email: contactInfo.emailAddress,
        phone: contactInfo.phoneNumbers?.[0]?.phoneNumber,
        website: contactInfo.websites?.[0]?.url,
        profilePicture: profile.profilePicture?.displayImage,
        profileUrl,
      },
      experience: positions.map(pos => ({
        title: pos.title,
        company: pos.company,
        location: pos.location,
        startDate: new Date(pos.startDate.year, pos.startDate.month - 1),
        endDate: pos.endDate ? new Date(pos.endDate.year, pos.endDate.month - 1) : undefined,
        isCurrentJob: !pos.endDate,
        description: pos.description,
        skills: this.extractSkillsFromText(pos.description || ''),
        achievements: this.extractAchievements(pos.description || ''),
      })),
      education: educations.map(edu => ({
        schoolName: edu.schoolName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate ? new Date(edu.startDate.year, edu.startDate.month - 1) : undefined,
        endDate: edu.endDate ? new Date(edu.endDate.year, edu.endDate.month - 1) : undefined,
        grade: edu.grade,
        activities: edu.activities,
        description: edu.description,
      })),
      skills: skills.map(skill => skill.name),
      certifications: certifications.map(cert => ({
        name: cert.name,
        issuingOrganization: cert.authority,
        issueDate: cert.startDate ? new Date(cert.startDate.year, cert.startDate.month - 1) : undefined,
        expirationDate: cert.endDate ? new Date(cert.endDate.year, cert.endDate.month - 1) : undefined,
        credentialUrl: cert.url,
      })),
      projects: projects.map(project => ({
        title: project.title,
        description: project.description,
        startDate: project.startDate ? new Date(project.startDate.year, project.startDate.month - 1) : undefined,
        endDate: project.endDate ? new Date(project.endDate.year, project.endDate.month - 1) : undefined,
        url: project.url,
        skills: this.extractSkillsFromText(project.description || ''),
      })),
      languages: languages.map(lang => ({
        name: lang.name,
        proficiency: lang.proficiency,
      })),
      honors: honors.map(honor => ({
        title: honor.title,
        issuer: honor.issuer,
        date: honor.startDate ? new Date(honor.startDate.year, honor.startDate.month - 1) : undefined,
        description: honor.description,
      })),
      recommendations: recommendations.map(rec => ({
        text: rec.recommendationText,
        recommender: `${rec.recommender.firstName} ${rec.recommender.lastName}`,
        date: rec.startDate ? new Date(rec.startDate.year, rec.startDate.month - 1) : undefined,
        relationship: rec.recommendationType,
      })),
    };
  }

  /**
   * Extract skills from text using keyword analysis
   */
  private extractSkillsFromText(text: string): string[] {
    if (!text) return [];

    try {
      // Use keyword analyzer to extract skills
      const keywords = keywordAnalyzer.extractKeywords(text, {
        categories: ['skills', 'technologies'],
        minConfidence: 0.6,
      });

      return keywords.map(k => k.text);
    } catch (error) {
      logger.error('Error extracting skills from text', error);
      return [];
    }
  }

  /**
   * Extract achievements from text
   */
  private extractAchievements(text: string): string[] {
    if (!text) return [];

    const achievements: string[] = [];

    // Look for common achievement patterns
    const patterns = [
      /increased\s+.*?by\s+(\d+%|\d+(?:,\d{3})*)/gi,
      /reduced\s+.*?by\s+(\d+%|\d+(?:,\d{3})*)/gi,
      /managed\s+.*?(\d+)\s+(people|team|member)s?/gi,
      /led\s+.*?(\d+)\s+(people|team|member)s?/gi,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(million|billion|k)/gi,
      /(\d+)%\s+(improvement|growth|increase|reduction)/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        achievements.push(...matches);
      }
    });

    // Extract sentences with action verbs
    const sentences = text.split(/[.!?]+/);
    const actionVerbs = ['developed', 'created', 'implemented', 'launched', 'achieved', 'improved', 'optimized', 'led', 'managed', 'coordinated'];

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed && actionVerbs.some(verb => trimmed.toLowerCase().includes(verb))) {
        achievements.push(trimmed);
      }
    });

    return achievements.filter((achievement, index, arr) =>
      arr.indexOf(achievement) === index && achievement.length > 10
    );
  }

  /**
   * Validate LinkedIn access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      logger.error('Error validating LinkedIn token', error);
      return false;
    }
  }

  /**
   * Get profile enrichment suggestions
   */
  async getEnrichmentSuggestions(profile: ParsedLinkedInProfile): Promise<{
    missingSkills: string[];
    experienceEnhancements: Array<{
      positionIndex: number;
      suggestions: string[];
    }>;
    educationEnhancements: Array<{
      educationIndex: number;
      suggestions: string[];
    }>;
    profileImprovements: string[];
  }> {
    const missingSkills: string[] = [];
    const experienceEnhancements: Array<{ positionIndex: number; suggestions: string[] }> = [];
    const educationEnhancements: Array<{ educationIndex: number; suggestions: string[] }> = [];
    const profileImprovements: string[] = [];

    // Analyze skills
    if (profile.skills.length < 10) {
      missingSkills.push('Consider adding more skills to your profile');
    }

    // Analyze experience
    profile.experience.forEach((exp, index) => {
      const suggestions: string[] = [];

      if (!exp.description || exp.description.length < 100) {
        suggestions.push('Add more detailed descriptions of your responsibilities');
      }

      if (exp.achievements.length === 0) {
        suggestions.push('Include specific achievements and metrics');
      }

      if (exp.skills.length < 5) {
        suggestions.push('List relevant skills used in this role');
      }

      if (suggestions.length > 0) {
        experienceEnhancements.push({ positionIndex: index, suggestions });
      }
    });

    // Analyze education
    profile.education.forEach((edu, index) => {
      const suggestions: string[] = [];

      if (!edu.fieldOfStudy) {
        suggestions.push('Add your field of study');
      }

      if (!edu.activities || edu.activities.length === 0) {
        suggestions.push('Include relevant activities, clubs, or organizations');
      }

      if (suggestions.length > 0) {
        educationEnhancements.push({ educationIndex: index, suggestions });
      }
    });

    // Profile improvements
    if (!profile.personalInfo.headline) {
      profileImprovements.push('Add a professional headline to your profile');
    }

    if (!profile.personalInfo.summary || profile.personalInfo.summary.length < 150) {
      profileImprovements.push('Write a compelling summary about yourself');
    }

    if (!profile.personalInfo.location) {
      profileImprovements.push('Add your location to help with local opportunities');
    }

    if (profile.projects.length === 0) {
      profileImprovements.push('Showcase your projects to demonstrate your skills');
    }

    if (profile.recommendations.length < 3) {
      profileImprovements.push('Request recommendations from colleagues and managers');
    }

    return {
      missingSkills,
      experienceEnhancements,
      educationEnhancements,
      profileImprovements,
    };
  }

  /**
   * Helper method to hash token for caching
   */
  private hashToken(token: string): string {
    // Simple hash for cache key - in production, use proper hashing
    return btoa(token.substring(0, 32)).replace(/[^a-zA-Z0-9]/g, '');
  }
}

export { LinkedInProfileImport };
export type {
  LinkedInProfileImportConfig,
  LinkedInTokenResponse,
  LinkedInUserProfile,
  LinkedInContactInfo,
  LinkedInPosition,
  LinkedInEducation,
  LinkedInSkill,
  LinkedInCertification,
  LinkedInProject,
  LinkedInLanguage,
  LinkedInHonorsAward,
  LinkedInRecommendation,
  LinkedInCompleteProfile,
  ParsedLinkedInProfile,
};