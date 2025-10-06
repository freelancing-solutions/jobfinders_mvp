// Profile System Types
// Extended profile types for matching system

export interface CandidateProfile {
  id: string;
  userId: string;
  personalInfo: PersonalInfo;
  professionalSummary: string;
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  preferences: JobPreferences;
  availability: AvailabilityInfo;
  metadata: ProfileMetadata;
}

export interface JobProfile {
  id: string;
  employerId: string;
  title: string;
  description: string;
  requirements: JobRequirements;
  preferences: EmployerPreferences;
  compensation: CompensationInfo;
  company: CompanyInfo;
  location: LocationInfo;
  metadata: JobMetadata;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location: LocationInfo;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  website?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  languages: Language[];
}

export interface LocationInfo {
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  isRemote: boolean;
  relocationWilling: boolean;
  preferredLocations?: LocationPreference[];
}

export interface LocationPreference {
  city?: string;
  state?: string;
  country: string;
  priority: number; // 1-5, 1 being highest
  required?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  experience?: number; // years of experience
  lastUsed?: Date;
  certifications?: string[];
  projects?: string[];
  endorsements?: SkillEndorsement[];
  isPrimary?: boolean;
  selfRated?: boolean;
  verifiedBy?: string[];
}

export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT_SKILL = 'soft_skill',
  DOMAIN = 'domain',
  TOOL = 'tool',
  LANGUAGE = 'language',
  FRAMEWORK = 'framework',
  PLATFORM = 'platform',
  METHODOLOGY = 'methodology',
  CERTIFICATION = 'certification'
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  MASTER = 'master'
}

export interface SkillEndorsement {
  endorserId: string;
  endorserName: string;
  endorsementDate: Date;
  comment?: string;
  relationship?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description: string;
  location?: string;
  employmentType: EmploymentType;
  industry?: string;
  companySize?: CompanySize;
  skills: string[]; // skill IDs or names
  achievements: Achievement[];
  teamSize?: number;
  directReports?: number;
  budget?: number;
  tools?: string[];
  projects?: string[];
  reasonsForLeaving?: string;
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
  TEMPORARY = 'temporary',
  CONSULTANT = 'consultant'
}

export enum CompanySize {
  MICRO = 'micro', // 1-10
  SMALL = 'small', // 11-50
  MEDIUM = 'medium', // 51-200
  LARGE = 'large', // 201-1000
  ENTERPRISE = 'enterprise' // 1000+
}

export interface Achievement {
  title: string;
  description: string;
  date?: Date;
  impact?: string;
  metrics?: {
    type: string;
    value: number | string;
    unit?: string;
  }[];
  recognition?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  gpa?: number;
  scale?: number; // GPA scale (e.g., 4.0, 5.0)
  honors?: string[];
  activities?: string[];
  thesis?: string;
  relevantCoursework?: string[];
  projects?: string[];
  certifications?: string[];
  location?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  verificationUrl?: string;
  level?: CertificationLevel;
  status: CertificationStatus;
  skills: string[]; // associated skills
  description?: string;
}

export enum CertificationLevel {
  FOUNDATION = 'foundation',
  ASSOCIATE = 'associate',
  PROFESSIONAL = 'professional',
  EXPERT = 'expert',
  SPECIALIST = 'specialist',
  MASTER = 'master'
}

export enum CertificationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending',
  REVOKED = 'revoked',
  IN_PROGRESS = 'in_progress'
}

export interface Language {
  id: string;
  name: string;
  proficiency: LanguageProficiency;
  certifications?: string[];
  isNative?: boolean;
  learnedAt?: Date;
}

export enum LanguageProficiency {
  BEGINNER = 'beginner',
  ELEMENTARY = 'elementary',
  INTERMEDIATE = 'intermediate',
  UPPER_INTERMEDIATE = 'upper_intermediate',
  ADVANCED = 'advanced',
  PROFICIENT = 'proficient',
  NATIVE = 'native'
}

export interface JobPreferences {
  location: LocationPreference[];
  salaryRange: SalaryRange;
  workType: EmploymentType[];
  remoteWorkPreference: RemoteWorkPreference;
  companyTypes: CompanyType[];
  industries: string[];
  teamSize: TeamSizePreference;
  travelRequirement: number; // percentage
  careerLevel: CareerLevel[];
  workSchedule: WorkSchedule;
  benefits: BenefitPreference[];
  cultureFit: CultureFitPreference;
  growthOpportunities: GrowthPreference[];
  excludeCompanies: string[];
  mustHaveBenefits: string[];
  dealBreakers: string[];
}

