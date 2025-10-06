'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play, 
  RefreshCw,
  Download,
  Eye,
  TrendingUp,
  Lock,
  Globe,
  Database,
  Server,
  FileText,
  Clock
} from 'lucide-react'

interface SecurityTestResult {
  testName: string
  passed: boolean
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
}

interface SecurityTestSuite {
  suiteName: string
  results: SecurityTestResult[]
  overallScore: number
  passed: boolean
}

interface ComplianceCheckResult {
  requirement: string
  compliant: boolean
  evidence: string[]
  gaps: string[]
}

interface SecurityReport {
  testType: string
  securityTests?: SecurityTestSuite[]
  complianceChecks?: ComplianceCheckResult[]
  overallSecurityScore?: number
  complianceScore?: number
  recommendations?: string[]
  summary?: any
  timestamp?: string
}

export default function SecurityDashboard() {
  const [loading, setLoading] = useState(false)
  const [testOptions, setTestOptions] = useState<any>(null)
  const [selectedTestType, setSelectedTestType] = useState('full')
  const [domain, setDomain] = useState('')
  const [lastReport, setLastReport] = useState<SecurityReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTestOptions()
  }, [])

  const loadTestOptions = async () => {
    try {
      const response = await fetch('/api/v1/security/test')
      if (response.ok) {
        const data = await response.json()
        setTestOptions(data.data)
      } else {
        throw new Error('Failed to load test options')
      }
    } catch (error) {
      console.error('Load test options error:', error)
      setError('Failed to load security test options')
    }
  }

  const runSecurityTest = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/security/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testType: selectedTestType,
          domain: domain || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLastReport(data.data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Security test failed')
      }
    } catch (error) {
      console.error('Security test error:', error)
      setError(error instanceof Error ? error.message : 'Security test failed')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSuiteIcon = (suiteName: string) => {
    switch (suiteName) {
      case 'HTTPS Configuration': return <Globe className="w-5 h-5" />
      case 'API Security': return <Server className="w-5 h-5" />
      case 'Database Security': return <Database className="w-5 h-5" />
      case 'Environment Security': return <Lock className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  const exportReport = () => {
    if (!lastReport) return

    const reportData = {
      ...lastReport,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
              <p className="text-sm text-gray-600">
                Monitor security posture and POPIA compliance
              </p>
            </div>
          </div>
          {lastReport && (
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          )}
        </div>

        {/* Test Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Type
            </label>
            <select
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {testOptions?.availableTests.map((test: any) => (
                <option key={test.type} value={test.type}>
                  {test.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain (Optional)
            </label>
            <input
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runSecurityTest}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{loading ? 'Running...' : 'Run Test'}</span>
            </button>
          </div>
        </div>

        {/* Test Description */}
        {testOptions && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              {testOptions.availableTests.find((t: any) => t.type === selectedTestType)?.description}
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Report Summary */}
      {lastReport && lastReport.summary && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Test Summary</h2>
            {lastReport.timestamp && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>{new Date(lastReport.timestamp).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lastReport.summary.overallSecurityScore !== undefined && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Security Score</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {lastReport.summary.overallSecurityScore}%
                </p>
              </div>
            )}

            {lastReport.summary.complianceScore !== undefined && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Compliance Score</span>
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {lastReport.summary.complianceScore}%
                </p>
              </div>
            )}

            {lastReport.summary.totalTests !== undefined && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">Total Tests</span>
                  <Eye className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {lastReport.summary.passedTests || 0}/{lastReport.summary.totalTests}
                </p>
              </div>
            )}

            {lastReport.summary.totalRecommendations !== undefined && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-800">Recommendations</span>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {lastReport.summary.totalRecommendations}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Test Results */}
      {lastReport?.securityTests && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Test Results</h2>
          
          <div className="space-y-6">
            {lastReport.securityTests.map((suite, suiteIndex) => (
              <div key={suiteIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSuiteIcon(suite.suiteName)}
                    <h3 className="font-medium text-gray-900">{suite.suiteName}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      suite.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(suite.overallScore)}% Score
                    </span>
                    {suite.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {suite.results.map((result, resultIndex) => (
                    <div key={resultIndex} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex-shrink-0 mt-0.5">
                        {result.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {result.testName}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(result.severity)}`}>
                            {result.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.message}
                        </p>
                        {result.recommendation && (
                          <p className="text-sm text-blue-600 mt-1">
                            <strong>Recommendation:</strong> {result.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Results */}
      {lastReport?.complianceChecks && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">POPIA Compliance Results</h2>
          
          <div className="space-y-4">
            {lastReport.complianceChecks.map((check, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{check.requirement}</h3>
                  <div className="flex items-center space-x-2">
                    {check.compliant ? (
                      <>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Compliant
                        </span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Non-Compliant
                        </span>
                        <XCircle className="w-5 h-5 text-red-500" />
                      </>
                    )}
                  </div>
                </div>

                {check.evidence.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Evidence:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {check.evidence.map((evidence, evidenceIndex) => (
                        <li key={evidenceIndex} className="flex items-center space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {check.gaps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Gaps to Address:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {check.gaps.map((gap, gapIndex) => (
                        <li key={gapIndex} className="flex items-center space-x-2">
                          <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {lastReport?.recommendations && lastReport.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
          
          <div className="space-y-3">
            {lastReport.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}