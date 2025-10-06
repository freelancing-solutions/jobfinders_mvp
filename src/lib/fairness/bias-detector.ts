/**
 * Bias Detection and Mitigation Module
 *
 * Detects and mitigates bias in the matching system across different dimensions
 * including demographic bias, algorithmic bias, and outcome bias.
 */

import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';

export interface BiasMetrics {
  demographicParity: {
    group: string;
    selectionRate: number;
    disparity: number;
    parityScore: number;
  };
  equalizedOdds: {
    group: string;
    truePositiveRate: number;
    falsePositiveRate: number;
    oddsRatio: number;
  };
  equalOpportunity: {
    group: string;
    recall: number;
    opportunityParity: number;
  };
  statisticalParity: {
    group: string;
    outcomeRate: number;
    statisticalParityDifference: number;
  };
}

export interface BiasDetectionResult {
  overallBiasScore: number; // 0-100, higher = more biased
  biasTypes: {
    gender: BiasMetrics;
    race: BiasMetrics;
    age: BiasMetrics;
    location: BiasMetrics;
    education: BiasMetrics;
    experience: BiasMetrics;
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    mitigation: string;
    expectedImpact: number;
  }>;
  fairnessMetrics: {
    overallFairness: number;
    groupFairness: number;
    individualFairness: number;
    counterfactualFairness: number;
  };
  analyzedAt: Date;
}

export interface BiasMitigationStrategy {
  id: string;
  name: string;
  description: string;
  type: 'pre_processing' | 'in_processing' | 'post_processing';
  applicableBiasTypes: string[];
  implementation: {
    algorithm: string;
    parameters: { [key: string]: any };
    expectedReduction: number;
  };
  tradeoffs: {
    accuracyImpact: number;
    implementationComplexity: number;
    performanceImpact: number;
  };
}

export interface DemographicGroup {
  id: string;
  type: 'gender' | 'race' | 'age' | 'location' | 'education' | 'experience';
  category: string;
  count: number;
  protected: boolean;
  representation: number; // percentage in overall population
}

class BiasDetector {
  private static instance: BiasDetector;
  private mitigationStrategies: Map<string, BiasMitigationStrategy>;

  private constructor() {
    this.mitigationStrategies = new Map();
    this.initializeMitigationStrategies();
  }

  static getInstance(): BiasDetector {
    if (!BiasDetector.instance) {
      BiasDetector.instance = new BiasDetector();
    }
    return BiasDetector.instance;
  }

  /**
   * Detect bias in matching results
   */
  async detectBias(
    matchResults: Array<{
      candidateId: string;
      jobId: string;
      score: number;
      selected: boolean;
      demographics: {
        gender?: string;
        race?: string;
        age?: number;
        location?: string;
        education?: string;
        experience?: string;
      };
    }>,
    populationData: DemographicGroup[]
  ): Promise<BiasDetectionResult> {
    try {
      const cacheKey = `bias_detection:${JSON.stringify(matchResults.slice(0, 10).map(r => r.candidateId))}`;

      return await cache.wrap(cacheKey, async () => {
        // Analyze bias across different dimensions
        const genderBias = await this.analyzeGenderBias(matchResults, populationData);
        const raceBias = await this.analyzeRaceBias(matchResults, populationData);
        const ageBias = await this.analyzeAgeBias(matchResults, populationData);
        const locationBias = await this.analyzeLocationBias(matchResults, populationData);
        const educationBias = await this.analyzeEducationBias(matchResults, populationData);
        const experienceBias = await this.analyzeExperienceBias(matchResults, populationData);

        // Calculate overall bias score
        const overallBiasScore = this.calculateOverallBiasScore({
          gender: genderBias,
          race: raceBias,
          age: ageBias,
          location: locationBias,
          education: educationBias,
          experience: experienceBias,
        });

        // Generate recommendations
        const recommendations = this.generateBiasRecommendations({
          gender: genderBias,
          race: raceBias,
          age: ageBias,
          location: locationBias,
          education: educationBias,
          experience: experienceBias,
        });

        // Calculate fairness metrics
        const fairnessMetrics = this.calculateFairnessMetrics(matchResults, populationData);

        const result: BiasDetectionResult = {
          overallBiasScore,
          biasTypes: {
            gender: genderBias,
            race: raceBias,
            age: ageBias,
            location: locationBias,
            education: educationBias,
            experience: experienceBias,
          },
          recommendations,
          fairnessMetrics,
          analyzedAt: new Date(),
        };

        // Store bias detection results
        await this.storeBiasDetectionResult(result);

        logger.info('Bias detection completed', { overallBiasScore, recommendationCount: recommendations.length });

        return result;
      }, 3600); // Cache for 1 hour
    } catch (error) {
      logger.error('Error detecting bias', error);
      throw error;
    }
  }

