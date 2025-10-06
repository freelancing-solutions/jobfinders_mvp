/**
 * Template System Types
 *
 * TypeScript interfaces for the resume template system including
 * template definitions, rendering options, customization features,
 * and export configurations.
 */

import { Resume } from './resume';

// Core template structure
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  subcategory?: string;
  preview: TemplatePreview;
  layout: TemplateLayout;
  styling: TemplateStyling;
  sections: TemplateSection[];
  features: TemplateFeatures;
  atsOptimization: ATSOptimization;
  customization: CustomizationOptions;
  metadata: TemplateMetadata;
}

export interface TemplatePreview {
  thumbnail: string; // URL to thumbnail image
  large: string; // URL to large preview image
  animated?: string; // URL to animated preview (optional)
  demo?: Resume; // Demo resume data for preview
}

export enum TemplateCategory {
  PROFESSIONAL = 'professional',
  MODERN = 'modern',
  INDUSTRY_SPECIFIC = 'industry-specific',
  ACADEMIC = 'academic',
  CREATIVE = 'creative'
}

// Layout configuration
export interface TemplateLayout {
  format: LayoutFormat;
  headerStyle: HeaderStyle;
  sectionOrder: SectionOrder[];
  spacing: SpacingConfig;
  dimensions: PageDimensions;
  responsiveness: ResponsiveBreakpoints;
  columns: ColumnConfiguration;
}

export enum LayoutFormat {
  SINGLE_COLUMN = 'single-column',
  TWO_COLUMN = 'two-column',
  THREE_COLUMN = 'three-column',
  HYBRID = 'hybrid',
  SIDEBAR = 'sidebar'
}

export enum HeaderStyle {
  CENTERED = 'centered',
  LEFT_ALIGNED = 'left-aligned',
  RIGHT_ALIGNED = 'right-aligned',
  SIDEBAR = 'sidebar',
  MODERN = 'modern'
}

export interface SectionOrder {
  id: string;
  name: string;
  required: boolean;
  order: number;
  visible: boolean;
}

export interface SpacingConfig {
  section: number; // Spacing between sections
  item: number; // Spacing between items within sections
  line: number; // Line height multiplier
  margin: MarginConfig;
  padding: PaddingConfig;
}

export interface MarginConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PaddingConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageDimensions {
  width: number; // inches
  height: number; // inches
  margins: MarginConfig;
  orientation: 'portrait' | 'landscape';
}

export interface ResponsiveBreakpoints {
  mobile: number; // px
  tablet: number; // px
  desktop: number; // px
  large: number; // px
}

export interface ColumnConfiguration {
  count: number;
  widths: number[]; // Percentage widths for each column
  gutters: number; // Spacing between columns
  breakpoints: ResponsiveBreakpoints;
}

// Styling configuration
export interface TemplateStyling {
  fonts: FontConfiguration;
  colors: ColorConfiguration;
  sizes: SizeConfiguration;
  effects: VisualEffects;
  branding: BrandingOptions;
}

export interface FontConfiguration {
  heading: FontFamily;
  body: FontFamily;
  accents: FontFamily;
  monospace?: FontFamily;
  fallbacks: FontFallback[];
}

export interface FontFamily {
  name: string;
  stack: string[];
  weights: FontWeight[];
  webFonts?: WebFont[];
}

export interface FontWeight {
  weight: number;
  name: string;
  url?: string;
}

export interface WebFont {
  family: string;
  source: 'google' | 'adobe' | 'custom';
  url: string;
  variants: string[];
}

export interface FontFallback {
  category: 'serif' | 'sans-serif' | 'monospace';
  fonts: string[];
}

export interface ColorConfiguration {
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  text: TextColors;
  background: BackgroundColors;
  semantic: SemanticColors;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // Main color
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  inverse: string;
  muted: string;
  accent: string;
}

