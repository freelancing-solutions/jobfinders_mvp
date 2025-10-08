import { Logger } from '@/lib/logger';

export interface ResumeOptimizationRequest {
  resumeData: ResumeData;
  targetRole: string;
  targetCompany?: string;
  experience: string;
  industry: string;
  location: string;
  optimizationGoals: OptimizationGoal[];
  currentVersion: string;
}

export interface ResumeData {
  sections: ResumeSection[];
  content: ResumeContent;
  format: ResumeFormat;
  metadata: ResumeMetadata;
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  order: number;
  visible: boolean;
  content: any;
  wordCount: number;
  qualityScore: number;
}

export interface ResumeContent {
  header: HeaderContent;
  summary: SummaryContent;
  experience: ExperienceContent[];
  education: EducationContent[];
  skills: SkillsContent;
  projects: ProjectContent[];
  certifications: CertificationContent[];
  customSections: CustomSectionContent[];
}

export interface HeaderContent {
  name: string;
  title: string;
  contact: ContactInfo;
  location: LocationInfo;
  links: LinkInfo[];
  profileImage?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

export interface LocationInfo {
  city: string;
  state: string;
  country: string;
  remote: boolean;
  relocation: boolean;
}

export interface LinkInfo {
  type: 'linkedin' | 'github' | 'portfolio' | 'website';
  url: string;
  label: string;
}

export interface SummaryContent {
  content: string;
  wordCount: number;
  tone: string;
  keywords: string[];
  achievements: string[];
  careerGoals: string[];
}

export interface ExperienceContent {
  company: string;
  position: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
  achievements: string[];
  responsibilities: string[];
  technologies: string[];
  metrics: Metric[];
  impact: string;
}

export interface Metric {
  type: string;
  value: string;
  context: string;
  impact: string;
  timeframe: string;
}

export interface EducationContent {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  gpa?: string;
  honors: string[];
  coursework: string[];
  activities: string[];
}

export interface SkillsContent {
  technical: Skill[];
  soft: Skill[];
  languages: Language[];
  tools: Tool[];
  certifications: Certification[];
}

export interface Skill {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  yearsExperience: number;
  lastUsed: Date;
  projects: string[];
  endorsements: number;
}

export interface Language {
  language: string;
  proficiency: LanguageProficiency;
  certifications: string[];
}

export interface Tool {
  name: string;
  category: string;
  proficiency: ToolProficiency;
  experience: string;
}

export interface ProjectContent {
  name: string;
  description: string;
  technologies: string[];
  duration: string;
  role: string;
  achievements: string[];
  url?: string;
  github?: string;
  liveUrl?: string;
  images: string[];
}

export interface CertificationContent {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  url?: string;
  status: CertificationStatus;
}

export interface CustomSectionContent {
  title: string;
  content: string[];
  format: 'list' | 'paragraph' | 'table';
}

export interface ResumeFormat {
  template: string;
  layout: LayoutType;
  font: FontConfig;
  colors: ColorConfig;
  spacing: SpacingConfig;
  sections: string[];
  pageLayout: PageLayout;
}

export interface FontConfig {
  heading: string;
  body: string;
  size: FontSize;
  lineSpacing: number;
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface SpacingConfig {
  margins: Margins;
  lineSpacing: number;
  paragraphSpacing: number;
  sectionSpacing: number;
}

export interface PageLayout {
  orientation: 'portrait' | 'landscape';
  margins: number;
  columns: number;
  pageSize: string;
}

export interface ResumeMetadata {
  wordCount: number;
  pageCount: number;
  readabilityScore: number;
  keywordDensity: number;
  atsScore: number;
  completeness: number;
  lastModified: Date;
  version: string;
}

export interface ResumeOptimizationResult {
  optimizedResume: ResumeData;
  optimizations: Optimization[];
  score: OptimizationScore;
  improvements: Improvement[];
  recommendations: Recommendation[];
  beforeAfter: BeforeAfterComparison;
  exportFormats: ExportFormat[];
}

export interface Optimization {
  type: OptimizationType;
  section: string;
  original: string;
  optimized: string;
  reason: string;
  impact: OptimizationImpact;
  difficulty: ImplementationDifficulty;
  estimatedTime: string;
}

export interface OptimizationScore {
  overall: number; // 0-100
  categories: CategoryScore[];
  benchmarks: BenchmarkComparison;
  trends: ScoreTrend[];
  targetScore: number;
  gap: number;
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  improvements: string[];
  status: 'excellent' | 'good' | 'fair' | 'needs_improvement';
}

export interface BenchmarkComparison {
  userScore: number;
  industryAverage: number;
  topPerformers: number;
  improvementPotential: number;
  percentile: number;
  ranking: string;
}

export interface ScoreTrend {
  date: Date;
  score: number;
  changes: string[];
}

export interface Improvement {
  category: ImprovementCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  current: string;
  suggested: string;
  examples: string[];
  resources: Resource[];
  timeline: string;
}

export interface Recommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionItems: ActionItem[];
  resources: Resource[];
  expectedOutcome: string;
  timeline: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ActionItem {
  task: string;
  description: string;
  steps: string[];
  tools: string[];
  templates: string[];
  estimatedTime: string;
}

export interface Resource {
  title: string;
  type: ResourceType;
  url?: string;
  provider: string;
  rating: number;
  description: string;
  topics: string[];
  cost: number;
  duration: string;
}

export interface BeforeAfterComparison {
  wordCount: BeforeAfterValue;
  sections: BeforeAfterValue[];
  scores: BeforeAfterValue[];
  keywords: BeforeAfterValue[];
  format: BeforeAfterValue[];
}

export interface BeforeAfterValue {
  before: any;
  after: any;
  improvement: number;
  percentage: number;
}

export interface ExportFormat {
  format: 'pdf' | 'docx' | 'html' | 'txt';
  template: string;
  optimized: boolean;
  downloadUrl: string;
}

export type SectionType = 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'custom';
export type LayoutType = 'chronological' | 'functional' | 'combination' | 'targeted' | 'modern' | 'creative';
export type OptimizationGoal = 'ats_optimization' | 'keyword_optimization' | 'content_enhancement' | 'format_improvement' | 'readability' | 'target_role';
export type OptimizationType = 'content' | 'structure' | 'format' | 'keyword' | 'achievement' | 'metric' | 'readability';
export type OptimizationImpact = 'low' | 'medium' | 'high' | 'critical';
export type ImplementationDifficulty = 'easy' | 'medium' | 'hard';
export type ImprovementCategory = 'content' | 'structure' | 'format' | 'keywords' | 'achievements' | 'readability';
export type RecommendationType = 'content' | 'format' | 'structure' | 'seo' | 'design' | 'distribution';
export type RecommendationPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ResourceType = 'article' | 'template' | 'tool' | 'course' | 'book' | 'service';

export type SkillCategory = 'programming' | 'framework' | 'database' | 'tool' | 'methodology' | 'domain' | 'soft' | 'language';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LanguageProficiency = 'native' | 'fluent' | 'proficient' | 'conversational' | 'basic';
export type ToolProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type CertificationStatus = 'active' | 'expired' | 'in_progress' | 'planned';

export interface FontSize {
  heading: number;
  subheading: number;
  body: number;
  caption: number;
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export class ResumeOptimizer {
  private logger: Logger;
  private templates: Map<string, ResumeTemplate> = new Map();
  private keywordDatabase: Map<string, KeywordData> = new Map();
  private industryStandards: Map<string, IndustryStandard> = new Map();
  private atsRules: ATSRule[] = [];

  constructor() {
    this.logger = new Logger('ResumeOptimizer');
    this.initializeTemplates();
    this.initializeKeywordDatabase();
    this.initializeIndustryStandards();
    this.initializeATSRules();
  }

  /**
   * Optimize resume for specific role and goals
   */
  async optimizeResume(request: ResumeOptimizationRequest): Promise<ResumeOptimizationResult> {
    try {
      this.logger.info(`Optimizing resume for role: ${request.targetRole}`);

      // Analyze current resume
      const analysis = await this.analyzeResume(request.resumeData, request);

      // Generate optimizations
      const optimizations = await this.generateOptimizations(request, analysis);

      // Apply optimizations
      const optimizedResume = await this.applyOptimizations(request.resumeData, optimizations);

      // Calculate optimization score
      const score = await this.calculateOptimizationScore(optimizedResume, request);

      // Generate improvements and recommendations
      const improvements = await this.generateImprovements(analysis, score);
      const recommendations = await this.generateRecommendations(request, analysis, score);

      // Create before/after comparison
      const beforeAfter = await this.createBeforeAfterComparison(request.resumeData, optimizedResume);

      // Generate export formats
      const exportFormats = await this.generateExportFormats(optimizedResume);

      const result: ResumeOptimizationResult = {
        optimizedResume,
        optimizations,
        score,
        improvements,
        recommendations,
        beforeAfter,
        exportFormats
      };

      this.logger.info(`Resume optimization completed with score: ${score.overall}`);
      return result;

    } catch (error) {
      this.logger.error('Error optimizing resume:', error);
      throw error;
    }
  }

  /**
   * Analyze resume quality and identify issues
   */
  async analyzeResume(resumeData: ResumeData, request: ResumeOptimizationRequest): Promise<ResumeAnalysis> {
    try {
      this.logger.info('Analyzing resume quality and structure');

      const analysis: ResumeAnalysis = {
        overallScore: 0,
        sections: [],
        content: await this.analyzeContent(resumeData.content, request),
        format: await this.analyzeFormat(resumeData.format),
        keywords: await this.analyzeKeywords(resumeData, request),
        ats: await this.analyzeATSCompatibility(resumeData, request),
        readability: await this.analyzeReadability(resumeData),
        completeness: await this.analyzeCompleteness(resumeData, request)
      };

      // Calculate overall score
      analysis.overallScore = this.calculateOverallScore(analysis);

      // Analyze each section
      for (const section of resumeData.sections) {
        const sectionAnalysis = await this.analyzeSection(section, request);
        analysis.sections.push(sectionAnalysis);
      }

      return analysis;

    } catch (error) {
      this.logger.error('Error analyzing resume:', error);
      throw error;
    }
  }

  /**
   * Get optimization suggestions for specific section
   */
  async getSectionOptimization(
    sectionType: SectionType,
    content: any,
    request: ResumeOptimizationRequest
  ): Promise<SectionOptimization> {
    try {
      const sectionOptimization: SectionOptimization = {
        sectionType,
        currentContent: content,
        issues: [],
        suggestions: [],
        improvements: [],
        examples: [],
        resources: []
      };

      // Analyze section based on type
      switch (sectionType) {
        case 'summary':
          sectionOptimization = await this.analyzeSummarySection(content, request);
          break;
        case 'experience':
          sectionOptimization = await this.analyzeExperienceSection(content, request);
          break;
        case 'skills':
          sectionOptimization = await this.analyzeSkillsSection(content, request);
          break;
        case 'education':
          sectionOptimization = await this.analyzeEducationSection(content, request);
          break;
        default:
          sectionOptimization = await this.analyzeGenericSection(content, request);
      }

      return sectionOptimization;

    } catch (error) {
      this.logger.error(`Error analyzing section ${sectionType}:`, error);
      throw error;
    }
  }

  /**
   * Generate keyword recommendations
   */
  async getKeywordRecommendations(
    currentKeywords: string[],
    targetRole: string,
    industry: string,
    experience: string
  ): Promise<KeywordRecommendation[]> {
    try {
      const recommendations: KeywordRecommendation[] = [];

      // Get target keywords for role
      const targetKeywords = await this.getTargetKeywords(targetRole, industry, experience);

      // Find missing keywords
      const missingKeywords = targetKeywords.filter(keyword =>
        !currentKeywords.some(current => current.toLowerCase() === keyword.toLowerCase())
      );

      // Generate recommendations for missing keywords
      for (const keyword of missingKeywords) {
        const recommendation = await this.createKeywordRecommendation(keyword, currentKeywords, request);
        recommendations.push(recommendation);
      }

      // Sort by importance
      recommendations.sort((a, b) => b.importance - a.importance);

      return recommendations.slice(0, 20); // Return top 20 recommendations

    } catch (error) {
      this.logger.error('Error generating keyword recommendations:', error);
      throw error;
    }
  }

  /**
   * Validate resume against ATS requirements
   */
  async validateATS(resumeData: ResumeData, targetATS: string[]): Promise<ATSValidation> {
    try {
      const validation: ATSValidation = {
        overallScore: 0,
        atsSystems: [],
        issues: [],
        recommendations: [],
        formatCheck: await this.checkFormat(resumeData.format),
        contentCheck: await this.checkContent(resumeData.content),
        structureCheck: await this.checkStructure(resumeData.sections)
      };

      // Validate against each ATS system
      for (const ats of targetATS) {
        const atsValidation = await this.validateForATS(resumeData, ats);
        validation.atsSystems.push(atsValidation);
      }

      // Calculate overall ATS score
      validation.overallScore = this.calculateATSScore(validation);

      return validation;

    } catch (error) {
      this.logger.error('Error validating ATS compatibility:', error);
      throw error;
    }
  }

  // Private helper methods

  private async generateOptimizations(
    request: ResumeOptimizationRequest,
    analysis: ResumeAnalysis
  ): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Generate optimizations based on goals
    for (const goal of request.optimizationGoals) {
      const goalOptimizations = await this.generateGoalOptimizations(request, analysis, goal);
      optimizations.push(...goalOptimizations);
    }

    // Sort by impact and difficulty
    optimizations.sort((a, b) => {
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };

      const aScore = impactOrder[a.impact] * 2 - difficultyOrder[a.difficulty];
      const bScore = impactOrder[b.impact] * 2 - difficultyOrder[b.difficulty];

      return bScore - aScore;
    });

