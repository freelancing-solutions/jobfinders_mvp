#!/usr/bin/env node

/**
 * Code Review Agent
 * 
 * Autonomous code review system that analyzes files for:
 * - Logical correctness and potential bugs
 * - Code clarity, structure, and maintainability
 * - Security vulnerabilities or unsafe operations
 * - Adherence to project conventions and architectural patterns
 * - Documentation and comment completeness
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface CodeIssue {
  title: string
  type: 'Bug' | 'Style' | 'Security' | 'Optimization' | 'Maintainability' | 'Documentation'
  description: string
  suggestedFix: string
  complexity: 'Simple' | 'Moderate' | 'Complex'
  lineNumber?: number
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
}

interface ReviewReport {
  moduleName: string
  date: string
  reportNumber: number
  summary: string
  strengths: string[]
  issues: CodeIssue[]
  simpleFixes: string[]
  conclusion: string
  filePath: string
  linesOfCode: number
}

class CodeReviewAgent {
  private reportCounter: number = 1
  private reviewsDir: string
  
  constructor() {
    this.reviewsDir = path.join(process.cwd(), '.kiro', '_CodeReviews')
    this.ensureDirectoryExists(this.reviewsDir)
  }

  /**
   * Main entry point for code review
   */
  async reviewFile(filePath: string): Promise<ReviewReport> {
    console.log(`🔍 Starting code review for: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const moduleName = path.basename(filePath, path.extname(filePath))
    
    // Analyze the file
    const issues = await this.analyzeCode(content, filePath)
    const strengths = this.identifyStrengths(content, filePath)
    const simpleFixes = this.applySimpleFixes(content, filePath)
    
    // Generate report
    const report: ReviewReport = {
      moduleName,
      date: new Date().toISOString().split('T')[0],
      reportNumber: this.reportCounter++,
      summary: this.generateSummary(content, filePath),
      strengths,
      issues,
      simpleFixes,
      conclusion: this.generateConclusion(issues),
      filePath,
      linesOfCode: content.split('\n').length
    }

    // Save report
    await this.saveReport(report)
    
    console.log(`✅ Code review completed. Report saved.`)
    return report
  }

  /**
   * Analyze code for various issues
   */
  private async analyzeCode(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = []
    const lines = content.split('\n')
    const fileExt = path.extname(filePath)

    // Security Analysis
    issues.push(...this.analyzeSecurityIssues(content, lines))
    
    // Bug Detection
    issues.push(...this.analyzeBugs(content, lines))
    
    // Style and Maintainability
    issues.push(...this.analyzeStyle(content, lines, fileExt))
    
    // Performance and Optimization
    issues.push(...this.analyzePerformance(content, lines))
    
    // Documentation
    issues.push(...this.analyzeDocumentation(content, lines, fileExt))

    return issues
  }

  /**
   * Analyze security vulnerabilities
   */
  private analyzeSecurityIssues(content: string, lines: string[]): CodeIssue[] {
    const issues: CodeIssue[] = []

    // Check for SQL injection vulnerabilities
    if (content.includes('db.') && content.includes('${') && !content.includes('prisma')) {
      issues.push({
        title: 'Potential SQL Injection Vulnerability',
        type: 'Security',
        description: 'Direct string interpolation in database queries can lead to SQL injection attacks.',
        suggestedFix: 'Use parameterized queries or ORM methods like Prisma to prevent SQL injection.',
        complexity: 'Moderate',
        severity: 'Critical'
      })
    }

    // Check for hardcoded secrets
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"]\w+['"]/i,
      /secret\s*[:=]\s*['"]\w+['"]/i,
      /password\s*[:=]\s*['"]\w+['"]/i,
      /token\s*[:=]\s*['"]\w+['"]/i
    ]

    lines.forEach((line, index) => {
      secretPatterns.forEach(pattern => {
        if (pattern.test(line) && !line.includes('process.env')) {
          issues.push({
            title: 'Hardcoded Secret Detected',
            type: 'Security',
            description: 'Hardcoded secrets in source code pose security risks.',
            suggestedFix: 'Move secrets to environment variables and use process.env to access them.',
            complexity: 'Simple',
            lineNumber: index + 1,
            severity: 'High'
          })
        }
      })
    })

    // Check for missing input validation
    if (content.includes('request.') && !content.includes('zod') && !content.includes('validate')) {
      issues.push({
        title: 'Missing Input Validation',
        type: 'Security',
        description: 'API endpoints should validate input data to prevent malicious requests.',
        suggestedFix: 'Implement input validation using Zod schemas or similar validation library.',
        complexity: 'Moderate',
        severity: 'High'
      })
    }

    return issues
  }

  /**
   * Analyze potential bugs
   */
  private analyzeBugs(content: string, lines: string[]): CodeIssue[] {
    const issues: CodeIssue[] = []

    // Check for unhandled promises
    lines.forEach((line, index) => {
      if (line.includes('await') && !line.includes('try') && !line.includes('catch')) {
        const nextLines = lines.slice(index, index + 5).join(' ')
        if (!nextLines.includes('catch') && !nextLines.includes('.catch')) {
          issues.push({
            title: 'Unhandled Promise Rejection',
            type: 'Bug',
            description: 'Async operations should have proper error handling to prevent unhandled promise rejections.',
            suggestedFix: 'Wrap async operations in try-catch blocks or add .catch() handlers.',
            complexity: 'Simple',
            lineNumber: index + 1,
            severity: 'Medium'
          })
        }
      }
    })

    // Check for potential null/undefined access
    const nullAccessPatterns = [
      /\w+\.\w+\.\w+/g, // Deep property access without null checks
      /\w+\[\w+\]\.\w+/g // Array access followed by property access
    ]

    lines.forEach((line, index) => {
      nullAccessPatterns.forEach(pattern => {
        if (pattern.test(line) && !line.includes('?') && !line.includes('&&')) {
          issues.push({
            title: 'Potential Null/Undefined Access',
            type: 'Bug',
            description: 'Deep property access without null checks can cause runtime errors.',
            suggestedFix: 'Use optional chaining (?.) or null checks (&&) before accessing nested properties.',
            complexity: 'Simple',
            lineNumber: index + 1,
            severity: 'Medium'
          })
        }
      })
    })

    // Check for missing return statements in functions
    const functionMatches = content.match(/function\s+\w+\([^)]*\)\s*{[^}]*}/g) || []
    functionMatches.forEach(func => {
      if (!func.includes('return') && !func.includes('void') && !func.includes('Promise<void>')) {
        issues.push({
          title: 'Missing Return Statement',
          type: 'Bug',
          description: 'Function appears to be missing a return statement.',
          suggestedFix: 'Add appropriate return statement or specify void return type.',
          complexity: 'Simple',
          severity: 'Low'
        })
      }
    })

    return issues
  }

  /**
   * Analyze style and maintainability issues
   */
  private analyzeStyle(content: string, lines: string[], fileExt: string): CodeIssue[] {
    const issues: CodeIssue[] = []

    // Check for long functions
    const functionBlocks = this.extractFunctionBlocks(content)
    functionBlocks.forEach(block => {
      if (block.lines > 50) {
        issues.push({
          title: 'Function Too Long',
          type: 'Maintainability',
          description: `Function has ${block.lines} lines, which exceeds recommended limit of 50 lines.`,
          suggestedFix: 'Break down the function into smaller, more focused functions.',
          complexity: 'Moderate',
          severity: 'Medium'
        })
      }
    })

    // Check for magic numbers
    lines.forEach((line, index) => {
      const magicNumbers = line.match(/\b\d{2,}\b/g)
      if (magicNumbers && !line.includes('//') && !line.includes('const')) {
        issues.push({
          title: 'Magic Numbers Detected',
          type: 'Maintainability',
          description: 'Numeric literals should be replaced with named constants for better readability.',
          suggestedFix: 'Extract magic numbers into named constants with descriptive names.',
          complexity: 'Simple',
          lineNumber: index + 1,
          severity: 'Low'
        })
      }
    })

    // Check for inconsistent naming
    const variableNames = content.match(/(?:const|let|var)\s+(\w+)/g) || []
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/
    variableNames.forEach(match => {
      const varName = match.split(/\s+/)[1]
      if (!camelCasePattern.test(varName) && !varName.includes('_')) {
        issues.push({
          title: 'Inconsistent Naming Convention',
          type: 'Style',
          description: 'Variable names should follow camelCase convention.',
          suggestedFix: `Rename '${varName}' to follow camelCase convention.`,
          complexity: 'Simple',
          severity: 'Low'
        })
      }
    })

    // Check for unused imports (TypeScript/JavaScript)
    if (fileExt === '.ts' || fileExt === '.tsx' || fileExt === '.js' || fileExt === '.jsx') {
      const imports = content.match(/import\s+.*?\s+from\s+['"](.*?)['"]/g) || []
      imports.forEach(importLine => {
        const importedItems = importLine.match(/import\s+{([^}]+)}/)?.[1]?.split(',') || []
        importedItems.forEach(item => {
          const trimmedItem = item.trim()
          if (trimmedItem && !content.includes(trimmedItem.replace(/\s+as\s+\w+/, ''))) {
            issues.push({
              title: 'Unused Import',
              type: 'Style',
              description: `Imported item '${trimmedItem}' appears to be unused.`,
              suggestedFix: `Remove unused import '${trimmedItem}'.`,
              complexity: 'Simple',
              severity: 'Low'
            })
          }
        })
      })
    }

    return issues
  }

  /**
   * Analyze performance issues
   */
  private analyzePerformance(content: string, lines: string[]): CodeIssue[] {
    const issues: CodeIssue[] = []

    // Check for inefficient loops
    lines.forEach((line, index) => {
      if (line.includes('for') && line.includes('.length') && !line.includes('const len')) {
        issues.push({
          title: 'Inefficient Loop',
          type: 'Optimization',
          description: 'Accessing .length property in loop condition can be inefficient.',
          suggestedFix: 'Cache the length in a variable before the loop.',
          complexity: 'Simple',
          lineNumber: index + 1,
          severity: 'Low'
        })
      }
    })

    // Check for synchronous operations that could be async
    if (content.includes('fs.readFileSync') || content.includes('fs.writeFileSync')) {
      issues.push({
        title: 'Blocking File Operations',
        type: 'Optimization',
        description: 'Synchronous file operations can block the event loop.',
        suggestedFix: 'Use asynchronous file operations (fs.promises or fs/promises) instead.',
        complexity: 'Moderate',
        severity: 'Medium'
      })
    }

    // Check for missing database query optimization
    if (content.includes('findMany') && !content.includes('select') && !content.includes('include')) {
      issues.push({
        title: 'Unoptimized Database Query',
        type: 'Optimization',
        description: 'Database queries should specify only needed fields to improve performance.',
        suggestedFix: 'Add select or include clauses to limit returned data.',
        complexity: 'Simple',
        severity: 'Medium'
      })
    }

    return issues
  }

  /**
   * Analyze documentation issues
   */
  private analyzeDocumentation(content: string, lines: string[], fileExt: string): CodeIssue[] {
    const issues: CodeIssue[] = []

    // Check for missing function documentation
    const functionMatches = content.match(/(export\s+)?(async\s+)?function\s+\w+/g) || []
    const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g) || []
    
    if (functionMatches.length > jsdocMatches.length) {
      issues.push({
        title: 'Missing Function Documentation',
        type: 'Documentation',
        description: 'Functions should have JSDoc comments explaining their purpose, parameters, and return values.',
        suggestedFix: 'Add JSDoc comments to all exported functions.',
        complexity: 'Simple',
        severity: 'Low'
      })
    }

    // Check for missing file header
    if (!content.startsWith('/**') && !content.startsWith('//')) {
      issues.push({
        title: 'Missing File Header',
        type: 'Documentation',
        description: 'Files should have header comments explaining their purpose.',
        suggestedFix: 'Add a file header comment describing the module\'s purpose.',
        complexity: 'Simple',
        severity: 'Low'
      })
    }

    // Check for complex logic without comments
    lines.forEach((line, index) => {
      if ((line.includes('&&') && line.includes('||')) || 
          (line.includes('?') && line.includes(':') && line.length > 80)) {
        const prevLine = lines[index - 1] || ''
        if (!prevLine.includes('//') && !prevLine.includes('/*')) {
          issues.push({
            title: 'Complex Logic Without Comments',
            type: 'Documentation',
            description: 'Complex conditional logic should be explained with comments.',
            suggestedFix: 'Add comments explaining the logic and conditions.',
            complexity: 'Simple',
            lineNumber: index + 1,
            severity: 'Low'
          })
        }
      }
    })

    return issues
  }

  /**
   * Identify code strengths
   */
  private identifyStrengths(content: string, filePath: string): string[] {
    const strengths: string[] = []

    // Check for good practices
    if (content.includes('try') && content.includes('catch')) {
      strengths.push('Proper error handling with try-catch blocks')
    }

    if (content.includes('zod') || content.includes('validate')) {
      strengths.push('Input validation implemented')
    }

    if (content.includes('/**') || content.includes('//')) {
      strengths.push('Code includes documentation and comments')
    }

    if (content.includes('async') && content.includes('await')) {
      strengths.push('Modern async/await pattern usage')
    }

    if (content.includes('interface') || content.includes('type')) {
      strengths.push('TypeScript types defined for better type safety')
    }

    if (content.includes('process.env')) {
      strengths.push('Environment variables used for configuration')
    }

    if (content.includes('prisma') || content.includes('db.')) {
      strengths.push('Database operations using ORM for safety')
    }

    return strengths
  }

  /**
   * Apply simple fixes automatically
   */
  private applySimpleFixes(content: string, filePath: string): string[] {
    const fixes: string[] = []
    let modifiedContent = content

    // Fix trailing whitespace
    const originalLines = content.split('\n')
    const trimmedLines = originalLines.map(line => line.trimEnd())
    if (originalLines.some((line, i) => line !== trimmedLines[i])) {
      modifiedContent = trimmedLines.join('\n')
      fixes.push('Removed trailing whitespace')
    }

    // Fix missing semicolons (basic cases)
    const missingSemicolonPattern = /^(\s*)(const|let|var|return)\s+[^;]+[^;}]$/gm
    if (missingSemicolonPattern.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(missingSemicolonPattern, '$&;')
      fixes.push('Added missing semicolons')
    }

    // Apply fixes if any were made
    if (fixes.length > 0) {
      fs.writeFileSync(filePath, modifiedContent, 'utf-8')
    }

    return fixes
  }

  /**
   * Generate summary of the file
   */
  private generateSummary(content: string, filePath: string): string {
    const fileExt = path.extname(filePath)
    const linesOfCode = content.split('\n').length
    const hasExports = content.includes('export')
    const hasImports = content.includes('import')
    const isApiRoute = filePath.includes('/api/')
    const isComponent = filePath.includes('/components/')

    let summary = `This ${fileExt} file contains ${linesOfCode} lines of code. `

    if (isApiRoute) {
      summary += 'It appears to be a Next.js API route handler '
      if (content.includes('GET')) summary += 'with GET endpoint '
      if (content.includes('POST')) summary += 'with POST endpoint '
      if (content.includes('PUT')) summary += 'with PUT endpoint '
      if (content.includes('DELETE')) summary += 'with DELETE endpoint '
    } else if (isComponent) {
      summary += 'It appears to be a React component '
    }

    if (hasImports) summary += 'with external dependencies '
    if (hasExports) summary += 'and exports functionality for use by other modules.'

    return summary
  }

  /**
   * Generate conclusion based on issues found
   */
  private generateConclusion(issues: CodeIssue[]): string {
    const criticalIssues = issues.filter(i => i.severity === 'Critical').length
    const highIssues = issues.filter(i => i.severity === 'High').length
    const mediumIssues = issues.filter(i => i.severity === 'Medium').length
    const lowIssues = issues.filter(i => i.severity === 'Low').length

    let conclusion = ''

    if (criticalIssues > 0) {
      conclusion += `⚠️ CRITICAL: ${criticalIssues} critical security or functionality issues require immediate attention. `
    }

    if (highIssues > 0) {
      conclusion += `🔴 HIGH: ${highIssues} high-priority issues should be addressed soon. `
    }

    if (mediumIssues > 0) {
      conclusion += `🟡 MEDIUM: ${mediumIssues} medium-priority improvements recommended. `
    }

    if (lowIssues > 0) {
      conclusion += `🟢 LOW: ${lowIssues} minor style/documentation improvements suggested. `
    }

    if (issues.length === 0) {
      conclusion = '✅ No significant issues found. Code appears to follow good practices.'
    } else {
      conclusion += `\n\nOverall, the code would benefit from addressing the ${issues.length} identified issues to improve security, maintainability, and code quality.`
    }

    return conclusion
  }

  /**
   * Extract function blocks for analysis
   */
  private extractFunctionBlocks(content: string): Array<{name: string, lines: number}> {
    const blocks: Array<{name: string, lines: number}> = []
    const functionRegex = /(export\s+)?(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*{/g
    let match

    while ((match = functionRegex.exec(content)) !== null) {
      const functionStart = match.index
      const functionName = match[3]
      
      // Find the end of the function by counting braces
      let braceCount = 1
      let currentIndex = functionStart + match[0].length
      
      while (braceCount > 0 && currentIndex < content.length) {
        if (content[currentIndex] === '{') braceCount++
        if (content[currentIndex] === '}') braceCount--
        currentIndex++
      }
      
      const functionContent = content.substring(functionStart, currentIndex)
      const lineCount = functionContent.split('\n').length
      
      blocks.push({ name: functionName, lines: lineCount })
    }

    return blocks
  }

  /**
   * Save the review report
   */
  private async saveReport(report: ReviewReport): Promise<void> {
    const moduleDir = path.join(this.reviewsDir, report.moduleName)
    const dateDir = path.join(moduleDir, report.date)
    
    this.ensureDirectoryExists(moduleDir)
    this.ensureDirectoryExists(dateDir)

    const reportPath = path.join(dateDir, `report_${report.reportNumber}.md`)
    const reportContent = this.generateReportMarkdown(report)
    
    fs.writeFileSync(reportPath, reportContent, 'utf-8')
    console.log(`📄 Report saved to: ${reportPath}`)
  }

  /**
   * Generate Markdown report content
   */
  private generateReportMarkdown(report: ReviewReport): string {
    let markdown = `# Code Review Report – ${report.moduleName}\n\n`
    markdown += `**Date:** ${report.date}\n`
    markdown += `**Report Number:** ${report.reportNumber}\n`
    markdown += `**Reviewer:** Code Review Agent\n`
    markdown += `**File Path:** ${report.filePath}\n`
    markdown += `**Lines of Code:** ${report.linesOfCode}\n\n`

    markdown += `## Summary\n\n${report.summary}\n\n`

    if (report.strengths.length > 0) {
      markdown += `## Strengths\n\n`
      report.strengths.forEach(strength => {
        markdown += `- ${strength}\n`
      })
      markdown += '\n'
    }

    if (report.issues.length > 0) {
      markdown += `## Issues & Recommendations\n\n`
      report.issues.forEach((issue, index) => {
        markdown += `### ${index + 1}. ${issue.title}\n\n`
        markdown += `- **Type:** ${issue.type}\n`
        markdown += `- **Severity:** ${issue.severity}\n`
        if (issue.lineNumber) {
          markdown += `- **Line:** ${issue.lineNumber}\n`
        }
        markdown += `- **Description:** ${issue.description}\n`
        markdown += `- **Suggested Fix:** ${issue.suggestedFix}\n`
        markdown += `- **Complexity:** ${issue.complexity}\n\n`
      })
    }

    if (report.simpleFixes.length > 0) {
      markdown += `## Simple Fixes Applied\n\n`
      report.simpleFixes.forEach(fix => {
        markdown += `- ${fix}\n`
      })
      markdown += '\n'
    }

    markdown += `## Conclusion\n\n${report.conclusion}\n\n`
    
    // Add statistics
    const issuesByType = report.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const issuesBySeverity = report.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    markdown += `## Statistics\n\n`
    markdown += `**Total Issues:** ${report.issues.length}\n\n`
    
    if (Object.keys(issuesByType).length > 0) {
      markdown += `**Issues by Type:**\n`
      Object.entries(issuesByType).forEach(([type, count]) => {
        markdown += `- ${type}: ${count}\n`
      })
      markdown += '\n'
    }

    if (Object.keys(issuesBySeverity).length > 0) {
      markdown += `**Issues by Severity:**\n`
      Object.entries(issuesBySeverity).forEach(([severity, count]) => {
        markdown += `- ${severity}: ${count}\n`
      })
      markdown += '\n'
    }

    markdown += `---\n`
    markdown += `*Generated by Code Review Agent on ${new Date().toISOString()}*\n`

    return markdown
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: node code-review-agent.ts <file-path>')
    console.log('Example: node code-review-agent.ts src/app/api/jobs/route.ts')
    process.exit(1)
  }

  const filePath = args[0]
  const agent = new CodeReviewAgent()

  try {
    const report = await agent.reviewFile(filePath)
    console.log(`\n🎉 Code review completed for ${report.moduleName}`)
    console.log(`📊 Found ${report.issues.length} issues`)
    console.log(`🔧 Applied ${report.simpleFixes.length} simple fixes`)
  } catch (error) {
    console.error('❌ Error during code review:', error)
    process.exit(1)
  }
}

// Export for use as module
export { CodeReviewAgent, type CodeIssue, type ReviewReport }

// Run if called directly
if (require.main === module) {
  main()
}