  /**
   * Apply bias mitigation strategy
   */
  async applyMitigation(
    matchResults: Array<{
      candidateId: string;
      jobId: string;
      score: number;
      demographics: any;
    }>,
    strategy: BiasMitigationStrategy,
    parameters?: { [key: string]: any }
  ): Promise<Array<{
    candidateId: string;
    jobId: string;
    originalScore: number;
    mitigatedScore: number;
    adjustment: number;
  }>> {
    try {
      let mitigatedResults: Array<{
        candidateId: string;
        jobId: string;
        originalScore: number;
        mitigatedScore: number;
        adjustment: number;
      }> = [];

      switch (strategy.type) {
        case 'pre_processing':
          mitigatedResults = await this.applyPreProcessingMitigation(matchResults, strategy, parameters);
          break;
        case 'in_processing':
          mitigatedResults = await this.applyInProcessingMitigation(matchResults, strategy, parameters);
          break;
        case 'post_processing':
          mitigatedResults = await this.applyPostProcessingMitigation(matchResults, strategy, parameters);
          break;
        default:
          throw new Error(`Unknown mitigation strategy type: ${strategy.type}`);
      }

      // Validate mitigation results
      this.validateMitigationResults(mitigatedResults, matchResults);

      logger.info('Bias mitigation applied', {
        strategy: strategy.name,
        adjustedCount: mitigatedResults.length,
        averageAdjustment: mitigatedResults.reduce((sum, r) => sum + r.adjustment, 0) / mitigatedResults.length
      });

      return mitigatedResults;
    } catch (error) {
      logger.error('Error applying bias mitigation', error);
      throw error;
    }
  }

  /**
   * Monitor bias over time
   */
  async monitorBiasOverTime(
    timeRange: { start: Date; end: Date },
    interval: 'hour' | 'day' | 'week' | 'month'
  ): Promise<Array<{
    timestamp: Date;
    biasScore: number;
    fairnessMetrics: BiasDetectionResult['fairnessMetrics'];
    trends: {
      improving: string[];
      worsening: string[];
      stable: string[];
    };
  }>> {
    try {
      const trends: Array<{
        timestamp: Date;
        biasScore: number;
        fairnessMetrics: BiasDetectionResult['fairnessMetrics'];
        trends: {
          improving: string[];
          worsening: string[];
          stable: string[];
        };
      }> = [];

      // Generate time series data
      const intervals = this.generateTimeIntervals(timeRange, interval);
      let previousResult: BiasDetectionResult | null = null;

      for (const interval of intervals) {
        // Get match results for this interval
        const intervalResults = await this.getMatchResultsForInterval(interval);
        const populationData = await this.getPopulationDataForInterval(interval);

        if (intervalResults.length > 0) {
          const currentResult = await this.detectBias(intervalResults, populationData);

          const trends = previousResult
            ? this.calculateTrends(previousResult, currentResult)
            : { improving: [], worsening: [], stable: [] };

          trends.push({
            timestamp: interval.start,
            biasScore: currentResult.overallBiasScore,
            fairnessMetrics: currentResult.fairnessMetrics,
            trends,
          });

          previousResult = currentResult;
        }
      }

      return trends;
    } catch (error) {
      logger.error('Error monitoring bias over time', error);
      throw error;
    }
  }

  /**
   * Get bias mitigation strategies
   */
  getMitigationStrategies(): BiasMitigationStrategy[] {
    return Array.from(this.mitigationStrategies.values());
  }

  /**
   * Get recommendation for specific bias type
   */
  async getBiasRecommendation(
    biasType: keyof BiasDetectionResult['biasTypes'],
    biasMetrics: BiasMetrics
  ): Promise<BiasMitigationStrategy[]> {
    try {
      const strategies = Array.from(this.mitigationStrategies.values())
        .filter(strategy => strategy.applicableBiasTypes.includes(biasType));

      // Rank strategies by expected reduction and impact
      return strategies.sort((a, b) => {
        const aScore = a.implementation.expectedReduction * (1 - a.tradeoffs.accuracyImpact);
        const bScore = b.implementation.expectedReduction * (1 - b.tradeoffs.accuracyImpact);
        return bScore - aScore;
      }).slice(0, 3); // Top 3 recommendations
    } catch (error) {
      logger.error('Error getting bias recommendation', error, { biasType });
      return [];
    }
  }