    return optimizations;
  }

  private async applyOptimizations(
    resumeData: ResumeData,
    optimizations: Optimization[]
  ): Promise<ResumeData> {
    let optimizedData = JSON.parse(JSON.stringify(resumeData)); // Deep clone

    for (const optimization of optimizations) {
      optimizedData = await this.applyOptimization(optimizedData, optimization);
    }

    return optimizedData;
  }

  private async applyOptimization(resumeData: ResumeData, optimization: Optimization): Promise<ResumeData> {
    // Apply optimization based on type and section
    const section = resumeData.sections.find(s => s.id === optimization.section);
    if (section) {
      section.content = optimization.optimized;
      section.qualityScore = Math.min(100, section.qualityScore + 10);
    }

    return resumeData;
  }

  private async calculateOptimizationScore(resumeData: ResumeData, request: ResumeOptimizationRequest): Promise<OptimizationScore> {
    const categories: CategoryScore[] = [
      {
        category: 'Content Quality',
        score: await this.calculateContentScore(resumeData.content),
        maxScore: 100,
        weight: 0.3,
        improvements: [],
        status: 'good'
      },
      {
        category: 'ATS Compatibility',
        score: await this.calculateATSScore(resumeData),
        maxScore: 100,
        weight: 0.25,
        improvements: [],
        status: 'good'
      },
      {
        category: 'Keyword Optimization',
        score: await this.calculateKeywordScore(resumeData, request),
        maxScore: 100,
        weight: 0.2,
        improvements: [],
        status: 'good'
      },
      {
        category: 'Structure',
        score: await this.calculateStructureScore(resumeData.sections),
        maxScore: 100,
        weight: 0.15,
        improvements: [],
        status: 'good'
      },
      {
        category: 'Readability',
        score: await this.calculateReadabilityScore(resumeData),
        maxScore: 100,
        weight: 0.1,
        improvements: [],
        status: 'good'
      }
    ];

    // Calculate weighted overall score
    const overallScore = categories.reduce((sum, cat) =>
      sum + (cat.score * cat.weight), 0);

    return {
      overallScore,
      categories,
      benchmarks: this.createBenchmarkComparison(overallScore),
      trends: [],
      targetScore: 90,
      gap: Math.max(0, 90 - overallScore)
    };
  }