export enum RemoteWorkPreference {
  ONSITE_ONLY = 'onsite_only',
  HYBRID = 'hybrid',
  REMOTE_ONLY = 'remote_only',
  FLEXIBLE = 'flexible'
}

export enum CompanyType {
  STARTUP = 'startup',
  SMB = 'smb',
  ENTERPRISE = 'enterprise',
  NON_PROFIT = 'non_profit',
  GOVERNMENT = 'government',
  AGENCY = 'agency',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare'
}

export enum TeamSizePreference {
  SOLO = 'solo',
  SMALL = 'small', // 2-10
  MEDIUM = 'medium', // 11-50
  LARGE = 'large', // 51-200
  VERY_LARGE = 'very_large' // 200+
}

export enum CareerLevel {
  ENTRY_LEVEL = 'entry_level',
  EARLY_CAREER = 'early_career',
  MID_CAREER = 'mid_career',
  SENIOR_LEVEL = 'senior_level',
  EXECUTIVE_LEVEL = 'executive_level'
}

export enum WorkSchedule {
  STANDARD = 'standard', // 9-5, Mon-Fri
  FLEXIBLE = 'flexible',
  SHIFT_WORK = 'shift_work',
  COMPRESSED = 'compressed', // 4x10 hours
  WEEKEND = 'weekend',
  IRREGULAR = 'irregular'
}

export interface BenefitPreference {
  type: BenefitType;
  required: boolean;
  priority: number; // 1-5
}

export enum BenefitType {
  HEALTH_INSURANCE = 'health_insurance',
  DENTAL_INSURANCE = 'dental_insurance',
  VISION_INSURANCE = 'vision_insurance',
  RETIREMENT_PLAN = 'retirement_plan',
  STOCK_OPTIONS = 'stock_options',
  BONUS = 'bonus',
  PROFIT_SHARING = 'profit_sharing',
  PAID_TIME_OFF = 'paid_time_off',
  PARENTAL_LEAVE = 'parental_leave',
  EDUCATIONAL_ASSISTANCE = 'educational_assistance',
  GYM_MEMBERSHIP = 'gym_membership',
  TRANSPORTATION = 'transportation',
  REMOTE_WORK_STIPEND = 'remote_work_stipend',
  FLEXIBLE_HOURS = 'flexible_hours'
}

export interface CultureFitPreference {
  aspect: CultureAspect;
  preference: CulturePreferenceLevel;
  importance: number; // 1-5
}

export enum CultureAspect {
  WORK_LIFE_BALANCE = 'work_life_balance',
  COLLABORATION = 'collaboration',
  INNOVATION = 'innovation',
  STRUCTURE = 'structure',
  DIVERSITY = 'diversity',
  SUSTAINABILITY = 'sustainability',
  SOCIAL_IMPACT = 'social_impact',
  GROWTH_MINDSET = 'growth_mindset',
  AUTONOMY = 'autonomy',
  TRANSPARENCY = 'transparency'
}

export enum CulturePreferenceLevel {
  NOT_IMPORTANT = 'not_important',
  SLIGHTLY_PREFERRED = 'slightly_preferred',
  PREFERRED = 'preferred',
  STRONGLY_PREFERRED = 'strongly_preferred',
  ESSENTIAL = 'essential'
}

export interface GrowthPreference {
  type: GrowthType;
  timeline: string;
  priority: number;
}

export enum GrowthType {
  PROMOTION = 'promotion',
  SKILL_DEVELOPMENT = 'skill_development',
  LEADERSHIP = 'leadership',
  MENTORSHIP = 'mentorship',
  CROSS_FUNCTIONAL = 'cross_functional',
  SPECIALIZATION = 'specialization',
  ENTREPRENEURSHIP = 'entrepreneurship'
}

export interface SalaryRange {
  min?: number;
  max?: number;
  currency?: string;
  period?: SalaryPeriod;
  negotiable?: boolean;
}

export enum SalaryPeriod {
  HOURLY = 'hourly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface AvailabilityInfo {
  isAvailable: boolean;
  availableFromDate?: Date;
  noticePeriod?: NoticePeriod;
  preferredStartDate?: Date;
  workSchedule: WorkSchedule;
  overtimeWilling: boolean;
  weekendWorkWilling: boolean;
  travelWilling: boolean;
  relocationWilling: boolean;
  visaStatus?: VisaStatus;
  workAuthorization?: WorkAuthorization[];
}

