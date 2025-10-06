import { ScoreBreakdown, MatchExplanation, ProfileMatchResult } from '@/types/matching';
import { SUPPORTED_LANGUAGES } from '@/lib/config/languages';

/**
 * Generates human-readable explanations for match scores
 */
export class ExplanationGenerator {
  /**
   * Generates comprehensive explanation for a match result
   */
  static generateExplanation(
    breakdown: ScoreBreakdown,
    candidateProfile: any,
    jobProfile: any,
    language: string = 'en'
  ): MatchExplanation {
    const t = this.getTranslator(language);

    // Generate factor explanations
    const factorExplanations = this.generateFactorExplanations(breakdown, t);

    // Generate summary
    const summary = this.generateSummary(breakdown, t);

    // Generate recommendations
    const recommendations = this.generateRecommendations(breakdown, candidateProfile, jobProfile, t);

    // Calculate strengths and weaknesses
    const strengths = this.identifyStrengths(breakdown, factorExplanations);
    const weaknesses = this.identifyWeaknesses(breakdown, factorExplanations);

    return {
      summary,
      factorExplanations,
      strengths,
      weaknesses,
      recommendations,
      language
    };
  }

  /**
   * Generates explanation for profile completeness
   */
  static generateCompletenessExplanation(
    completionScore: number,
    missingFields: string[],
    language: string = 'en'
  ): string {
    const t = this.getTranslator(language);

    if (completionScore >= 90) {
      return t('explanation.completeness.excellent', {
        score: completionScore.toFixed(1)
      });
    } else if (completionScore >= 75) {
      return t('explanation.completeness.good', {
        score: completionScore.toFixed(1),
        fields: missingFields.slice(0, 3).join(', ')
      });
    } else if (completionScore >= 60) {
      return t('explanation.completeness.fair', {
        score: completionScore.toFixed(1),
        fields: missingFields.join(', ')
      });
    } else {
      return t('explanation.completeness.poor', {
        score: completionScore.toFixed(1),
        fields: missingFields.join(', ')
      });
    }
  }

  /**
   * Generates explanations for each scoring factor
   */
  private static generateFactorExplanations(
    breakdown: ScoreBreakdown,
    t: (key: string, params?: any) => string
  ): Array<{ factor: string; score: number; explanation: string; impact: string }> {
    const factors = [];

    // Skills explanation
    if (breakdown.skills !== undefined) {
      const skillsExplanation = this.generateSkillsExplanation(breakdown.skills, t);
      factors.push({
        factor: 'skills',
        score: breakdown.skills,
        explanation: skillsExplanation.explanation,
        impact: skillsExplanation.impact
      });
    }

    // Experience explanation
    if (breakdown.experience !== undefined) {
      const experienceExplanation = this.generateExperienceExplanation(breakdown.experience, t);
      factors.push({
        factor: 'experience',
        score: breakdown.experience,
        explanation: experienceExplanation.explanation,
        impact: experienceExplanation.impact
      });
    }

    // Education explanation
    if (breakdown.education !== undefined) {
      const educationExplanation = this.generateEducationExplanation(breakdown.education, t);
      factors.push({
        factor: 'education',
        score: breakdown.education,
        explanation: educationExplanation.explanation,
        impact: educationExplanation.impact
      });
    }

    // Location explanation
    if (breakdown.location !== undefined) {
      const locationExplanation = this.generateLocationExplanation(breakdown.location, t);
      factors.push({
        factor: 'location',
        score: breakdown.location,
        explanation: locationExplanation.explanation,
        impact: locationExplanation.impact
      });
    }

    // Preferences explanation
    if (breakdown.preferences !== undefined) {
      const preferencesExplanation = this.generatePreferencesExplanation(breakdown.preferences, t);
      factors.push({
        factor: 'preferences',
        score: breakdown.preferences,
        explanation: preferencesExplanation.explanation,
        impact: preferencesExplanation.impact
      });
    }

    // Salary explanation
    if (breakdown.salary !== undefined) {
      const salaryExplanation = this.generateSalaryExplanation(breakdown.salary, t);
      factors.push({
        factor: 'salary',
        score: breakdown.salary,
        explanation: salaryExplanation.explanation,
        impact: salaryExplanation.impact
      });
    }

    // Cultural fit explanation
    if (breakdown.culturalFit !== undefined) {
      const culturalExplanation = this.generateCulturalFitExplanation(breakdown.culturalFit, t);
      factors.push({
        factor: 'culturalFit',
        score: breakdown.culturalFit,
        explanation: culturalExplanation.explanation,
        impact: culturalExplanation.impact
      });
    }

    // AI prediction explanation
    if (breakdown.aiPrediction !== undefined) {
      const aiExplanation = this.generateAIPredictionExplanation(breakdown.aiPrediction, t);
      factors.push({
        factor: 'aiPrediction',
        score: breakdown.aiPrediction,
        explanation: aiExplanation.explanation,
        impact: aiExplanation.impact
      });
    }

    return factors.sort((a, b) => b.score - a.score);
  }