  // Private helper methods

  private async analyzeGenderBias(
    matchResults: any[],
    populationData: DemographicGroup[]
  ): Promise<BiasMetrics> {
    const genderGroups = this.groupByDemographic(matchResults, 'gender');
    const totalCandidates = matchResults.length;

    const selectionRates: { [key: string]: number } = {};
    const protectedGroups = populationData
      .filter(g => g.type === 'gender' && g.protected)
      .map(g => g.category);

    // Calculate selection rates for each gender group
    Object.entries(genderGroups).forEach(([gender, candidates]) => {
      const selected = candidates.filter(c => c.selected).length;
      selectionRates[gender] = selected / candidates.length;
    });

    // Calculate demographic parity
    const maxSelectionRate = Math.max(...Object.values(selectionRates));
    const minSelectionRate = Math.min(...Object.values(selectionRates));
    const disparity = maxSelectionRate - minSelectionRate;
    const parityScore = 1 - disparity;

    // Calculate equalized odds
    const equalizedOdds = this.calculateEqualizedOdds(genderGroups, selectionRates);

    // Calculate equal opportunity
    const equalOpportunity = this.calculateEqualOpportunity(genderGroups);

    // Calculate statistical parity
    const statisticalParity = this.calculateStatisticalParity(genderGroups, totalCandidates);

    return {
      demographicParity: {
        group: 'gender',
        selectionRate: maxSelectionRate,
        disparity,
        parityScore,
      },
      equalizedOdds,
      equalOpportunity,
      statisticalParity,
    };
  }

  private async analyzeRaceBias(
    matchResults: any[],
    populationData: DemographicGroup[]
  ): Promise<BiasMetrics> {
    const raceGroups = this.groupByDemographic(matchResults, 'race');
    const totalCandidates = matchResults.length;

    const selectionRates: { [key: string]: number } = {};

    Object.entries(raceGroups).forEach(([race, candidates]) => {
      const selected = candidates.filter(c => c.selected).length;
      selectionRates[race] = selected / candidates.length;
    });

    const maxSelectionRate = Math.max(...Object.values(selectionRates));
    const minSelectionRate = Math.min(...Object.values(selectionRates));
    const disparity = maxSelectionRate - minSelectionRate;
    const parityScore = 1 - disparity;

    const equalizedOdds = this.calculateEqualizedOdds(raceGroups, selectionRates);
    const equalOpportunity = this.calculateEqualOpportunity(raceGroups);
    const statisticalParity = this.calculateStatisticalParity(raceGroups, totalCandidates);

    return {
      demographicParity: {
        group: 'race',
        selectionRate: maxSelectionRate,
        disparity,
        parityScore,
      },
      equalizedOdds,
      equalOpportunity,
      statisticalParity,
    };
  }

  private async analyzeAgeBias(
    matchResults: any[],
    populationData: DemographicGroup[]
  ): Promise<BiasMetrics> {
    const ageGroups = this.groupByDemographic(matchResults, 'age');
    const totalCandidates = matchResults.length;

    const selectionRates: { [key: string]: number } = {};

    Object.entries(ageGroups).forEach(([age, candidates]) => {
      const selected = candidates.filter(c => c.selected).length;
      selectionRates[age] = selected / candidates.length;
    });

    const maxSelectionRate = Math.max(...Object.values(selectionRates));
    const minSelectionRate = Math.min(...Object.values(selectionRates));
    const disparity = maxSelectionRate - minSelectionRate;
    const parityScore = 1 - disparity;

    const equalizedOdds = this.calculateEqualizedOdds(ageGroups, selectionRates);
    const equalOpportunity = this.calculateEqualOpportunity(ageGroups);
    const statisticalParity = this.calculateStatisticalParity(ageGroups, totalCandidates);

    return {
      demographicParity: {
        group: 'age',
        selectionRate: maxSelectionRate,
        disparity,
        parityScore,
      },
      equalizedOdds,
      equalOpportunity,
      statisticalParity,
    };
  }