export enum NoticePeriod {
  IMMEDIATE = 'immediate',
  ONE_WEEK = 'one_week',
  TWO_WEEKS = 'two_weeks',
  ONE_MONTH = 'one_month',
  TWO_MONTHS = 'two_months',
  THREE_MONTHS = 'three_months',
  NEGOTIABLE = 'negotiable'
}

export enum VisaStatus {
  CITIZEN = 'citizen',
  PERMANENT_RESIDENT = 'permanent_resident',
  WORK_VISA = 'work_visa',
  STUDENT_VISA = 'student_visa',
  TOURIST_VISA = 'tourist_visa',
  NO_VISA = 'no_visa',
  SPONSORSHIP_REQUIRED = 'sponsorship_required'
}

export interface WorkAuthorization {
  country: string;
  type: string;
  expiryDate?: Date;
  restrictions?: string[];
}

export interface ProfileMetadata {
  completionScore: number;
  lastUpdated: Date;
  visibility: ProfileVisibility;
  isActive: boolean;
  isPublic: boolean;
  allowSearch: boolean;
  allowDirectContact: boolean;
  dataRetentionSettings: DataRetentionSettings;
  privacySettings: PrivacySettings;
  verificationStatus: VerificationStatus;
  lastProfileView?: Date;
  profileViews: number;
  searchRanking: number;
  featured?: boolean;
  premium?: boolean;
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  EMPLOYERS_ONLY = 'employers_only',
  PRIVATE = 'private',
  ANONYMOUS = 'anonymous'
}

export interface DataRetentionSettings {
  retentionPeriod: number; // months
  deleteAfterExpiry: boolean;
  anonymizeData: boolean;
  keepInteractions: boolean;
  keepApplications: boolean;
}

export interface PrivacySettings {
  shareProfileData: boolean;
  allowAnalytics: boolean;
  allowPersonalization: boolean;
  allowThirdPartySharing: boolean;
  excludedCompanies: string[];
  blockedUsers: string[];
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Job Profile Types
export interface JobRequirements {
  skills: RequiredSkill[];
  experience: ExperienceRequirement[];
  education: EducationRequirement[];
  certifications: CertificationRequirement[];
  languages: LanguageRequirement[];
  qualifications: QualificationRequirement[];
}

export interface RequiredSkill {
  skillId: string;
  name: string;
  level: SkillLevel;
  required: boolean;
  importance: number; // 1-5
  yearsExperience?: number;
  alternatives?: string[];
}

export interface ExperienceRequirement {
  title: string;
  level: ExperienceLevel;
  yearsRequired: number;
  industry?: string;
  companyType?: CompanyType;
  required: boolean;
  alternatives?: string[];
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive'
}

export interface EducationRequirement {
  level: EducationLevel;
  field?: string;
  specialization?: string;
  required: boolean;
  alternatives?: string[];
}

export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  ASSOCIATE = 'associate',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  PHD = 'phd',
  POSTDOCTORAL = 'postdoctoral',
  PROFESSIONAL = 'professional',
  CERTIFICATE = 'certificate',
  DIPLOMA = 'diploma'
}

export interface CertificationRequirement {
  name: string;
  issuer?: string;
  required: boolean;
  alternatives?: string[];
  expiryRequired?: boolean;
}

export interface LanguageRequirement {
  language: string;
  proficiency: LanguageProficiency;
  required: boolean;
}

export interface QualificationRequirement {
  type: QualificationType;
  description: string;
  required: boolean;
  importance: number; // 1-5
}

export enum QualificationType {
  LICENSE = 'license',
  CLEARANCE = 'clearance',
  MEMBERSHIP = 'membership',
  REGISTRATION = 'registration',
  ACCREDITATION = 'accreditation'
}

export interface EmployerPreferences {
  location: LocationPreference[];
  workType: EmploymentType[];
  experienceLevel: ExperienceLevel[];
  companyCulture: CulturePreference[];
  teamStructure: TeamStructurePreference;
  workEnvironment: WorkEnvironmentPreference;
  diversityGoals: DiversityGoal[];
  compensationPhilosophy: CompensationPhilosophy;
}

export interface CulturePreference {
  aspect: CultureAspect;
  required: boolean;
  description?: string;
}

export interface TeamStructurePreference {
  size: TeamSizePreference;
  structure: TeamStructure;
  leadershipStyle: LeadershipStyle;
  collaborationLevel: CollaborationLevel;
}

