import { OpenRouterClient } from '@/lib/openrouter';
import type { Skill, SkillCategory, SkillLevel } from '@/types/profiles';

export interface SkillExtractionOptions {
  includeSoftSkills?: boolean;
  includeDomainSkills?: boolean;
  includeTools?: boolean;
  minConfidence?: number;
  maxSkills?: number;
  industry?: string;
  experienceLevel?: string;
}

export interface SkillExtractionResult {
  skills: Skill[];
  confidence: number;
  source: string;
  extractedAt: Date;
  processingTime: number;
}

export interface SkillMatch {
  skill: string;
  category: SkillCategory;
  level: SkillLevel;
  confidence: number;
  context: string;
  variations: string[];
}

export class SkillsExtractor {
  private ai: OpenRouterClient;
  private skillDatabase: Map<string, SkillMatch>;
  private industryKeywords: Map<string, string[]>;

  constructor() {
    this.ai = new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY!,
      models: {
        primary: 'claude-2',
        fallback: 'gpt-3.5-turbo',
      },
      endpoints: {
        chat: 'https://api.openrouter.ai/api/v1/chat/completions',
      },
      rateLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },
    });

    this.skillDatabase = new Map();
    this.industryKeywords = new Map();
    this.initializeSkillDatabase();
  }

  /**
   * Extract skills from text using AI analysis
   */
  async extractSkills(
    text: string,
    options: SkillExtractionOptions = {}
  ): Promise<SkillExtractionResult> {
    const startTime = Date.now();

    try {
      const defaultOptions: SkillExtractionOptions = {
        includeSoftSkills: true,
        includeDomainSkills: true,
        includeTools: true,
        minConfidence: 0.6,
        maxSkills: 50,
        ...options
      };

      // Pre-process text
      const processedText = this.preprocessText(text);

      // Extract skills using AI
      const aiSkills = await this.extractSkillsWithAI(processedText, defaultOptions);

      // Validate and enhance with database
      const validatedSkills = await this.validateAndEnhanceSkills(aiSkills, defaultOptions);

      // Filter by confidence and limit
      const filteredSkills = this.filterAndLimitSkills(validatedSkills, defaultOptions);

      const result: SkillExtractionResult = {
        skills: filteredSkills,
        confidence: this.calculateOverallConfidence(filteredSkills),
        source: 'ai_enhanced',
        extractedAt: new Date(),
        processingTime: Date.now() - startTime
      };

      return result;
    } catch (error) {
      console.error('Error extracting skills:', error);
      return {
        skills: [],
        confidence: 0,
        source: 'fallback',
        extractedAt: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract skills from resume/CV
   */
  async extractSkillsFromResume(resumeText: string): Promise<SkillExtractionResult> {
    const options: SkillExtractionOptions = {
      includeSoftSkills: true,
      includeDomainSkills: true,
      includeTools: true,
      minConfidence: 0.7,
      maxSkills: 30
    };

    return this.extractSkills(resumeText, options);
  }

  /**
   * Extract skills from job description
   */
  async extractSkillsFromJobDescription(jobText: string): Promise<SkillExtractionResult> {
    const options: SkillExtractionOptions = {
      includeSoftSkills: false, // Focus on hard skills for jobs
      includeDomainSkills: true,
      includeTools: true,
      minConfidence: 0.8,
      maxSkills: 20
    };

    return this.extractSkills(jobText, options);
  }

  /**
   * Extract skills from multiple text sources
   */
  async extractSkillsFromMultipleSources(
    sources: { text: string; weight?: number; type?: string }[]
  ): Promise<SkillExtractionResult> {
    const allSkills: Map<string, { skill: Skill; confidence: number; weight: number }> = new Map();

    for (const source of sources) {
      const weight = source.weight || 1;
      const options: SkillExtractionOptions = {
        includeSoftSkills: source.type !== 'job',
        includeDomainSkills: true,
        includeTools: true,
        minConfidence: 0.5,
        maxSkills: 50
      };

      const result = await this.extractSkills(source.text, options);

      for (const skill of result.skills) {
        const key = `${skill.name}_${skill.category}`;
        if (allSkills.has(key)) {
          const existing = allSkills.get(key)!;
          // Weighted average of confidence
          existing.confidence = (existing.confidence * existing.weight + result.confidence * weight) / (existing.weight + weight);
          existing.weight += weight;
        } else {
          allSkills.set(key, { skill, confidence: result.confidence, weight });
        }
      }
    }

    const combinedSkills = Array.from(allSkills.values())
      .map(({ skill }) => skill)
      .sort((a, b) => b.level.localeCompare(a.level)) // Sort by skill level
      .slice(0, 50);

    return {
      skills: combinedSkills,
      confidence: this.calculateOverallConfidence(combinedSkills),
      source: 'multi_source_combined',
      extractedAt: new Date(),
      processingTime: 0
    };
  }

  /**
   * Categorize skills automatically
   */
  categorizeSkill(skillName: string, context?: string): SkillCategory {
    const normalizedSkill = skillName.toLowerCase().trim();

    // Technical skills
    const technicalKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'html', 'css', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
      'git', 'github', 'gitlab', 'ci/cd', 'devops', 'linux', 'windows',
      'api', 'rest', 'graphql', 'microservices', 'backend', 'frontend',
      'mobile', 'ios', 'android', 'flutter', 'react native', 'swift',
      'kotlin', 'java', 'c#', '.net', 'php', 'ruby', 'rails', 'django',
      'flask', 'spring', 'laravel', 'express', 'nextjs', 'nuxtjs',
      'typescript', 'webpack', 'babel', 'eslint', 'prettier', 'sass'
    ];

    // Tools
    const toolKeywords = [
      'jira', 'confluence', 'slack', 'teams', 'zoom', 'office', 'excel',
      'powerpoint', 'word', 'outlook', 'google workspace', 'gmail',
      'calendar', 'drive', 'figma', 'sketch', 'photoshop', 'illustrator',
      'tableau', 'power bi', 'looker', 'google analytics', 'mixpanel',
      'segment', 'stripe', 'paypal', 'shopify', 'wordpress', 'magento',
      'salesforce', 'hubspot', 'marketo', 'mailchimp', 'constant contact',
      'trello', 'asana', 'monday', 'notion', 'airtable', 'slack'
    ];

    // Methodologies
    const methodologyKeywords = [
      'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'six sigma',
      'prince2', 'pmp', 'itil', 'devops', 'continuous integration',
      'continuous deployment', 'test driven development', 'behavior driven',
      'pair programming', 'code review', 'refactoring', 'design patterns'
    ];

    // Soft skills
    const softSkillKeywords = [
      'leadership', 'communication', 'teamwork', 'collaboration',
      'problem solving', 'critical thinking', 'creativity', 'innovation',
      'adaptability', 'flexibility', 'time management', 'organization',
      'project management', 'mentoring', 'coaching', 'presentation',
      'negotiation', 'conflict resolution', 'customer service', 'empathy'
    ];

    // Languages
    const languageKeywords = [
      'english', 'spanish', 'french', 'german', 'chinese', 'japanese',
      'korean', 'portuguese', 'russian', 'arabic', 'hindi', 'italian'
    ];

    // Check each category
    if (technicalKeywords.some(keyword => normalizedSkill.includes(keyword))) {
      return SkillCategory.TECHNICAL;
    }

    if (toolKeywords.some(keyword => normalizedSkill.includes(keyword))) {
      return SkillCategory.TOOL;
    }

    if (methodologyKeywords.some(keyword => normalizedSkill.includes(keyword))) {
      return SkillCategory.METHODOLOGY;
    }

    if (languageKeywords.some(keyword => normalizedSkill.includes(keyword))) {
      return SkillCategory.LANGUAGE;
    }

    if (softSkillKeywords.some(keyword => normalizedSkill.includes(keyword))) {
      return SkillCategory.SOFT_SKILL;
    }

    // Use context if provided
    if (context) {
      const contextLower = context.toLowerCase();
      if (contextLower.includes('programming') || contextLower.includes('development')) {
        return SkillCategory.TECHNICAL;
      }
      if (contextLower.includes('management') || contextLower.includes('leadership')) {
        return SkillCategory.SOFT_SKILL;
      }
      if (contextLower.includes('tool') || contextLower.includes('software')) {
        return SkillCategory.TOOL;
      }
    }

    // Default to domain skill
    return SkillCategory.DOMAIN;
  }

  /**
   * Determine skill level from context
   */
  determineSkillLevel(skillName: string, context: string): SkillLevel {
    const contextLower = context.toLowerCase();
    const skillLower = skillName.toLowerCase();

    // Expert indicators
    const expertIndicators = [
      'expert', 'master', 'senior', 'lead', 'principal', 'architect',
      'specialist', 'advanced', 'years of experience', 'proficient', 'fluent'
    ];

    // Advanced indicators
    const advancedIndicators = [
      'advanced', 'experienced', 'strong', 'deep', 'extensive',
      'multiple years', 'several years', 'highly skilled'
    ];

    // Intermediate indicators
    const intermediateIndicators = [
      'intermediate', 'moderate', 'some experience', 'familiar',
      'comfortable', 'working knowledge', 'practical'
    ];

    // Beginner indicators
    const beginnerIndicators = [
      'beginner', 'novice', 'entry', 'junior', 'basic', 'fundamental',
      'learning', 'introductory', 'some exposure'
    ];

    // Check for level indicators
    if (expertIndicators.some(indicator => contextLower.includes(indicator))) {
      return SkillLevel.EXPERT;
    }

    if (advancedIndicators.some(indicator => contextLower.includes(indicator))) {
      return SkillLevel.ADVANCED;
    }

    if (intermediateIndicators.some(indicator => contextLower.includes(indicator))) {
      return SkillLevel.INTERMEDIATE;
    }

    if (beginnerIndicators.some(indicator => contextLower.includes(indicator))) {
      return SkillLevel.BEGINNER;
    }

    // Check years of experience mentions
    const yearMatches = contextLower.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
    if (yearMatches) {
      const years = parseInt(yearMatches[1]);
      if (years >= 10) return SkillLevel.EXPERT;
      if (years >= 5) return SkillLevel.ADVANCED;
      if (years >= 2) return SkillLevel.INTERMEDIATE;
    }

    // Check skill name itself for level indicators
    if (skillLower.includes('senior') || skillLower.includes('lead') || skillLower.includes('principal')) {
      return SkillLevel.ADVANCED;
    }

    if (skillLower.includes('junior') || skillLower.includes('entry')) {
      return SkillLevel.BEGINNER;
    }

    // Default to intermediate if no clear indicators
    return SkillLevel.INTERMEDIATE;
  }

  /**
   * Initialize skill database with common skills
   */
  private initializeSkillDatabase(): void {
    // Technical skills
    const technicalSkills = [
      'javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'c#',
      'aws', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql'
    ];

    // Tools
    const tools = [
      'git', 'github', 'jira', 'slack', 'figma', 'tableau', 'excel', 'power bi'
    ];

    // Soft skills
    const softSkills = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'time management'
    ];

    const allSkills = [...technicalSkills, ...tools, ...softSkills];

    for (const skill of allSkills) {
      const category = this.categorizeSkill(skill);
      this.skillDatabase.set(skill, {
        skill,
        category,
        level: SkillLevel.INTERMEDIATE,
        confidence: 0.9,
        context: 'database',
        variations: []
      });
    }

    // Industry keywords
    this.industryKeywords.set('technology', ['software', 'developer', 'engineer', 'programming']);
    this.industryKeywords.set('finance', ['banking', 'financial', 'accounting', 'investment']);
    this.industryKeywords.set('healthcare', ['medical', 'health', 'hospital', 'clinical']);
    this.industryKeywords.set('education', ['teaching', 'academic', 'learning', 'curriculum']);
  }

  /**
   * Preprocess text for better extraction
   */
  private preprocessText(text: string): string {
    return text
      .replace(/[^\w\s.-]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b\w+\b/g, match => match.toLowerCase()) // Normalize case
      .trim();
  }

  /**
   * Extract skills using AI
   */
  private async extractSkillsWithAI(
    text: string,
    options: SkillExtractionOptions
  ): Promise<Skill[]> {
    try {
      const skillTypes = [];
      if (options.includeSoftSkills) skillTypes.push('soft skills');
      if (options.includeDomainSkills) skillTypes.push('domain knowledge');
      if (options.includeTools) skillTypes.push('tools and software');

      const prompt = `
        Extract and analyze professional skills from the following text. Focus on ${skillTypes.join(', ')}.

        Text: ${text.substring(0, 4000)}...

        Please return a JSON array of skills with this structure:
        [
          {
            "name": "skill name",
            "category": "technical|soft_skill|domain|tool|language|framework|platform|methodology|certification",
            "level": "beginner|intermediate|advanced|expert|master",
            "experience": 0, // years of experience if mentioned
            "isPrimary": false, // if this appears to be a core skill
            "context": "brief context where skill was found"
          }
        ]

        Guidelines:
        1. Only include actual skills, not job titles or company names
        2. Be conservative with skill levels - only mark as advanced/expert if there's clear evidence
        3. Group similar skills together
        4. Maximum ${options.maxSkills} skills
        5. Include context snippets when possible
        6. Focus on current, marketable skills

        Return only the JSON array, no additional text.
      `;

      const response = await this.ai.chatCompletion({
        model: 'claude-2',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const skillsData = JSON.parse(response.choices[0].message.content || '[]');

      return skillsData.map((skill: any, index: number) => ({
        id: `skill_${Date.now()}_${index}`,
        name: skill.name?.trim() || '',
        category: skill.category || this.categorizeSkill(skill.name || '', skill.context),
        level: skill.level || this.determineSkillLevel(skill.name || '', skill.context || ''),
        experience: skill.experience || 0,
        isPrimary: skill.isPrimary || false,
        selfRated: false,
        endorsements: [],
        verifiedBy: []
      })).filter(skill => skill.name && skill.name.length > 1);
    } catch (error) {
      console.error('Error in AI skill extraction:', error);
      return [];
    }
  }

  /**
   * Validate and enhance skills with database
   */
  private async validateAndEnhanceSkills(
    skills: Skill[],
    options: SkillExtractionOptions
  ): Promise<Skill[]> {
    const enhancedSkills: Skill[] = [];

    for (const skill of skills) {
      const databaseMatch = this.skillDatabase.get(skill.name.toLowerCase());

      if (databaseMatch) {
        // Enhance with database information
        enhancedSkills.push({
          ...skill,
          category: databaseMatch.category,
          level: skill.level || databaseMatch.level
        });
      } else {
        // Validate category and level
        enhancedSkills.push({
          ...skill,
          category: skill.category || this.categorizeSkill(skill.name)
        });
      }
    }

    return enhancedSkills;
  }

  /**
   * Filter and limit skills based on options
   */
  private filterAndLimitSkills(
    skills: Skill[],
    options: SkillExtractionOptions
  ): Skill[] {
    let filteredSkills = skills;

    // Filter by category preferences
    if (!options.includeSoftSkills) {
      filteredSkills = filteredSkills.filter(skill => skill.category !== SkillCategory.SOFT_SKILL);
    }
    if (!options.includeDomainSkills) {
      filteredSkills = filteredSkills.filter(skill => skill.category !== SkillCategory.DOMAIN);
    }
    if (!options.includeTools) {
      filteredSkills = filteredSkills.filter(skill => skill.category !== SkillCategory.TOOL);
    }

    // Remove duplicates and similar skills
    const uniqueSkills = this.removeDuplicateSkills(filteredSkills);

    // Sort by relevance (primary skills first, then by level)
    uniqueSkills.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      const levelOrder = { [SkillLevel.EXPERT]: 5, [SkillLevel.ADVANCED]: 4, [SkillLevel.INTERMEDIATE]: 3, [SkillLevel.BEGINNER]: 2, [SkillLevel.MASTER]: 6 };
      return (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0);
    });

    // Limit to max skills
    return uniqueSkills.slice(0, options.maxSkills);
  }

  /**
   * Remove duplicate and similar skills
   */
  private removeDuplicateSkills(skills: Skill[]): Skill[] {
    const seen = new Set<string>();
    const uniqueSkills: Skill[] = [];

    for (const skill of skills) {
      const normalized = skill.name.toLowerCase().trim();

      // Check for exact match
      if (seen.has(normalized)) {
        continue;
      }

      // Check for similar skills (e.g., "JavaScript" and "JS")
      let isSimilar = false;
      for (const existing of seen) {
        if (this.areSkillsSimilar(normalized, existing)) {
          isSimilar = true;
          break;
        }
      }

      if (!isSimilar) {
        seen.add(normalized);
        uniqueSkills.push(skill);
      }
    }

    return uniqueSkills;
  }

  /**
   * Check if two skill names are similar
   */
  private areSkillsSimilar(skill1: string, skill2: string): boolean {
    // Exact match
    if (skill1 === skill2) return true;

    // Common abbreviations
    const abbreviations = {
      'javascript': ['js', 'ecmascript'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'node': ['nodejs', 'node.js'],
      'vue': ['vuejs', 'vue.js'],
      'angular': ['angularjs', 'angular.js'],
      'python': ['py'],
      'java': ['jdk', 'jre'],
      'c#': ['csharp', 'c-sharp'],
      'sql': ['structured query language'],
      'nosql': ['no-sql'],
      'ui': ['user interface'],
      'ux': ['user experience'],
      'api': ['application programming interface'],
      'ci/cd': ['continuous integration', 'continuous deployment'],
      'devops': ['development operations']
    };

    // Check abbreviations
    for (const [full, abbrevs] of Object.entries(abbreviations)) {
      const matches = [full, ...abbrevs];
      if (matches.includes(skill1) && matches.includes(skill2)) {
        return true;
      }
    }

    // Check substring similarity
    if (skill1.includes(skill2) || skill2.includes(skill1)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(skills: Skill[]): number {
    if (skills.length === 0) return 0;

    // Weight by skill importance (primary skills get higher weight)
    const totalWeight = skills.reduce((sum, skill) => {
      const weight = skill.isPrimary ? 1.5 : 1.0;
      return sum + weight;
    }, 0);

    const weightedSum = skills.reduce((sum, skill) => {
      const confidence = this.getSkillConfidence(skill);
      const weight = skill.isPrimary ? 1.5 : 1.0;
      return sum + (confidence * weight);
    }, 0);

    return Math.min(1.0, weightedSum / totalWeight);
  }

  /**
   * Get confidence score for a skill
   */
  private getSkillConfidence(skill: Skill): number {
    // Higher confidence for skills with more metadata
    let confidence = 0.5; // Base confidence

    if (skill.experience && skill.experience > 0) confidence += 0.2;
    if (skill.isPrimary) confidence += 0.1;
    if (skill.endorsements && skill.endorsements.length > 0) confidence += 0.1;
    if (skill.verifiedBy && skill.verifiedBy.length > 0) confidence += 0.1;

    // Database-known skills get higher confidence
    if (this.skillDatabase.has(skill.name.toLowerCase())) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }
}

// Export singleton instance
export const skillsExtractor = new SkillsExtractor();
export default skillsExtractor;