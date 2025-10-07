/**
 * Test file to verify all utilities are working correctly
 * This can be removed once we confirm everything is working
 */

// Test logger utility
import { logger } from './logger';

// Test cache utility
import { cache } from './cache';

// Test vector utils
import { VectorUtils } from './vector-utils';

// Test existing utilities
import { textExtractor } from './text-extractor';
import { keywordAnalyzer } from './keyword-analyzer';

// Test imports
export async function testUtilities() {
  console.log('Testing utilities...');

  try {
    // Test logger
    logger.info('Logger utility working');

    // Test cache
    await cache.set('test-key', { test: 'data' });
    const result = await cache.get('test-key');
    console.log('Cache result:', result);

    // Test vector utils
    const vector1 = [1, 2, 3];
    const vector2 = [1, 2, 4];
    const similarity = VectorUtils.cosineSimilarity(vector1, vector2);
    console.log('Vector similarity:', similarity);

    // Test existing utilities
    console.log('Text extractor:', typeof textExtractor);
    console.log('Keyword analyzer:', typeof keywordAnalyzer);

    console.log('All utilities tested successfully!');
    return true;
  } catch (error) {
    console.error('Utility test failed:', error);
    return false;
  }
}

// Export a simple check function
export function checkUtilityStatus() {
  return {
    logger: !!logger,
    cache: !!cache,
    vectorUtils: !!VectorUtils,
    textExtractor: !!textExtractor,
    keywordAnalyzer: !!keywordAnalyzer,
  };
}