  private async generateImprovements(analysis: ResumeAnalysis, score: OptimizationScore): Promise<Improvement[]> {
    const improvements: Improvement[] = [];

    // Generate improvements for low-scoring categories
    for (const category of score.categories) {
      if (category.score < category.maxScore * 0.7) {
        const categoryImprovements = await this.generateCategoryImprovements(category, analysis);
        improvements.push(...categoryImprovements);
      }
    }

    return improvements;
  }

  private async generateRecommendations(
    request: ResumeOptimizationRequest,
    analysis: ResumeAnalysis,
    score: OptimizationScore
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Generate recommendations based on optimization goals
    for (const goal of request.optimizationGoals) {
      const goalRecommendations = await this.generateGoalRecommendations(goal, analysis, score);
      recommendations.push(...goalRecommendations);
    }

    return recommendations;
  }

  // Stub implementations for remaining methods
  private analyzeContent(content: ResumeContent, request: ResumeOptimizationRequest): Promise<any> {
    return { type: 'content_analysis', score: 75 };
  }

  private analyzeFormat(format: ResumeFormat): Promise<any> {
    return { type: 'format_analysis', score: 80 };
  }

  private analyzeKeywords(resumeData: ResumeData, request: ResumeOptimizationRequest): Promise<any> {
    return { type: 'keyword_analysis', score: 70 };
  }