export interface BackgroundColors {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface SizeConfiguration {
  heading: HeadingSizes;
  body: BodySizes;
  spacing: SpacingSizes;
  borders: BorderSizes;
}

export interface HeadingSizes {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
}

export interface BodySizes {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export interface SpacingSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export interface BorderSizes {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface VisualEffects {
  shadows: ShadowConfiguration;
  borderRadius: BorderRadiusConfig;
  transitions: TransitionConfig;
  animations: AnimationConfig;
}

export interface ShadowConfiguration {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface BorderRadiusConfig {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface TransitionConfig {
  fast: string;
  normal: string;
  slow: string;
  easing: string;
}

export interface AnimationConfig {
  fadeIn: string;
  slideIn: string;
  bounce: string;
  pulse: string;
}

export interface BrandingOptions {
  logo?: BrandingLogo;
  watermark?: BrandingWatermark;
  customColors?: CustomColorScheme;
  customFonts?: CustomFontScheme;
}

export interface BrandingLogo {
  url: string;
  size: number;
  position: 'header' | 'footer' | 'sidebar';
  opacity: number;
}

export interface BrandingWatermark {
  text: string;
  opacity: number;
  position: 'center' | 'corner' | 'diagonal';
  size: number;
  rotation: number;
}

export interface CustomColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface CustomFontScheme {
  heading: string;
  body: string;
}

// Section configuration
export interface TemplateSection {
  id: string;
  name: string;
  type: SectionType;
  required: boolean;
  order: number;
  styling: SectionStyling;
  layout: SectionLayout;
  content: ContentConfiguration;
  validation: ValidationRules;
  visibility: VisibilityConfig;
}

export enum SectionType {
  PERSONAL_INFO = 'personal-info',
  SUMMARY = 'summary',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  PROJECTS = 'projects',
  CERTIFICATIONS = 'certifications',
  LANGUAGES = 'languages',
  CUSTOM = 'custom'
}

export interface SectionStyling {
  showDates: boolean;
  showLocation: boolean;
  showDuration: boolean;
  bulletPoints: boolean;
  maxItems?: number;
  showProgress?: boolean;
  showLevel?: boolean;
  compact?: boolean;
}

export interface SectionLayout {
  columns: number;
  itemSpacing: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
  orientation: 'vertical' | 'horizontal';
  wrap: boolean;
}

export interface ContentConfiguration {
  fields: FieldConfiguration[];
  placeholders: ContentPlaceholders;
  formatting: FormattingRules;
}

export interface FieldConfiguration {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  maxLength?: number;
  validation?: ValidationRule[];
  formatting?: FieldFormatting;
}

export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  DATE = 'date',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTI_SELECT = 'multi-select',
  BOOLEAN = 'boolean'
}

export interface ValidationRule {
  type: ValidationType;
  message: string;
  pattern?: string;
  min?: number;
  max?: number;
}

export enum ValidationType {
  REQUIRED = 'required',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  MIN_LENGTH = 'min-length',
  MAX_LENGTH = 'max-length',
  PATTERN = 'pattern',
  CUSTOM = 'custom'
}

export interface FieldFormatting {
  uppercase?: boolean;
  lowercase?: boolean;
  titleCase?: boolean;
  phoneFormat?: string;
  dateFormat?: string;
  currency?: string;
}

export interface ContentPlaceholders {
  title: string;
  subtitle: string;
  description: string;
  achievements: string[];
}

export interface FormattingRules {
  autoCapitalization: boolean;
  bulletPointFormatting: boolean;
  dateFormatting: boolean;
  phoneFormatting: boolean;
  urlFormatting: boolean;
}

export interface ValidationRules {
  required: string[];
  optional: string[];
  format: ValidationRule[];
  content: ContentValidationRule[];
}

export interface ContentValidationRule {
  field: string;
  rule: ValidationRule;
  message: string;
}

export interface VisibilityConfig {
  default: boolean;
  conditional?: ConditionalVisibility;
  userOverride: boolean;
}

export interface ConditionalVisibility {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide';
}

// Template features
export interface TemplateFeatures {
  atsOptimized: boolean;
  mobileOptimized: boolean;
  printOptimized: boolean;
  accessibilityFeatures: AccessibilityFeatures;
  interactiveFeatures: InteractiveFeatures;
  premiumFeatures: PremiumFeatures;
}

export interface AccessibilityFeatures {
  wcagCompliant: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigable: boolean;
  highContrastMode: boolean;
  fontScaling: boolean;
}

export interface InteractiveFeatures {
  livePreview: boolean;
  realTimeUpdates: boolean;
  dragAndDrop: boolean;
  collapsibleSections: boolean;
  expandableContent: boolean;
}

export interface PremiumFeatures {
  advancedCustomization: boolean;
  multipleLayouts: boolean;
  customSections: boolean;
  brandColors: boolean;
  prioritySupport: boolean;
}

// ATS optimization
export interface ATSOptimization {
  formatCompliance: boolean;
  keywordDensity: KeywordOptimization;
  structureValidation: StructureRules;
  fontOptimization: FontGuidelines;
  marginGuidelines: MarginRules;
  sectionOrdering: RecommendedOrder;
  testing: ATSTestingResults;
}

export interface KeywordOptimization {
  enabled: boolean;
  targetDensity: number;
  suggestions: KeywordSuggestion[];
  analysis: KeywordAnalysis;
}

export interface KeywordSuggestion {
  keyword: string;
  importance: 'high' | 'medium' | 'low';
  currentDensity: number;
  recommendedDensity: number;
  context: string[];
}

export interface KeywordAnalysis {
  density: number;
  relevance: number;
  placement: KeywordPlacement[];
  missing: string[];
  overused: string[];
}

export interface KeywordPlacement {
  keyword: string;
  section: string;
  position: number;
  context: string;
  score: number;
}

export interface StructureRules {
  strictMode: boolean;
  requiredSections: string[];
  prohibitedElements: string[];
  sectionOrder: string[];
  formatting: FormattingRules;
}

export interface FontGuidelines {
  approvedFonts: string[];
  prohibitedFonts: string[];
  minimumSize: number;
  maximumVariants: number;
  fallbackRequired: boolean;
}

export interface MarginRules {
  minimum: MarginConfig;
  maximum: MarginConfig;
  recommended: MarginConfig;
  units: 'inches' | 'centimeters' | 'points';
}

export interface RecommendedOrder {
  sections: string[];
  reasoning: string;
  flexibility: number; // 0-100, how flexible the ordering is
  industrySpecific: IndustrySpecificOrder[];
}

export interface IndustrySpecificOrder {
  industry: string;
  sections: string[];
  reasoning: string;
}

export interface ATSTestingResults {
  lastTested: Date;
  score: number;
  parser: string;
  issues: ATSIssue[];
  recommendations: string[];
}

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'format' | 'structure' | 'content' | 'fonts';
  description: string;
  suggestion: string;
  autoFixable: boolean;
}

// Customization options
export interface CustomizationOptions {
  colors: ColorCustomization;
  fonts: FontCustomization;
  layout: LayoutCustomization;
  sections: SectionCustomization;
  branding: BrandingCustomization;
  export: ExportCustomization;
}

export interface ColorCustomization {
  themes: ColorTheme[];
  customColors: CustomColorSet[];
  currentTheme: string;
  allowCustom: boolean;
}

export interface ColorTheme {
  id: string;
  name: string;
  colors: ColorConfiguration;
  preview: string;
  accessibility: AccessibilityRating;
}

export enum AccessibilityRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export interface CustomColorSet {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  created: Date;
}

export interface FontCustomization {
  families: FontFamily[];
  sizes: FontSizeCustomization;
  weights: FontWeightCustomization;
  lineHeight: LineHeightCustomization;
}

export interface FontSizeCustomization {
  heading: number[];
  body: number[];
  scale: number; // Multiplier for all sizes
}

export interface FontWeightCustomization {
  heading: number[];
  body: number[];
}

export interface LineHeightCustomization {
  tight: number;
  normal: number;
  relaxed: number;
}

export interface LayoutCustomization {
  spacing: SpacingCustomization;
  margins: MarginCustomization;
  columns: ColumnCustomization;
  alignment: AlignmentCustomization;
}

export interface SpacingCustomization {
  section: number;
  item: number;
  line: number;
  scale: number; // Multiplier for all spacing
}

export interface MarginCustomization {
  top: number;
  right: number;
  bottom: number;
  left: number;
  scale: number; // Multiplier for all margins
}

export interface ColumnCustomization {
  count: number;
  widths: number[];
  gutters: number;
}

export interface AlignmentCustomization {
  header: AlignmentOption;
  sections: AlignmentOption;
  content: AlignmentOption;
}

export enum AlignmentOption {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify'
}

export interface SectionCustomization {
  visibility: SectionVisibility[];
  ordering: SectionOrder[];
  styling: SectionStylingOptions[];
}

export interface SectionVisibility {
  sectionId: string;
  visible: boolean;
  reason?: string;
}

export interface SectionStylingOptions {
  sectionId: string;
  options: Partial<SectionStyling>;
}

export interface BrandingCustomization {
  logo: LogoCustomization;
  watermark: WatermarkCustomization;
  header: HeaderCustomization;
  footer: FooterCustomization;
}

export interface LogoCustomization {
  enabled: boolean;
  url: string;
  size: number;
  position: LogoPosition;
  opacity: number;
}

export enum LogoPosition {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right'
}

export interface WatermarkCustomization {
  enabled: boolean;
  text: string;
  font: string;
  size: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  rotation: number;
}

export enum WatermarkPosition {
  CENTER = 'center',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  DIAGONAL = 'diagonal'
}

export interface HeaderCustomization {
  showName: boolean;
  showContact: boolean;
  layout: HeaderLayout;
  styling: HeaderStyling;
}

export enum HeaderLayout {
  CLASSIC = 'classic',
  MODERN = 'modern',
  COMPACT = 'compact',
  EXPANDED = 'expanded'
}

export interface HeaderStyling {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  alignment?: AlignmentOption;
  borderWidth?: number;
  borderColor?: string;
}

export interface FooterCustomization {
  showPageNumbers: boolean;
  showLastModified: boolean;
  showContact: boolean;
  text: string;
  styling: FooterStyling;
}

export interface FooterStyling {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  alignment?: AlignmentOption;
  borderWidth?: number;
  borderColor?: string;
}

export interface ExportCustomization {
  formats: ExportFormat[];
  quality: ExportQuality;
  options: ExportOptions;
}

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  HTML = 'html',
  TXT = 'txt'
}

export interface ExportQuality {
  pdf: 'screen' | 'print' | 'press';
  images: 'compressed' | 'balanced' | 'high';
  fonts: 'embedded' | 'subset' | 'linked';
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeComments: boolean;
  watermarks: boolean;
  passwordProtection: boolean;
  compression: boolean;
}

// Template metadata
export interface TemplateMetadata {
  version: string;
  author: string;
  created: Date;
  updated: Date;
  tags: string[];
  downloads: number;
  rating: number;
  reviews: number;
  compatibility: TemplateCompatibility[];
  requirements: TemplateRequirements;
  license: TemplateLicense;
}

export interface TemplateCompatibility {
  browser: string;
  version: string;
  supported: boolean;
  notes?: string;
}

export interface TemplateRequirements {
  minBrowserVersion: string;
  features: string[];
  limitations: string[];
}

export interface TemplateLicense {
  type: LicenseType;
  restrictions: string[];
  attribution: boolean;
  commercialUse: boolean;
  modification: boolean;
}

export enum LicenseType {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

// Rendering and export types
export interface RenderedTemplate {
  id: string;
  templateId: string;
  resumeData: Resume;
  customizations: CustomizationOptions;
  rendered: RenderedContent;
  metadata: RenderedMetadata;
}

export interface RenderedContent {
  html: string;
  css: string;
  javascript?: string;
  assets: AssetCollection;
}

export interface AssetCollection {
  fonts: FontAsset[];
  images: ImageAsset[];
  icons: IconAsset[];
}

export interface FontAsset {
  family: string;
  url: string;
  format: string;
  weight: number;
  style: string;
}

export interface ImageAsset {
  url: string;
  alt: string;
  width: number;
  height: number;
  format: string;
}

export interface IconAsset {
  name: string;
  url: string;
  size: number;
  format: string;
}

export interface RenderedMetadata {
  generatedAt: Date;
  renderingTime: number;
  version: string;
  checksum: string;
  size: {
    html: number;
    css: number;
    total: number;
  };
}

// Export result types
export interface ExportResult {
  id: string;
  templateId: string;
  format: ExportFormat;
  url: string;
  fileName: string;
  fileSize: number;
  generatedAt: Date;
  expiresAt: Date;
  metadata: ExportMetadata;
}

export interface ExportMetadata {
  pages: number;
  resolution: string;
  colorSpace: string;
  compression: string;
  optimizedFor: 'screen' | 'print';
}

// Template system types
export interface TemplateSystem {
  templates: ResumeTemplate[];
  registry: TemplateRegistry;
  renderer: TemplateRenderer;
  customizer: TemplateCustomizer;
  exporter: TemplateExporter;
}

export interface TemplateRegistry {
  register: (template: ResumeTemplate) => void;
  unregister: (templateId: string) => void;
  get: (templateId: string) => ResumeTemplate | null;
  list: (filters?: TemplateFilters) => ResumeTemplate[];
  search: (query: string) => ResumeTemplate[];
}

export interface TemplateFilters {
  category?: TemplateCategory;
  subcategory?: string;
  features?: string[];
  atsOptimized?: boolean;
  mobileOptimized?: boolean;
  premium?: boolean;
}

export interface TemplateRenderer {
  render: (templateId: string, data: Resume, options?: RenderOptions) => Promise<RenderedTemplate>;
  preview: (templateId: string, data?: Partial<Resume>) => Promise<string>;
  validate: (templateId: string, data: Resume) => ValidationResult;
}

export interface RenderOptions {
  format?: 'html' | 'preview';
  customizations?: CustomizationOptions;
  optimization?: RenderOptimization;
}

export interface RenderOptimization {
  minify: boolean;
  inlineCSS: boolean;
  embedImages: boolean;
  subsetFonts: boolean;
}

export interface TemplateCustomizer {
  customize: (templateId: string, customizations: CustomizationOptions) => Promise<ResumeTemplate>;
  reset: (templateId: string) => Promise<ResumeTemplate>;
  preview: (templateId: string, customizations: CustomizationOptions) => Promise<string>;
  validate: (customizations: CustomizationOptions) => ValidationResult;
}

export interface TemplateExporter {
  export: (renderedTemplate: RenderedTemplate, format: ExportFormat, options?: ExportOptions) => Promise<ExportResult>;
  batchExport: (renderedTemplates: RenderedTemplate[], format: ExportFormat, options?: ExportOptions) => Promise<ExportResult[]>;
  getSupportedFormats: () => ExportFormat[];
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'warning';
  suggestion?: string;
}

// Analytics and monitoring types
export interface TemplateAnalytics {
  usage: TemplateUsageStats;
  performance: TemplatePerformanceStats;
  feedback: TemplateFeedbackStats;
  trends: TemplateTrends;
}

export interface TemplateUsageStats {
  totalUses: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  conversionRate: number;
  popularCustomizations: PopularCustomization[];
}

export interface PopularCustomization {
  customization: string;
  count: number;
  percentage: number;
}

export interface TemplatePerformanceStats {
  renderTime: number;
  exportTime: number;
  errorRate: number;
  successRate: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  bandwidth: number;
}

export interface TemplateFeedbackStats {
  rating: number;
  reviews: Review[];
  commonIssues: CommonIssue[];
  suggestions: string[];
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface CommonIssue {
  issue: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface TemplateTrends {
  popularityTrend: TrendData[];
  featureAdoption: FeatureAdoptionData[];
  seasonalUsage: SeasonalUsageData[];
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
}

export interface FeatureAdoptionData {
  feature: string;
  adoptionRate: number;
  trend: TrendData[];
}

export interface SeasonalUsageData {
  month: number;
  year: number;
  usage: number;
  growth: number;
}

// Error handling types
export interface TemplateError {
  code: TemplateErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  templateId?: string;
  userId?: string;
}

export enum TemplateErrorCode {
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  RENDER_FAILED = 'RENDER_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  CUSTOMIZATION_INVALID = 'CUSTOMIZATION_INVALID',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR'
}

// Event types
export interface TemplateEvent {
  type: TemplateEventType;
  templateId: string;
  userId?: string;
  data: any;
  timestamp: Date;
}

export enum TemplateEventType {
  TEMPLATE_VIEWED = 'template_viewed',
  TEMPLATE_SELECTED = 'template_selected',
  TEMPLATE_CUSTOMIZED = 'template_customized',
  TEMPLATE_EXPORTED = 'template_exported',
  TEMPLATE_SHARED = 'template_shared',
  CUSTOMIZATION_SAVED = 'customization_saved',
  RENDER_STARTED = 'render_started',
  RENDER_COMPLETED = 'render_completed',
  EXPORT_STARTED = 'export_started',
  EXPORT_COMPLETED = 'export_completed',
  ERROR_OCCURRED = 'error_occurred'
}

// Configuration types
export interface TemplateSystemConfig {
  maxConcurrentRenders: number;
  defaultCacheSize: number;
  exportTimeout: number;
  renderTimeout: number;
  enableAnalytics: boolean;
  enableMonitoring: boolean;
  assetBaseUrl: string;
  cdnBaseUrl: string;
  fallbackTemplate: string;
}

// Default configurations
export const DEFAULT_TEMPLATE_CONFIG: TemplateSystemConfig = {
  maxConcurrentRenders: 10,
  defaultCacheSize: 100,
  exportTimeout: 30000, // 30 seconds
  renderTimeout: 10000, // 10 seconds
  enableAnalytics: true,
  enableMonitoring: true,
  assetBaseUrl: '/assets/templates',
  cdnBaseUrl: 'https://cdn.jobfinders.com/templates',
  fallbackTemplate: 'professional-minimal'
};

export const DEFAULT_LAYOUT: TemplateLayout = {
  format: LayoutFormat.SINGLE_COLUMN,
  headerStyle: HeaderStyle.CENTERED,
  sectionOrder: [
    { id: 'personal-info', name: 'Contact Information', required: true, order: 1, visible: true },
    { id: 'summary', name: 'Professional Summary', required: false, order: 2, visible: true },
    { id: 'experience', name: 'Work Experience', required: true, order: 3, visible: true },
    { id: 'education', name: 'Education', required: true, order: 4, visible: true },
    { id: 'skills', name: 'Skills', required: true, order: 5, visible: true },
    { id: 'projects', name: 'Projects', required: false, order: 6, visible: true },
    { id: 'certifications', name: 'Certifications', required: false, order: 7, visible: true },
    { id: 'languages', name: 'Languages', required: false, order: 8, visible: true }
  ],
  spacing: {
    section: 24,
    item: 12,
    line: 1.5,
    margin: { top: 1, right: 1, bottom: 1, left: 1 },
    padding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
  },
  dimensions: {
    width: 8.5,
    height: 11,
    margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    orientation: 'portrait'
  },
  responsiveness: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
    large: 1440
  },
  columns: {
    count: 1,
    widths: [100],
    gutters: 20,
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200,
      large: 1440
    }
  }
};

export const DEFAULT_STYLING: TemplateStyling = {
  fonts: {
    heading: {
      name: 'Inter',
      stack: ['Inter', 'system-ui', 'sans-serif'],
      weights: [
        { weight: 300, name: 'Light' },
        { weight: 400, name: 'Regular' },
        { weight: 500, name: 'Medium' },
        { weight: 600, name: 'Semibold' },
        { weight: 700, name: 'Bold' }
      ]
    },
    body: {
      name: 'Inter',
      stack: ['Inter', 'system-ui', 'sans-serif'],
      weights: [
        { weight: 300, name: 'Light' },
        { weight: 400, name: 'Regular' },
        { weight: 500, name: 'Medium' }
      ]
    },
    accents: {
      name: 'Inter',
      stack: ['Inter', 'system-ui', 'sans-serif'],
      weights: [
        { weight: 500, name: 'Medium' },
        { weight: 600, name: 'Semibold' }
      ]
    },
    fallbacks: [
      { category: 'sans-serif', fonts: ['Arial', 'Helvetica', 'sans-serif'] },
      { category: 'serif', fonts: ['Georgia', 'Times New Roman', 'serif'] }
    ]
  },
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    accent: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
      muted: '#94a3b8',
      accent: '#3b82f6'
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      accent: '#eff6ff'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  sizes: {
    heading: {
      h1: 48,
      h2: 36,
      h3: 30,
      h4: 24,
      h5: 20,
      h6: 16
    },
    body: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
      '3xl': 64
    },
    borders: {
      none: 0,
      sm: 1,
      md: 2,
      lg: 4,
      xl: 8
    }
  },
  effects: {
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    },
    borderRadius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999
    },
    transitions: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    animations: {
      fadeIn: 'fadeIn 0.3s ease-in-out',
      slideIn: 'slideIn 0.3s ease-out',
      bounce: 'bounce 0.5s ease-in-out',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }
  },
  branding: {}
};