export enum TeamStructure {
  FLAT = 'flat',
  HIERARCHICAL = 'hierarchical',
  MATRIX = 'matrix',
  AGILE = 'agile',
  HYBRID = 'hybrid'
}

export enum LeadershipStyle {
  AUTOCRATIC = 'autocratic',
  DEMOCRATIC = 'democratic',
  TRANSFORMATIONAL = 'transformational',
  SERVANT = 'servant',
  SITUATIONAL = 'situational',
  HANDS_OFF = 'hands_off'
}

export enum CollaborationLevel {
  INDEPENDENT = 'independent',
  COLLABORATIVE = 'collaborative',
  HIGHLY_COLLABORATIVE = 'highly_collaborative',
  CROSS_FUNCTIONAL = 'cross_functional'
}

export interface WorkEnvironmentPreference {
  pace: WorkPace;
  pressure: WorkPressure;
  innovation: InnovationLevel;
  structure: EnvironmentStructure;
  flexibility: FlexibilityLevel;
}

export enum WorkPace {
  RELAXED = 'relaxed',
  MODERATE = 'moderate',
  FAST = 'fast',
  VERY_FAST = 'very_fast'
}

export enum WorkPressure {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum InnovationLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CUTTING_EDGE = 'cutting_edge'
}

export enum EnvironmentStructure {
  HIGHLY_STRUCTURED = 'highly_structured',
  STRUCTURED = 'structured',
  FLEXIBLE = 'flexible',
  UNSTRUCTURED = 'unstructured'
}

export enum FlexibilityLevel {
  RIGID = 'rigid',
  SOMEWHAT_FLEXIBLE = 'somewhat_flexible',
  FLEXIBLE = 'flexible',
  HIGHLY_FLEXIBLE = 'highly_flexible'
}

export interface DiversityGoal {
  category: DiversityCategory;
  target?: string;
  importance: number; // 1-5
  description?: string;
}

export enum DiversityCategory {
  GENDER = 'gender',
  ETHNICITY = 'ethnicity',
  AGE = 'age',
  DISABILITY = 'disability',
  VETERAN = 'veteran',
  LGBTQ = 'lgbtq',
  SOCIOECONOMIC = 'socioeconomic',
  EDUCATIONAL = 'educational',
  GEOGRAPHIC = 'geographic'
}

export interface CompensationPhilosophy {
  type: CompensationType;
  range: SalaryRange;
  bonuses: BonusStructure[];
  equity: EquityStructure?;
  benefits: BenefitPackage;
  reviewFrequency: ReviewFrequency;
  transparency: TransparencyLevel;
}

export enum CompensationType {
  FIXED = 'fixed',
  PERFORMANCE_BASED = 'performance_based',
  COMMISSION = 'commission',
  HYBRID = 'hybrid'
}

export interface BonusStructure {
  type: BonusType;
  target?: number;
  frequency: BonusFrequency;
  criteria?: string[];
}

export enum BonusType {
  PERFORMANCE = 'performance',
  SIGN_ON = 'sign_on',
  RETENTION = 'retention',
  REFERRAL = 'referral',
  PROJECT = 'project',
  PROFIT_SHARING = 'profit_sharing'
}

export enum BonusFrequency {
  ONE_TIME = 'one_time',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual'
}

export interface EquityStructure {
  type: EquityType;
  percentage?: number;
  vestingSchedule?: VestingSchedule;
  cliffPeriod?: number; // months
}

export enum EquityType {
  STOCK_OPTIONS = 'stock_options',
  RESTRICTED_STOCK = 'restricted_stock',
  RSU = 'rsu',
  STOCK_PURCHASE_PLAN = 'stock_purchase_plan',
  PROFIT_INTEREST = 'profit_interest'
}

export interface VestingSchedule {
  totalPeriod: number; // months
  cliffPeriod: number; // months
  frequency: VestingFrequency;
}

export enum VestingFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual'
}

export interface BenefitPackage {
  health: HealthBenefits;
  retirement: RetirementBenefits;
  leave: LeaveBenefits;
  perks: PerksBenefits;
  development: DevelopmentBenefits;
  flexible: FlexibleBenefits;
}

export interface HealthBenefits {
  medical: boolean;
  dental: boolean;
  vision: boolean;
  mentalHealth: boolean;
  wellness: boolean;
  familyCoverage: boolean;
}