  private analyzeATSCompatibility(resumeData: ResumeData, request: ResumeOptimizationRequest): Promise<any> {
    return { type: 'ats_analysis', score: 85 };
  }

  private analyzeReadability(resumeData: ResumeData): Promise<any> {
    return { type: 'readability_analysis', score: 75 };
  }

  private analyzeCompleteness(resumeData: ResumeData, request: ResumeOptimizationRequest): Promise<any> {
    return { type: 'completeness_analysis', score: 80 };
  }

  private calculateOverallScore(analysis: ResumeAnalysis): number {
    return 75; // Placeholder
  }

  private analyzeSection(section: ResumeSection, request: ResumeOptimizationRequest): Promise<any> {
    return { type: 'section_analysis', score: 70 };
  }

  private analyzeSummarySection(content: any, request: ResumeOptimizationRequest): Promise<SectionOptimization> {
    return this.createDefaultSectionOptimization('summary');
  }

  private analyzeExperienceSection(content: any, request: ResumeOptimizationRequest): Promise<SectionOptimization> {
    return this.createDefaultSectionOptimization('experience');
  }

  private analyzeSkillsSection(content: any, request: ResumeOptimizationRequest): Promise<SectionOptimization> {
    return this.createDefaultSectionOptimization('skills');
  }