export const DEFAULT_FEATURES: TemplateFeatures = {
  atsOptimized: true,
  mobileOptimized: true,
  printOptimized: true,
  accessibilityFeatures: {
    wcagCompliant: true,
    screenReaderOptimized: true,
    keyboardNavigable: true,
    highContrastMode: false,
    fontScaling: true
  },
  interactiveFeatures: {
    livePreview: true,
    realTimeUpdates: true,
    dragAndDrop: false,
    collapsibleSections: false,
    expandableContent: false
  },
  premiumFeatures: {
    advancedCustomization: false,
    multipleLayouts: false,
    customSections: false,
    brandColors: false,
    prioritySupport: false
  }
};

export const DEFAULT_ATS_OPTIMIZATION: ATSOptimization = {
  formatCompliance: true,
  keywordDensity: {
    enabled: true,
    targetDensity: 2.5,
    suggestions: [],
    analysis: {
      density: 0,
      relevance: 0,
      placement: [],
      missing: [],
      overused: []
    }
  },
  structureValidation: {
    strictMode: false,
    requiredSections: ['personal-info', 'experience', 'education', 'skills'],
    prohibitedElements: ['tables', 'columns', 'images'],
    sectionOrder: ['personal-info', 'summary', 'experience', 'education', 'skills'],
    formatting: {
      autoCapitalization: true,
      bulletPointFormatting: true,
      dateFormatting: true,
      phoneFormatting: true,
      urlFormatting: true
    }
  },
  fontOptimization: {
    approvedFonts: ['Arial', 'Calibri', 'Georgia', 'Helvetica', 'Times New Roman'],
    prohibitedFonts: ['Comic Sans', 'Brush Script', 'Papyrus'],
    minimumSize: 10,
    maximumVariants: 4,
    fallbackRequired: true
  },
  marginGuidelines: {
    minimum: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    maximum: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
    recommended: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    units: 'inches'
  },
  sectionOrdering: {
    sections: ['personal-info', 'summary', 'experience', 'education', 'skills'],
    reasoning: 'Standard reverse-chronological format preferred by most ATS',
    flexibility: 80,
    industrySpecific: []
  },
  testing: {
    lastTested: new Date(),
    score: 95,
    parser: 'Resume Parser v2.1',
    issues: [],
    recommendations: []
  }
};