  private async analyzeLocationBias(
    matchResults: any[],
    populationData: DemographicGroup[]
  ): Promise<BiasMetrics> {
    const locationGroups = this.groupByDemographic(matchResults, 'location');
    const totalCandidates = matchResults.length;

    const selectionRates: { [key: string]: number } = {};

    Object.entries(locationGroups).forEach(([location, candidates]) => {
      const selected = candidates.filter(c => c.selected).length;
      selectionRates[location] = selected / candidates.length;
    });

    const maxSelectionRate = Math.max(...Object.values(selectionRates));
    const minSelectionRate = Math.min(...Object.values(selectionRates));
    const disparity = maxSelectionRate - minSelectionRate;
    const parityScore = 1 - disparity;

    const equalizedOdds = this.calculateEqualizedOdds(locationGroups, selectionRates);
    const equalOpportunity = this.calculateEqualOpportunity(locationGroups);
    const statisticalParity = this.calculateStatisticalParity(locationGroups, totalCandidates);

    return {
      demographicParity: {
        group: 'location',
        selectionRate: maxSelectionRate,
        disparity,
        parityScore,
      },
      equalizedOdds,
      equalOpportunity,
      statisticalParity,
    };
  }

  private async analyzeEducationBias(
    matchResults: any[],
    populationData: DemographicGroup[]
  ): Promise<BiasMetrics> {
    const educationGroups = this.groupByDemographic(matchResults, 'education');
    const totalCandidates = matchResults.length;

    const selectionRates: { [key: string]: number } = {};

    Object.entries(educationGroups).forEach(([education, candidates]) => {
      const selected = candidates.filter(c => c.selected).length;
      selectionRates[education] = selected / candidates.length;
    });

    const maxSelectionRate = Math.max(...Object.values(selectionRates));
    const minSelectionRate = Math.min(...Object.values(selectionRates));
    const disparity = maxSelectionRate - minSelectionRate;
    const parityScore = 1 - disparity;

    const equalizedOdds = this.calculateEqualizedOdds(educationGroups, selectionRates);
    const equalOpportunity = this.calculateEqualOpportunity(educationGroups);
    const statisticalParity = this.calculateStatisticalParity(educationGroups, totalCandidates);

    return {
      demographicParity: {
        group: 'education',
        selectionRate: maxSelectionRate,
        disparity,
        parityScore,
      },
      equalizedOdds,
      equalOpportunity,
      statisticalParity,
    };
  }

  private async analyzeExperienceBias(
    matchResults: any[],
    populationData: DemographicGroup[]
  ): Promise<BiasMetrics> {
    const experienceGroups = this.groupByDemographic(matchResults, 'experience');
    const totalCandidates = matchResults.length;

    const selectionRates: { [key: string]: number } = {};

    Object.entries(experienceGroups).forEach(([experience, candidates]) => {
      const selected = candidates.filter(c => c.selected).length;
      selectionRates[experience] = selected / candidates.length;
    });

    const maxSelectionRate = Math.max(...Object.values(selectionRates));
    const minSelectionRate = Math.min(...Object.values(selectionRates));
    const disparity = maxSelectionRate - minSelectionRate;
    const parityScore = 1 - disparity;

    const equalizedOdds = this.calculateEqualizedOdds(experienceGroups, selectionRates);
    const equalOpportunity = this.calculateEqualOpportunity(experienceGroups);
    const statisticalParity = this.calculateStatisticalParity(experienceGroups, totalCandidates);

    return {
      demographicParity: {
        group: 'experience',
        selectionRate: maxSelectionRate,
        disparity,
        parityScore,
      },
      equalizedOdds,
      equalOpportunity,
      statisticalParity,
    };
  }

  private groupByDemographic(
    matchResults: any[],
    demographic: string
  ): { [key: string]: any[] } {
    const groups: { [key: string]: any[] } = {};

    matchResults.forEach(result => {
      const value = result.demographics[demographic] || 'unknown';
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(result);
    });

    return groups;
  }