  private analyzeEducationSection(content: any, request: ResumeOptimizationRequest): Promise<SectionOptimization> {
    return this.createDefaultSectionOptimization('education');
  }

  private analyzeGenericSection(content: any, request: ResumeOptimizationRequest): Promise<SectionOptimization> {
    return this.createDefaultSectionOptimization('generic');
  }

  private createDefaultSectionOptimization(type: SectionType): SectionOptimization {
    return {
      sectionType: type,
      currentContent: '',
      issues: [],
      suggestions: [],
      improvements: [],
      examples: [],
      resources: []
    };
  }

  private createKeywordRecommendation(keyword: string, currentKeywords: string[], request: ResumeOptimizationRequest): Promise<KeywordRecommendation> {
    return {
      keyword,
      importance: 3,
      frequency: 5,
      context: 'technical skills',
      examples: [`Used ${keyword} in project X`, `Applied ${keyword} to solve problem Y`],
      resources: []
    };
  }

  private checkFormat(format: ResumeFormat): Promise<any> {
    return { type: 'format_check', score: 80 };
  }

  private checkContent(content: ResumeContent): Promise<any> {
    return { type: 'content_check', score: 75 };
  }

  private checkStructure(sections: ResumeSection[]): Promise<any> {
    return { type: 'structure_check', score: 70 };
  }

  private validateForATS(resumeData: ResumeData, ats: string): Promise<ATSValidation> {
    return {
      overallScore: 85,
      atsName: ats,
      compatibility: 'high',
      issues: [],
      recommendations: []
    };
  }

  private calculateATSScore(validation: ATSValidation): number {
    return validation.overallScore;
  }

  private createBenchmarkComparison(score: number): BenchmarkComparison {
    return {
      userScore: score,
      industryAverage: 70,
      topPerformers: 90,
      improvementPotential: Math.max(0, 90 - score),
      percentile: (score / 90) * 100,
      ranking: 'Above Average'
    };
  }

