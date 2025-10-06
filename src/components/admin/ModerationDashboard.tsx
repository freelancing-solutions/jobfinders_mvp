'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Flag,
  Clock,
  User,
  FileText,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ModerationStats {
  totalModerated: number
  autoApproved: number
  flagged: number
  quarantined: number
  rejected: number
  requiresReview: number
  averageConfidence: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

interface PendingReview {
  contentId: string
  contentType: string
  riskLevel: string
  reasons: string[]
  flaggedAt: string
  content: string
  metadata: {
    userId: string
    title?: string
    [key: string]: any
  }
}

interface ModerationHistory {
  contentId: string
  action: string
  riskLevel: string
  confidence: number
  reasons: string[]
  timestamp: string
  autoModerated: boolean
  moderatedBy?: string
}

export default function ModerationDashboard() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [selectedContent, setSelectedContent] = useState<PendingReview | null>(null)
  const [moderationHistory, setModerationHistory] = useState<ModerationHistory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day')
  const [filters, setFilters] = useState({
    riskLevel: '',
    contentType: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [moderationReason, setModerationReason] = useState('')
  const [moderationAction, setModerationAction] = useState('')

  useEffect(() => {
    loadModerationStats()
    loadPendingReviews()
  }, [timeframe, filters])

  const loadModerationStats = async () => {
    try {
      const response = await fetch(`/api/v1/moderation?action=stats&timeframe=${timeframe}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.data.stats)
      } else {
        throw new Error('Failed to load moderation stats')
      }
    } catch (error) {
      console.error('Load stats error:', error)
      setError('Failed to load moderation statistics')
    }
  }

  const loadPendingReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.riskLevel) params.append('riskLevel', filters.riskLevel)
      if (filters.contentType) params.append('contentType', filters.contentType)
      
      const response = await fetch(`/api/v1/moderation/manual?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPendingReviews(data.data.items)
      } else {
        throw new Error('Failed to load pending reviews')
      }
    } catch (error) {
      console.error('Load pending reviews error:', error)
      setError('Failed to load pending reviews')
    } finally {
      setLoading(false)
    }
  }

  const loadModerationHistory = async (contentId: string) => {
    try {
      const response = await fetch(`/api/v1/moderation?action=history&contentId=${contentId}`)
      if (response.ok) {
        const data = await response.json()
        setModerationHistory(data.data.history)
      } else {
        throw new Error('Failed to load moderation history')
      }
    } catch (error) {
      console.error('Load history error:', error)
      setError('Failed to load moderation history')
    }
  }

  const performManualModeration = async (contentId: string, action: string, reason: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/moderation/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId,
          action,
          reason
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Remove from pending reviews
        setPendingReviews(prev => prev.filter(item => item.contentId !== contentId))
        // Update history if viewing this content
        if (selectedContent?.contentId === contentId) {
          setModerationHistory(data.data.history)
        }
        // Clear form
        setModerationAction('')
        setModerationReason('')
        setSelectedContent(null)
        // Reload stats
        loadModerationStats()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Manual moderation failed')
      }
    } catch (error) {
      console.error('Manual moderation error:', error)
      setError(error instanceof Error ? error.message : 'Manual moderation failed')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'job_listing': return <Briefcase className="w-4 h-4" />
      case 'user_profile': return <User className="w-4 h-4" />
      case 'user_message': return <MessageSquare className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatContentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
              <p className="text-sm text-gray-600">
                Monitor and moderate user-generated content
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'day' | 'week' | 'month')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Level
              </label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Risk Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={filters.contentType}
                onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Content Types</option>
                <option value="job_listing">Job Listings</option>
                <option value="user_profile">User Profiles</option>
                <option value="user_message">Messages</option>
                <option value="cv_content">CV Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
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

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Moderation Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Total Moderated</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalModerated}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Auto Approved</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.autoApproved}</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">Flagged</span>
                <Flag className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.flagged}</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-800">Needs Review</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900 mt-1">{stats.requiresReview}</p>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-md">
              <span className="text-sm font-medium text-blue-800">Low Risk</span>
              <p className="text-lg font-bold text-blue-900">{stats.riskDistribution.low}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-md">
              <span className="text-sm font-medium text-yellow-800">Medium Risk</span>
              <p className="text-lg font-bold text-yellow-900">{stats.riskDistribution.medium}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-md">
              <span className="text-sm font-medium text-orange-800">High Risk</span>
              <p className="text-lg font-bold text-orange-900">{stats.riskDistribution.high}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-md">
              <span className="text-sm font-medium text-red-800">Critical Risk</span>
              <p className="text-lg font-bold text-red-900">{stats.riskDistribution.critical}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Reviews</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No pending reviews</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div
                  key={review.contentId}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedContent?.contentId === review.contentId
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedContent(review)
                    loadModerationHistory(review.contentId)
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getContentTypeIcon(review.contentType)}
                      <span className="text-sm font-medium text-gray-900">
                        {formatContentType(review.contentType)}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(review.riskLevel)}`}>
                      {review.riskLevel}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {review.content.substring(0, 100)}...
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>User: {review.metadata.userId}</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(review.flaggedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {review.reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {review.reasons.map((reason, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                        >
                          {reason.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Review Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Review</h2>
          
          {selectedContent ? (
            <div className="space-y-4">
              {/* Content Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {selectedContent.metadata.title || 'Content Review'}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(selectedContent.riskLevel)}`}>
                    {selectedContent.riskLevel} Risk
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <p><strong>Type:</strong> {formatContentType(selectedContent.contentType)}</p>
                  <p><strong>User:</strong> {selectedContent.metadata.userId}</p>
                  <p><strong>Flagged:</strong> {new Date(selectedContent.flaggedAt).toLocaleString()}</p>
                </div>
                
                <div className="mb-3">
                  <strong className="text-sm text-gray-700">Content:</strong>
                  <p className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">
                    {selectedContent.content}
                  </p>
                </div>
                
                {selectedContent.reasons.length > 0 && (
                  <div>
                    <strong className="text-sm text-gray-700">Flagged for:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedContent.reasons.map((reason, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                        >
                          {reason.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Moderation Actions */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Moderation Action</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <select
                      value={moderationAction}
                      onChange={(e) => setModerationAction(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select action...</option>
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                      <option value="flag">Flag for Review</option>
                      <option value="quarantine">Quarantine</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={moderationReason}
                      onChange={(e) => setModerationReason(e.target.value)}
                      placeholder="Explain your moderation decision..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <button
                    onClick={() => performManualModeration(
                      selectedContent.contentId,
                      moderationAction,
                      moderationReason
                    )}
                    disabled={!moderationAction || !moderationReason || loading}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Apply Moderation'}
                  </button>
                </div>
              </div>

              {/* Moderation History */}
              {moderationHistory.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Moderation History</h4>
                  <div className="space-y-2">
                    {moderationHistory.map((entry, index) => (
                      <div key={index} className="text-sm p-2 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(entry.riskLevel)}`}>
                            {entry.action}
                          </span>
                          <span className="text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">
                          Confidence: {entry.confidence}% | 
                          {entry.autoModerated ? ' Auto-moderated' : ` Manual by ${entry.moderatedBy}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4" />
              <p>Select content to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}