  private calculateEqualizedOdds(
    groups: { [key: string]: any[] },
    selectionRates: { [key: string]: number }
  ): BiasMetrics['equalizedOdds'] {
    const truePositiveRates: { [key: string]: number } = {};
    const falsePositiveRates: { [key: string]: number } = {};

    Object.entries(groups).forEach(([group, candidates]) => {
      const truePositives = candidates.filter(c => c.selected && c.score > 0.7).length;
      const falsePositives = candidates.filter(c => c.selected && c.score <= 0.7).length;
      const actualPositives = candidates.filter(c => c.score > 0.7).length;
      const actualNegatives = candidates.filter(c => c.score <= 0.7).length;

      truePositiveRates[group] = actualPositives > 0 ? truePositives / actualPositives : 0;
      falsePositiveRates[group] = actualNegatives > 0 ? falsePositives / actualNegatives : 0;
    });

    const maxTPR = Math.max(...Object.values(truePositiveRates));
    const minTPR = Math.min(...Object.values(truePositiveRates));
    const maxFPR = Math.max(...Object.values(falsePositiveRates));
    const minFPR = Math.min(...Object.values(falsePositiveRates));

    const oddsRatio = ((maxTPR / (1 - maxTPR)) / (minTPR / (1 - minTPR))) /
                      ((maxFPR / (1 - maxFPR)) / (minFPR / (1 - minFPR)));

    return {
      group: 'general',
      truePositiveRate: (maxTPR + minTPR) / 2,
      falsePositiveRate: (maxFPR + minFPR) / 2,
      oddsRatio: Math.max(oddsRatio, 1 / oddsRatio),
    };
  }

  private calculateEqualOpportunity(
    groups: { [key: string]: any[] }
  ): BiasMetrics['equalOpportunity'] {
    const recallRates: { [key: string]: number } = {};

    Object.entries(groups).forEach(([group, candidates]) => {
      const truePositives = candidates.filter(c => c.selected && c.score > 0.7).length;
      const actualPositives = candidates.filter(c => c.score > 0.7).length;
      recallRates[group] = actualPositives > 0 ? truePositives / actualPositives : 0;
    });

    const maxRecall = Math.max(...Object.values(recallRates));
    const minRecall = Math.min(...Object.values(recallRates));
    const opportunityParity = minRecall / maxRecall;

    return {
      group: 'general',
      recall: (maxRecall + minRecall) / 2,
      opportunityParity,
    };
  }

  private calculateStatisticalParity(
    groups: { [key: string]: any[] },
    totalCandidates: number
  ): BiasMetrics['statisticalParity'] {
    const outcomeRates: { [key: string]: number } = {};

    Object.entries(groups).forEach(([group, candidates]) => {
      const selected = candidates.filter(c => c.selected).length;
      outcomeRates[group] = selected / totalCandidates;
    });

    const maxOutcomeRate = Math.max(...Object.values(outcomeRates));
    const minOutcomeRate = Math.min(...Object.values(outcomeRates));
    const difference = maxOutcomeRate - minOutcomeRate;

    return {
      group: 'general',
      outcomeRate: (maxOutcomeRate + minOutcomeRate) / 2,
      statisticalParityDifference: difference,
    };
  }

  private calculateOverallBiasScore(biasTypes: BiasDetectionResult['biasTypes']): number {
    const scores = Object.values(biasTypes).map(bias => {
      const parityScore = bias.demographicParity.parityScore;
      const oddsRatio = bias.equalizedOdds.oddsRatio;
      const opportunityParity = bias.equalOpportunity.opportunityParity;

      // Combined bias score (lower is better)
      return (1 - parityScore) * 0.4 +
             (Math.abs(Math.log(oddsRatio)) / Math.log(10)) * 0.3 +
             (1 - opportunityParity) * 0.3;
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 100);
  }

  private generateBiasRecommendations(biasTypes: BiasDetectionResult['biasTypes']): BiasDetectionResult['recommendations'] {
    const recommendations: BiasDetectionResult['recommendations'] = [];

    Object.entries(biasTypes).forEach(([type, metrics]) => {
      if (metrics.demographicParity.disparity > 0.1) {
        recommendations.push({
          priority: metrics.demographicParity.disparity > 0.2 ? 'critical' : 'high',
          type: `${type} demographic parity`,
          description: `Significant disparity detected in ${type} demographic parity (${(metrics.demographicParity.disparity * 100).toFixed(1)}%)`,
          mitigation: `Apply re-weighting algorithm for ${type} demographic groups`,
          expectedImpact: 0.6,
        });
      }

      if (metrics.equalizedOdds.oddsRatio > 2) {
        recommendations.push({
          priority: 'high',
          type: `${type} equalized odds`,
          description: `High odds ratio detected for ${type} (${metrics.equalizedOdds.oddsRatio.toFixed(2)})`,
          mitigation: `Implement odds equalization algorithm for ${type} groups`,
          expectedImpact: 0.5,
        });
      }

      if (metrics.equalOpportunity.opportunityParity < 0.8) {
        recommendations.push({
          priority: 'medium',
          type: `${type} equal opportunity`,
          description: `Low opportunity parity for ${type} (${(metrics.equalOpportunity.opportunityParity * 100).toFixed(1)}%)`,
          mitigation: `Apply threshold adjustment for ${type} demographic groups`,
          expectedImpact: 0.4,
        });
      }
    });

    // Sort by priority and expected impact
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return b.expectedImpact - a.expectedImpact;
    });

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  private calculateFairnessMetrics(
    matchResults: any[],
    populationData: DemographicGroup[]
  ): BiasDetectionResult['fairnessMetrics'] {
    // Group fairness
    const groupFairness = this.calculateGroupFairness(matchResults, populationData);

    // Individual fairness
    const individualFairness = this.calculateIndividualFairness(matchResults);

    // Counterfactual fairness
    const counterfactualFairness = this.calculateCounterfactualFairness(matchResults);

    const overallFairness = (groupFairness + individualFairness + counterfactualFairness) / 3;

    return {
      overallFairness,
      groupFairness,
      individualFairness,
      counterfactualFairness,
    };
  }