  private calculateContentScore(content: ResumeContent): Promise<number> {
    return 75; // Placeholder
  }

  private calculateATSScore(resumeData: ResumeData): Promise<number> {
    return 85; // Placeholder
  }

  private calculateKeywordScore(resumeData: ResumeData, request: ResumeOptimizationRequest): Promise<number> {
    return 70; // Placeholder
  }

  private calculateStructureScore(sections: ResumeSection[]): Promise<number> {
    return 75; // Placeholder
  }

  private calculateReadabilityScore(resumeData: ResumeData): Promise<number> {
    return 75; // Placeholder
  }

  private createBeforeAfterComparison(original: ResumeData, optimized: ResumeData): Promise<BeforeAfterComparison> {
    return {
      wordCount: { before: original.metadata.wordCount, after: optimized.metadata.wordCount, improvement: 0, percentage: 0 },
      sections: [],
      scores: [],
      keywords: [],
      format: { before: 'classic', after: 'modern', improvement: 1, percentage: 100 }
    };
  }

  private generateExportFormats(resumeData: ResumeData): Promise<ExportFormat[]> {
    return [
      {
        format: 'pdf',
        template: resumeData.format.template,
        optimized: true,
        downloadUrl: `/api/resume/export/pdf`
      },
      {
        format: 'docx',
        template: resumeData.format.template,
        optimized: true,
        downloadUrl: `/api/resume/export/docx`
      }
    ];
  }

  private async getTargetKeywords(role: string, industry: string, experience: string): Promise<string[]> {
    // Implementation would fetch keywords from database
    return ['JavaScript', 'React', 'Node.js', 'Python', 'Agile'];
  }

  private async generateGoalOptimizations(request: ResumeOptimizationRequest, analysis: ResumeAnalysis, goal: OptimizationGoal): Promise<Optimization[]> {
    // Implementation would generate goal-specific optimizations
    return [];
  }

  private async generateCategoryImprovements(category: CategoryScore, analysis: ResumeAnalysis): Promise<Improvement[]> {
    // Implementation would generate improvements for specific category
    return [];
  }

  private async generateGoalRecommendations(goal: OptimizationGoal, analysis: ResumeAnalysis, score: OptimizationScore): Promise<Recommendation[]> {
    // Implementation would generate goal-specific recommendations
    return [];
  }

  // Initialize helper methods
  private initializeTemplates(): void {
    // Initialize resume templates
  }

  private initializeKeywordDatabase(): void {
    // Initialize keyword database
  }

  private initializeIndustryStandards(): void {
    // Initialize industry standards
  }

  private initializeATSRules(): void {
    // Initialize ATS rules
  }
}

// Supporting interfaces
interface ResumeAnalysis {
  overallScore: number;
  sections: any[];
  content: any;
  format: any;
  keywords: any;
  ats: any;
  readability: any;
  completeness: any;
}

interface SectionOptimization {
  sectionType: SectionType;
  currentContent: any;
  issues: string[];
  suggestions: string[];
  improvements: string[];
  examples: string[];
  resources: Resource[];
}

interface KeywordRecommendation {
  keyword: string;
  importance: number;
  frequency: number;
  context: string;
  examples: string[];
  resources: Resource[];
}

interface ATSValidation {
  overallScore: number;
  atsSystems: ATSValidation[];
  issues: string[];
  recommendations: string[];
  formatCheck: any;
  contentCheck: any;
  structureCheck: any;
}

interface ATSValidation {
  atsName: string;
  compatibility: string;
  issues: string[];
  recommendations: string[];
}

interface Template {
  id: string;
  name: string;
  type: string;
  layout: string;
  sections: string[];
  customizable: boolean;
}

interface KeywordData {
  keyword: string;
  category: string;
  importance: number;
  frequency: number;
  context: string;
  examples: string[];
}

interface IndustryStandard {
  industry: string;
  requirements: IndustryRequirement[];
  keywords: string[];
  bestPractices: string[];
}

interface IndustryRequirement {
  section: string;
  required: boolean;
  guidelines: string[];
}

interface ATSRule {
  ats: string;
  rule: string;
  description: string;
  impact: string;
  solution: string;
}