export interface RetirementBenefits {
  plan: string;
  employerMatch: boolean;
  matchPercentage?: number;
  vestingPeriod?: number;
}

export interface LeaveBenefits {
  vacationDays: number;
  sickDays: number;
  personalDays: number;
  parentalLeave: ParentalLeaveBenefits;
  bereavementLeave: boolean;
  juryDutyLeave: boolean;
}

export interface ParentalLeaveBenefits {
  maternity: number; // weeks
  paternity: number; // weeks
  adoption: number; // weeks
  paid: boolean;
}

export interface PerksBenefits {
  meals: boolean;
  transportation: boolean;
  gym: boolean;
  remoteWork: boolean;
  flexibleHours: boolean;
  equipment: boolean;
  discounts: string[];
}

export interface DevelopmentBenefits {
  trainingBudget: number;
  conferences: boolean;
  certifications: boolean;
  tuitionReimbursement: boolean;
  mentorship: boolean;
}

export interface FlexibleBenefits {
  customAllocation: boolean;
  lifestyleAccount: boolean;
  wellnessStipend: boolean;
  educationStipend: boolean;
  childcare: boolean;
}

export enum ReviewFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual'
}

export enum TransparencyLevel {
  TRANSPARENT = 'transparent',
  SEMI_TRANSPARENT = 'semi_transparent',
  CONFIDENTIAL = 'confidential',
  UNDISCLOSED = 'undisclosed'
}

export interface CompensationInfo {
  salaryRange: SalaryRange;
  bonuses: BonusStructure[];
  equity?: EquityStructure;
  benefits: BenefitPackage;
  reviewFrequency: ReviewFrequency;
  transparency: TransparencyLevel;
  negotiable: boolean;
}

export interface CompanyInfo {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: CompanySize;
  foundedYear?: number;
  website?: string;
  logoUrl?: string;
  locations: CompanyLocation[];
  culture: CompanyCulture;
  benefits: CompanyBenefits;
  growth: CompanyGrowth;
  reputation: CompanyReputation;
}

export interface CompanyLocation {
  city: string;
  state?: string;
  country: string;
  isHeadquarters: boolean;
  address?: string;
  remoteFriendly: boolean;
}

export interface CompanyCulture {
  values: string[];
  mission: string;
  vision: string;
  workEnvironment: WorkEnvironmentPreference;
  diversityCommitment: string;
  sustainabilityFocus: boolean;
  socialImpact: boolean;
  innovationFocus: boolean;
}

export interface CompanyBenefits {
  standardBenefits: BenefitPackage;
  uniqueBenefits: string[];
  perksDescription: string;
  workLifeBalance: WorkLifeBalanceInfo;
}

export interface WorkLifeBalanceInfo {
  flexibleHours: boolean;
  remoteWorkPolicy: string;
  vacationPolicy: string;
  parentalLeavePolicy: string;
  wellnessPrograms: boolean;
}

export interface CompanyGrowth {
  fundingStage: FundingStage;
  employeeGrowth: GrowthMetrics;
  revenueGrowth: GrowthMetrics;
  marketPosition: string;
  expansionPlans: string[];
}

export enum FundingStage {
  PRE_SEED = 'pre_seed',
  SEED = 'seed',
  SERIES_A = 'series_a',
  SERIES_B = 'series_b',
  SERIES_C = 'series_c',
  SERIES_D_PLUS = 'series_d_plus',
  BOOTSTRAPPED = 'bootstrapped',
  PUBLIC = 'public',
  ACQUIRED = 'acquired'
}

export interface GrowthMetrics {
  currentYear: number;
  previousYear: number;
  projectedYear: number;
  period: 'yearly' | 'quarterly';
}

export interface CompanyReputation {
  overallRating: number;
  employeeSatisfaction: number;
  ceoApproval: number;
  recommendToFriend: number;
  awards: string[];
  pressMentions: string[];
  glassdoorUrl?: string;
  linkedinFollowers?: number;
}

export interface JobMetadata {
  postedDate: Date;
  expiryDate?: Date;
  urgency: JobUrgency;
  isActive: boolean;
  isFeatured: boolean;
  applicationCount: number;
  viewCount: number;
  saveCount: number;
  shareCount: number;
  lastUpdated: Date;
  postedBy: string;
  approvedBy?: string;
  department?: string;
  division?: string;
  requisitionId?: string;
}

export enum JobUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  IMMEDIATE = 'immediate'
}