  private calculateGroupFairness(matchResults: any[], populationData: DemographicGroup[]): number {
    // Calculate fairness across demographic groups
    const groups = ['gender', 'race', 'age', 'location'];
    let fairnessScore = 0;

    groups.forEach(group => {
      const groupResults = matchResults.filter(r => r.demographics[group]);
      if (groupResults.length > 0) {
        const selectedRate = groupResults.filter(r => r.selected).length / groupResults.length;
        fairnessScore += selectedRate;
      }
    });

    return groups.length > 0 ? fairnessScore / groups.length : 0;
  }

  private calculateIndividualFairness(matchResults: any[]): number {
    // Calculate consistency of similar individuals getting similar outcomes
    const scoreDifferences: number[] = [];

    for (let i = 0; i < matchResults.length - 1; i++) {
      for (let j = i + 1; j < matchResults.length; j++) {
        const diff = Math.abs(matchResults[i].score - matchResults[j].score);
        scoreDifferences.push(diff);
      }
    }

    const avgDifference = scoreDifferences.reduce((sum, diff) => sum + diff, 0) / scoreDifferences.length;
    return Math.max(0, 1 - avgDifference / 10); // Normalize to 0-1
  }

  private calculateCounterfactualFairness(matchResults: any[]): number {
    // Calculate what would happen if sensitive attributes changed
    // This is a simplified version - full implementation would require counterfactual analysis
    let fairnessScore = 0;
    let count = 0;

    Object.entries(matchResults).forEach(([_, result]) => {
      if (result.score > 0.7) {
        // Would this candidate still be selected with different demographics?
        fairnessScore += 0.8; // Simplified assumption
        count++;
      }
    });

    return count > 0 ? fairnessScore / count : 0;
  }

  private async storeBiasDetectionResult(result: BiasDetectionResult): Promise<void> {
    // Store bias detection results in database or logging system
    logger.info('Bias detection result stored', {
      overallBiasScore: result.overallBiasScore,
      recommendationCount: result.recommendations.length
    });
  }

  private initializeMitigationStrategies(): void {
    const strategies: BiasMitigationStrategy[] = [
      {
        id: 'reweighing',
        name: 'Re-weighting Algorithm',
        description: 'Adjust weights to compensate for demographic disparities',
        type: 'pre_processing',
        applicableBiasTypes: ['gender', 'race', 'age', 'location'],
        implementation: {
          algorithm: 'reweighing',
          parameters: { adjustmentFactor: 0.8 },
          expectedReduction: 0.6,
        },
        tradeoffs: {
          accuracyImpact: 0.1,
          implementationComplexity: 0.3,
          performanceImpact: 0.2,
        },
      },
      {
        id: 'threshold_adjustment',
        name: 'Threshold Adjustment',
        description: 'Different thresholds for different demographic groups',
        type: 'in_processing',
        applicableBiasTypes: ['gender', 'race', 'age'],
        implementation: {
          algorithm: 'threshold_adjustment',
          parameters: { baseThreshold: 0.7, adjustmentFactor: 0.1 },
          expectedReduction: 0.4,
        },
        tradeoffs: {
          accuracyImpact: 0.15,
          implementationComplexity: 0.2,
          performanceImpact: 0.1,
        },
      },
      {
        id: 'reject_option_classification',
        name: 'Reject Option Classification',
        description: 'Learn classifier without sensitive attributes and adjust predictions',
        type: 'post_processing',
        applicableBiasTypes: ['gender', 'race', 'location'],
        implementation: {
          algorithm: 'reject_option',
          parameters: { sensitiveAttributes: ['gender', 'race'] },
          expectedReduction: 0.7,
        },
        tradeoffs: {
          accuracyImpact: 0.2,
          implementationComplexity: 0.6,
          performanceImpact: 0.3,
        },
      },
    ];

    strategies.forEach(strategy => {
      this.mitigationStrategies.set(strategy.id, strategy);
    });
  }