  /**
   * Generates skills scoring explanation
   */
  private static generateSkillsExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.skills.excellent', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_high');
    } else if (score >= 75) {
      explanation = t('explanation.skills.good', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 60) {
      explanation = t('explanation.skills.moderate', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 40) {
      explanation = t('explanation.skills.limited', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    } else {
      explanation = t('explanation.skills.poor', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_low');
    }

    return { explanation, impact };
  }

  /**
   * Generates experience scoring explanation
   */
  private static generateExperienceExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.experience.perfect', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_high');
    } else if (score >= 75) {
      explanation = t('explanation.experience.strong', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 60) {
      explanation = t('explanation.experience.suitable', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 40) {
      explanation = t('explanation.experience.limited', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    } else {
      explanation = t('explanation.experience.insufficient', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_low');
    }

    return { explanation, impact };
  }

  /**
   * Generates education scoring explanation
   */
  private static generateEducationExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.education.ideal', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_high');
    } else if (score >= 75) {
      explanation = t('explanation.education.strong', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 60) {
      explanation = t('explanation.education.acceptable', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 40) {
      explanation = t('explanation.education.basic', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    } else {
      explanation = t('explanation.education.inadequate', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_low');
    }

    return { explanation, impact };
  }

  /**
   * Generates location scoring explanation
   */
  private static generateLocationExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.location.perfect', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 75) {
      explanation = t('explanation.location.excellent', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 60) {
      explanation = t('explanation.location.good', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 40) {
      explanation = t('explanation.location.challenging', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    } else {
      explanation = t('explanation.location.difficult', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_low');
    }

    return { explanation, impact };
  }

  /**
   * Generates preferences scoring explanation
   */
  private static generatePreferencesExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.preferences.excellent', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 75) {
      explanation = t('explanation.preferences.good', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 60) {
      explanation = t('explanation.preferences.acceptable', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else {
      explanation = t('explanation.preferences.poor', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    }

    return { explanation, impact };
  }

  /**
   * Generates salary scoring explanation
   */
  private static generateSalaryExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.salary.excellent', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 75) {
      explanation = t('explanation.salary.good', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 60) {
      explanation = t('explanation.salary.acceptable', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else {
      explanation = t('explanation.salary.challenging', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    }

    return { explanation, impact };
  }

  /**
   * Generates cultural fit scoring explanation
   */
  private static generateCulturalFitExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.cultural.excellent', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 75) {
      explanation = t('explanation.cultural.good', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 60) {
      explanation = t('explanation.cultural.acceptable', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else {
      explanation = t('explanation.cultural.limited', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    }

    return { explanation, impact };
  }

  /**
   * Generates AI prediction scoring explanation
   */
  private static generateAIPredictionExplanation(
    score: number,
    t: (key: string, params?: any) => string
  ): { explanation: string; impact: string } {
    let explanation, impact;

    if (score >= 90) {
      explanation = t('explanation.ai.very_promising', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_high');
    } else if (score >= 75) {
      explanation = t('explanation.ai.promising', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.high');
    } else if (score >= 60) {
      explanation = t('explanation.ai.potential', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.moderate');
    } else if (score >= 40) {
      explanation = t('explanation.ai.uncertain', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.low');
    } else {
      explanation = t('explanation.ai.risky', {
        score: score.toFixed(1)
      });
      impact = t('explanation.impact.very_low');
    }

    return { explanation, impact };
  }

  /**
   * Generates overall match summary
   */
  private static generateSummary(
    breakdown: ScoreBreakdown,
    t: (key: string, params?: any) => string
  ): string {
    const totalScore = this.calculateTotalScore(breakdown);

    if (totalScore >= 90) {
      return t('explanation.summary.outstanding', {
        score: totalScore.toFixed(1)
      });
    } else if (totalScore >= 80) {
      return t('explanation.summary.excellent', {
        score: totalScore.toFixed(1)
      });
    } else if (totalScore >= 70) {
      return t('explanation.summary.strong', {
        score: totalScore.toFixed(1)
      });
    } else if (totalScore >= 60) {
      return t('explanation.summary.good', {
        score: totalScore.toFixed(1)
      });
    } else if (totalScore >= 50) {
      return t('explanation.summary.moderate', {
        score: totalScore.toFixed(1)
      });
    } else {
      return t('explanation.summary.poor', {
        score: totalScore.toFixed(1)
      });
    }
  }

  /**
   * Generates actionable recommendations
   */
  private static generateRecommendations(
    breakdown: ScoreBreakdown,
    candidateProfile: any,
    jobProfile: any,
    t: (key: string, params?: any) => string
  ): string[] {
    const recommendations: string[] = [];

    // Skills recommendations
    if (breakdown.skills && breakdown.skills < 70) {
      recommendations.push(t('recommendations.skills.improve'));
    }

    // Experience recommendations
    if (breakdown.experience && breakdown.experience < 60) {
      recommendations.push(t('recommendations.experience.gain_more'));
    }

    // Education recommendations
    if (breakdown.education && breakdown.education < 60) {
      recommendations.push(t('recommendations.education.enhance'));
    }

    // Location recommendations
    if (breakdown.location && breakdown.location < 50) {
      recommendations.push(t('recommendations.location.consider_relocation'));
    }

    // Salary recommendations
    if (breakdown.salary && breakdown.salary < 60) {
      recommendations.push(t('recommendations.salary.negotiate'));
    }

    // General recommendations
    const totalScore = this.calculateTotalScore(breakdown);
    if (totalScore < 50) {
      recommendations.push(t('recommendations.general.significant_improvements'));
    } else if (totalScore < 70) {
      recommendations.push(t('recommendations.general.targeted_improvements'));
    }

    return recommendations;
  }

  /**
   * Identifies strengths from the breakdown
   */
  private static identifyStrengths(
    breakdown: ScoreBreakdown,
    factorExplanations: Array<{ factor: string; score: number; explanation: string; impact: string }>
  ): string[] {
    return factorExplanations
      .filter(factor => factor.score >= 75)
      .map(factor => factor.explanation);
  }

  /**
   * Identifies weaknesses from the breakdown
   */
  private static identifyWeaknesses(
    breakdown: ScoreBreakdown,
    factorExplanations: Array<{ factor: string; score: number; explanation: string; impact: string }>
  ): string[] {
    return factorExplanations
      .filter(factor => factor.score < 60)
      .map(factor => factor.explanation);
  }

  /**
   * Calculates total score from breakdown
   */
  private static calculateTotalScore(breakdown: ScoreBreakdown): number {
    const scores = Object.values(breakdown).filter(score => typeof score === 'number') as number[];
    if (scores.length === 0) return 0;

    // Simple average - in real implementation, this would use weights
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Gets translator function for the specified language
   */
  private static getTranslator(language: string): (key: string, params?: any) => string {
    // In a real implementation, this would use a proper i18n library
    // For now, return a simple implementation that returns English text
    return (key: string, params?: any) => {
      const translations: Record<string, string> = {
        // Explanations
        'explanation.completeness.excellent': `Profile completeness is excellent at {{score}}%. All required fields are filled.`,
        'explanation.completeness.good': `Profile completeness is good at {{score}}%. Consider adding: {{fields}}.`,
        'explanation.completeness.fair': `Profile completeness is fair at {{score}}%. Missing important fields: {{fields}}.`,
        'explanation.completeness.poor': `Profile completeness is poor at {{score}}%. Please complete: {{fields}}.`,

        // Skills explanations
        'explanation.skills.excellent': `Outstanding skills match at {{score}}%. Candidate possesses most or all required skills.`,
        'explanation.skills.good': `Strong skills alignment at {{score}}%. Candidate has most required skills with some additional expertise.`,
        'explanation.skills.moderate': `Modererate skills match at {{score}}%. Candidate has some required skills but gaps exist.`,
        'explanation.skills.limited': `Limited skills alignment at {{score}}%. Candidate has few of the required skills.`,
        'explanation.skills.poor': `Poor skills match at {{score}}%. Candidate lacks most required skills.`,

        // Experience explanations
        'explanation.experience.perfect': `Perfect experience match at {{score}}%. Candidate's experience level exactly matches requirements.`,
        'explanation.experience.strong': `Strong experience fit at {{score}}%. Candidate has relevant experience that exceeds requirements.`,
        'explanation.experience.suitable': `Suitable experience level at {{score}}%. Candidate meets minimum experience requirements.`,
        'explanation.experience.limited': `Limited experience at {{score}}%. Candidate has some relevant experience but may need more.`,
        'explanation.experience.insufficient': `Insufficient experience at {{score}}%. Candidate lacks the required experience level.`,

        // Education explanations
        'explanation.education.ideal': `Ideal educational background at {{score}}%. Candidate exceeds educational requirements.`,
        'explanation.education.strong': `Strong educational fit at {{score}}%. Candidate meets or exceeds education requirements.`,
        'explanation.education.acceptable': `Acceptable education level at {{score}}%. Candidate meets minimum education requirements.`,
        'explanation.education.basic': `Basic education match at {{score}}%. Candidate has some relevant education but may lack requirements.`,
        'explanation.education.inadequate': `Inquate education at {{score}}%. Candidate lacks required educational qualifications.`,

        // Location explanations
        'explanation.location.perfect': `Perfect location match at {{score}}%. Candidate is in ideal location for this position.`,
        'explanation.location.excellent': `Excellent location fit at {{score}}%. Candidate is very well-located for this role.`,
        'explanation.location.good': `Good location compatibility at {{score}}%. Candidate's location is suitable for this position.`,
        'explanation.location.challenging': `Challenging location at {{score}}%. Candidate may face commuting or relocation challenges.`,
        'explanation.location.difficult': `Difficult location situation at {{score}}%. Significant location challenges exist.`,

        // Preferences explanations
        'explanation.preferences.excellent': `Excellent preference alignment at {{score}}%. Job matches candidate's work preferences perfectly.`,
        'explanation.preferences.good': `Good preference fit at {{score}}%. Job aligns well with candidate's preferences.`,
        'explanation.preferences.acceptable': `Acceptable preference match at {{score}}%. Job reasonably matches candidate's preferences.`,
        'explanation.preferences.poor': `Poor preference alignment at {{score}}%. Job may not match candidate's work preferences.`,

        // Salary explanations
        'explanation.salary.excellent': `Excellent salary alignment at {{score}}%. Salary expectations are well-aligned.`,
        'explanation.salary.good': `Good salary compatibility at {{score}}%. Salary expectations are reasonably aligned.`,
        'explanation.salary.acceptable': `Acceptable salary match at {{score}}%. Some negotiation may be needed.`,
        'explanation.salary.challenging': `Challenging salary alignment at {{score}}%. Significant salary negotiation expected.`,

        // Cultural fit explanations
        'explanation.cultural.excellent': `Excellent cultural fit at {{score}}%. Strong alignment with company culture and values.`,
        'explanation.cultural.good': `Good cultural compatibility at {{score}}%. Good fit with company culture.`,
        'explanation.cultural.acceptable': `Acceptable cultural fit at {{score}}%. Reasonable alignment with company culture.`,
        'explanation.cultural.limited': `Limited cultural fit at {{score}}%. May face cultural integration challenges.`,

        // AI prediction explanations
        'explanation.ai.very_promising': `AI predicts very promising match at {{score}}%. High potential for successful placement.`,
        'explanation.ai.promising': `AI predicts promising match at {{score}}%. Good potential for success.`,
        'explanation.ai.potential': `AI sees potential at {{score}}%. Match has reasonable success potential.`,
        'explanation.ai.uncertain': `AI prediction uncertain at {{score}}%. Success potential unclear.`,
        'explanation.ai.risky': `AI predicts risky match at {{score}}%. Higher chance of placement failure.`,

        // Impact levels
        'explanation.impact.very_high': 'Very High Impact',
        'explanation.impact.high': 'High Impact',
        'explanation.impact.moderate': 'Moderate Impact',
        'explanation.impact.low': 'Low Impact',
        'explanation.impact.very_low': 'Very Low Impact',

        // Summaries
        'explanation.summary.outstanding': 'Outstanding match at {{score}}%. This candidate appears to be an excellent fit for the position with strong alignment across all key dimensions.',
        'explanation.summary.excellent': 'Excellent match at {{score}}%. This candidate demonstrates strong qualifications and good alignment with position requirements.',
        'explanation.summary.strong': 'Strong match at {{score}}%. This candidate shows good potential and meets most key requirements.',
        'explanation.summary.good': 'Good match at {{score}}%. This candidate has solid qualifications and reasonable alignment with the position.',
        'explanation.summary.moderate': 'Moderate match at {{score}}%. This candidate has some relevant qualifications but may have gaps in key areas.',
        'explanation.summary.poor': 'Poor match at {{score}}%. This candidate has significant misalignment with position requirements.',

        // Recommendations
        'recommendations.skills.improve': 'Focus on developing missing key skills through training or certification.',
        'recommendations.experience.gain_more': 'Gain more relevant experience in similar roles or industries.',
        'recommendations.education.enhance': 'Consider additional education or certifications to strengthen qualifications.',
        'recommendations.location.consider_relocation': 'Consider relocation options or remote work possibilities.',
        'recommendations.salary.negotiate': 'Be prepared to discuss salary expectations and negotiate compensation.',
        'recommendations.general.significant_improvements': 'Significant improvements needed across multiple areas to be competitive.',
        'recommendations.general.targeted_improvements': 'Targeted improvements in specific areas could enhance candidacy.'
      };

      let text = translations[key] || key;

      // Replace parameters
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
        });
      }

      return text;
    };
  }
}

export default ExplanationGenerator;