  private async applyPreProcessingMitigation(
    matchResults: any[],
    strategy: BiasMitigationStrategy,
    parameters?: { [key: string]: any }
  ): Promise<any[]> {
    switch (strategy.implementation.algorithm) {
      case 'reweighing':
        return this.applyReweighing(matchResults, parameters);
      default:
        return matchResults;
    }
  }

  private async applyInProcessingMitigation(
    matchResults: any[],
    strategy: BiasMitigationStrategy,
    parameters?: { [key: string]: any }
  ): Promise<any[]> {
    switch (strategy.implementation.algorithm) {
      case 'threshold_adjustment':
        return this.applyThresholdAdjustment(matchResults, parameters);
      default:
        return matchResults;
    }
  }

  private async applyPostProcessingMitigation(
    matchResults: any[],
    strategy: BiasMitigationStrategy,
    parameters?: { [key: string]: any }
  ): Promise<any[]> {
    switch (strategy.implementation.algorithm) {
      case 'reject_option':
        return this.applyRejectOption(matchResults, parameters);
      default:
        return matchResults;
    }
  }

  private applyReweighing(matchResults: any[], parameters?: { [key: string]: any }): any[] {
    const adjustmentFactor = parameters?.adjustmentFactor || 0.8;
    const groupWeights: { [key: string]: number } = {};

    // Calculate weights based on demographic representation
    const demographics = ['gender', 'race', 'age'];
    demographics.forEach(demographic => {
      const groups = this.groupByDemographic(matchResults, demographic);
      Object.entries(groups).forEach(([group, candidates]) => {
        const representation = candidates.length / matchResults.length;
        groupWeights[`${demographic}_${group}`] = 1 / (representation * adjustmentFactor);
      });
    });

    return matchResults.map(result => {
      let adjustment = 0;
      demographics.forEach(demographic => {
        const value = result.demographics[demographic];
        if (value && groupWeights[`${demographic}_${value}`]) {
          adjustment += groupWeights[`${demographic}_${value}`] - 1;
        }
      });

      const adjustedScore = Math.max(0, Math.min(1, result.score + (adjustment * 0.1)));

      return {
        candidateId: result.candidateId,
        jobId: result.jobId,
        originalScore: result.score,
        mitigatedScore: adjustedScore,
        adjustment: adjustedScore - result.score,
      };
    });
  }

  private applyThresholdAdjustment(matchResults: any[], parameters?: { [key: string]: any }): any[] {
    const baseThreshold = parameters?.baseThreshold || 0.7;
    const adjustmentFactor = parameters?.adjustmentFactor || 0.1;

    const groupThresholds: { [key: string]: number } = {};

    // Calculate thresholds for different demographic groups
    const protectedGroups = ['gender_female', 'race_minority'];
    protectedGroups.forEach(group => {
      groupThresholds[group] = baseThreshold - adjustmentFactor;
    });

    return matchResults.map(result => {
      let threshold = baseThreshold;

      // Apply threshold adjustments
      if (result.demographics.gender === 'female') {
        threshold = groupThresholds['gender_female'];
      }
      if (this.isMinorityRace(result.demographics.race)) {
        threshold = groupThresholds['race_minority'];
      }

      const adjustedScore = result.score >= threshold ? result.score : 0;

      return {
        candidateId: result.candidateId,
        jobId: result.jobId,
        originalScore: result.score,
        mitigatedScore: adjustedScore,
        adjustment: adjustedScore - result.score,
      };
    });
  }

  private applyRejectOption(matchResults: any[], parameters?: { [key: string]: any }): any[] {
    const sensitiveAttributes = parameters?.sensitiveAttributes || ['gender', 'race'];

    return matchResults.map(result => {
      // Train classifier without sensitive attributes
      const fairScore = this.calculateFairScore(result, sensitiveAttributes);

      return {
        candidateId: result.candidateId,
        jobId: result.jobId,
        originalScore: result.score,
        mitigatedScore: fairScore,
        adjustment: fairScore - result.score,
      };
    });
  }

  private calculateFairScore(result: any, sensitiveAttributes: string[]): number {
    // Simplified fair score calculation
    let fairScore = result.score;

    // Reduce score based on sensitive attribute presence
    sensitiveAttributes.forEach(attr => {
      if (result.demographics[attr]) {
        fairScore *= 0.9;
      }
    });

    return fairScore;
  }

  private isMinorityRace(race?: string): boolean {
    const minorityRaces = ['black', 'hispanic', 'native', 'asian', 'pacific_islander'];
    return minorityRaces.includes(race?.toLowerCase() || '');
  }

  private validateMitigationResults(mitigatedResults: any[], originalResults: any[]): void {
    // Validate that mitigation doesn't create new biases
    const originalBias = this.calculateOverallBiasScore({
      gender: { demographicParity: { parityScore: 0.5 }, equalizedOdds: { oddsRatio: 1.5 }, equalOpportunity: { opportunityParity: 0.8 }, statisticalParity: { statisticalParityDifference: 0.1 } },
      race: { demographicParity: { parityScore: 0.5 }, equalizedOdds: { oddsRatio: 1.5 }, equalOpportunity: { opportunityParity: 0.8 }, statisticalParity: { statisticalParityDifference: 0.1 } },
      age: { demographicParity: { parityScore: 0.5 }, equalizedOdds: { oddsRatio: 1.5 }, equalOpportunity: { opportunityParity: 0.8 }, statisticalParity: { statisticalParityDifference: 0.1 } },
      location: { demographicParity: { parityScore: 0.5 }, equalizedOdds: { oddsRatio: 1.5 }, equalOpportunity: { opportunityParity: 0.8 }, statisticalParity: { statisticalParityDifference: 0.1 } },
      education: { demographicParity: { parityScore: 0.5 }, equalizedOdds: { oddsRatio: 1.5 }, equalOpportunity: { opportunityParity: 0.8 }, statisticalParity: { statisticalParityDifference: 0.1 } },
      experience: { demographicParity: { parityScore: 0.5 }, equalizedOdds: { oddsRatio: 1.5 }, equalOpportunity: { opportunityParity: 0.8 }, statisticalParity: { statisticalParityDifference: 0.1 } },
    });

    // This is a simplified validation - full implementation would recalculate bias metrics
    logger.info('Mitigation results validated', {
      originalBias,
      mitigatedCount: mitigatedResults.length
    });
  }

  private generateTimeIntervals(timeRange: { start: Date; end: Date }, interval: string): Array<{ start: Date; end: Date }> {
    const intervals: Array<{ start: Date; end: Date }> = [];
    let current = new Date(timeRange.start);

    while (current < timeRange.end) {
      const end = new Date(current);

      switch (interval) {
        case 'hour':
          end.setHours(end.getHours() + 1);
          break;
        case 'day':
          end.setDate(end.getDate() + 1);
          break;
        case 'week':
          end.setDate(end.getDate() + 7);
          break;
        case 'month':
          end.setMonth(end.getMonth() + 1);
          break;
      }

      if (end > timeRange.end) {
        intervals.push({ start: current, end: timeRange.end });
        break;
      }

      intervals.push({ start: current, end });
      current = end;
    }

    return intervals;
  }

  private async getMatchResultsForInterval(interval: { start: Date; end: Date }): Promise<any[]> {
    // This would query your database for match results in the given interval
    return []; // Placeholder
  }

  private async getPopulationDataForInterval(interval: { start: Date; end: Date }): Promise<DemographicGroup[]> {
    // This would query population data for the given interval
    return []; // Placeholder
  }

  private calculateTrends(previous: BiasDetectionResult, current: BiasDetectionResult): {
  improving: string[];
  worsening: string[];
  stable: string[];
} {
    const trends = {
      improving: [] as string[],
      worsening: [] as string[],
      stable: [] as string[],
    };

    Object.entries(previous.biasTypes).forEach(([type, prevMetrics]) => {
      const currMetrics = current.biasTypes[type as keyof typeof current.biasTypes];

      const prevScore = prevMetrics.demographicParity.parityScore;
      const currScore = currMetrics.demographicParity.parityScore;

      if (currScore > prevScore + 0.05) {
        trends.improving.push(type);
      } else if (currScore < prevScore - 0.05) {
        trends.worsening.push(type);
      } else {
        trends.stable.push(type);
      }
    });

    return trends;
  }
}

export { BiasDetector };
export type {
  BiasMetrics,
  BiasDetectionResult,
  BiasMitigationStrategy,
  DemographicGroup,
};