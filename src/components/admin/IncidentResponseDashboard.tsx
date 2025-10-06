'use client'

import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react'

// Types
interface IncidentStatistics {
  total: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  byStatus: Record<string, number>
  averageResolutionTime: number
  openIncidents: number
  timeframe: string
  criticalIncidents: number
  highSeverityIncidents: number
  dataBreaches: number
  securityBreaches: number
  responseTimeMetrics: {
    average: number
    median: number
    fastest: number
    slowest: number
  }
  trendData: {
    totalIncidents: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
    criticalIncidents: {
      current: number
      previous: number
      change: number
    }
    averageResolutionTime: {
      current: number
      previous: number
      change: number
    }
  }
  complianceMetrics: {
    dataBreachNotifications: {
      total: number
      notifiedWithin72Hours: number
    }
    incidentResponseTimes: {
      within15Minutes: number
      total: number
    }
  }
  riskAssessment: {
    currentRiskLevel: 'low' | 'medium' | 'high' | 'critical'
    riskFactors: string[]
    recommendations: string[]
  }
}

interface Incident {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: string
  title: string
  description: string
  affectedSystems: string[]
  affectedUsersCount: number
  detectedAt: string
  reportedAt: string
  reportedBy: string
  assignedTo?: string
  responseTeam: Array<{
    role: string
    assignedAt: string
    isActive: boolean
  }>
  timelineCount: number
  containmentActionsCount: number
  evidenceCount: number
  estimatedImpact?: {
    usersAffected: number
    systemsAffected: string[]
    businessImpact: string
    reputationalImpact: string
  }
  createdAt: string
  updatedAt: string
}

interface NewIncidentForm {
  type: string
  severity: string
  title: string
  description: string
  affectedSystems: string[]
  affectedUsers: string[]
  useQuickReport: boolean
}

const IncidentResponseDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<IncidentStatistics | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('month')
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // New incident form state
  const [newIncident, setNewIncident] = useState<NewIncidentForm>({
    type: '',
    severity: '',
    title: '',
    description: '',
    affectedSystems: [],
    affectedUsers: [],
    useQuickReport: false
  })

  // Available options
  const incidentTypes = [
    'security_breach', 'data_breach', 'system_outage', 'unauthorized_access',
    'malware_detection', 'ddos_attack', 'phishing_attempt', 'insider_threat',
    'compliance_violation', 'privacy_incident'
  ]

  const severityLevels = ['low', 'medium', 'high', 'critical']
  const statusOptions = ['reported', 'acknowledged', 'investigating', 'contained', 'resolved', 'closed']

  useEffect(() => {
    fetchStatistics()
    fetchIncidents()
  }, [timeframe, filters, pagination.page])

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/v1/incidents/statistics?timeframe=${timeframe}`)
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      const data = await response.json()
      setStatistics(data.statistics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
    }
  }

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`/api/v1/incidents?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch incidents')
      }
      const data = await response.json()
      setIncidents(data.incidents)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents')
    } finally {
      setLoading(false)
    }
  }

  const handleReportIncident = async () => {
    try {
      const response = await fetch('/api/v1/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newIncident)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to report incident')
      }

      const data = await response.json()
      
      // Reset form and close modal
      setNewIncident({
        type: '',
        severity: '',
        title: '',
        description: '',
        affectedSystems: [],
        affectedUsers: [],
        useQuickReport: false
      })
      setShowNewIncidentForm(false)

      // Refresh data
      fetchStatistics()
      fetchIncidents()

      alert(`Incident reported successfully! ID: ${data.incident.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to report incident')
    }
  }

  const handleUpdateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/v1/incidents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          incidentId,
          action: 'update_status',
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update incident status')
      }

      // Refresh incidents
      fetchIncidents()
      fetchStatistics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update incident status')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      case 'investigating': return 'text-blue-600 bg-blue-100'
      case 'contained': return 'text-purple-600 bg-purple-100'
      case 'acknowledged': return 'text-yellow-600 bg-yellow-100'
      case 'reported': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const exportReport = () => {
    if (!statistics) return

    const reportData = {
      generatedAt: new Date().toISOString(),
      timeframe,
      statistics,
      incidents: incidents.map(incident => ({
        ...incident,
        affectedUsers: undefined // Remove sensitive data
      }))
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incident-report-${timeframe}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">Error: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Response Dashboard</h1>
          <p className="text-gray-600">Monitor and manage security incidents</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'day' | 'week' | 'month')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={() => setShowNewIncidentForm(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </button>
        </div>
      </div>

      {statistics && (
        <>
          {/* Risk Assessment */}
          <div className={`p-4 rounded-lg border-2 ${getRiskLevelColor(statistics.riskAssessment.currentRiskLevel)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Current Risk Level: {statistics.riskAssessment.currentRiskLevel.toUpperCase()}</h3>
                <p className="text-sm opacity-75">Based on open incidents and recent activity</p>
              </div>
              <AlertTriangle className="h-8 w-8" />
            </div>
            {statistics.riskAssessment.riskFactors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-sm">Risk Factors:</p>
                <ul className="text-sm mt-1 space-y-1">
                  {statistics.riskAssessment.riskFactors.map((factor, index) => (
                    <li key={index} className="flex items-center">
                      <AlertCircle className="h-3 w-3 mr-2" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                  <div className="flex items-center mt-1">
                    {statistics.trendData.totalIncidents.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                    )}
                    <span className={`text-sm ${statistics.trendData.totalIncidents.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {statistics.trendData.totalIncidents.changePercent}% vs previous period
                    </span>
                  </div>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Incidents</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.criticalIncidents}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">
                      {statistics.trendData.criticalIncidents.change >= 0 ? '+' : ''}{statistics.trendData.criticalIncidents.change} vs previous
                    </span>
                  </div>
                </div>
                <Shield className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.openIncidents}</p>
                  <p className="text-sm text-gray-500 mt-1">Require attention</p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.averageResolutionTime}h</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm ${statistics.trendData.averageResolutionTime.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {statistics.trendData.averageResolutionTime.change <= 0 ? '' : '+'}{statistics.trendData.averageResolutionTime.change}h vs previous
                    </span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Response Time Metrics */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{statistics.responseTimeMetrics.average}m</p>
                <p className="text-sm text-gray-600">Average Response</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{statistics.responseTimeMetrics.median}m</p>
                <p className="text-sm text-gray-600">Median Response</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{statistics.responseTimeMetrics.fastest}m</p>
                <p className="text-sm text-gray-600">Fastest Response</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{statistics.responseTimeMetrics.slowest}m</p>
                <p className="text-sm text-gray-600">Slowest Response</p>
              </div>
            </div>
          </div>

          {/* Compliance Metrics */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Data Breach Notifications</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notified within 72 hours</span>
                  <span className="font-semibold">
                    {statistics.complianceMetrics.dataBreachNotifications.notifiedWithin72Hours}/
                    {statistics.complianceMetrics.dataBreachNotifications.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${statistics.complianceMetrics.dataBreachNotifications.total > 0 
                        ? (statistics.complianceMetrics.dataBreachNotifications.notifiedWithin72Hours / statistics.complianceMetrics.dataBreachNotifications.total) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Response Time Compliance</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Responded within 15 minutes</span>
                  <span className="font-semibold">
                    {statistics.complianceMetrics.incidentResponseTimes.within15Minutes}/
                    {statistics.complianceMetrics.incidentResponseTimes.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${statistics.complianceMetrics.incidentResponseTimes.total > 0 
                        ? (statistics.complianceMetrics.incidentResponseTimes.within15Minutes / statistics.complianceMetrics.incidentResponseTimes.total) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {statistics.riskAssessment.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {statistics.riskAssessment.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start text-blue-800">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {incidentTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                {severityLevels.map(severity => (
                  <option key={severity} value={severity}>{severity.toUpperCase()}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                      <div className="text-sm text-gray-500">ID: {incident.id}</div>
                      {incident.affectedUsersCount > 0 && (
                        <div className="text-xs text-red-600">{incident.affectedUsersCount} users affected</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {incident.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(incident.reportedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {incident.responseTeam.length} members
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedIncident(incident.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {!['resolved', 'closed'].includes(incident.status) && (
                      <select
                        onChange={(e) => handleUpdateIncidentStatus(incident.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        defaultValue=""
                      >
                        <option value="" disabled>Update Status</option>
                        {statusOptions
                          .filter(status => status !== incident.status)
                          .map(status => (
                            <option key={status} value={status}>
                              {status.toUpperCase()}
                            </option>
                          ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} incidents
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Incident Modal */}
      {showNewIncidentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report New Incident</h3>
              <button
                onClick={() => setShowNewIncidentForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Type *
                  </label>
                  <select
                    value={newIncident.type}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select type...</option>
                    {incidentTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity *
                  </label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select severity...</option>
                    {severityLevels.map(severity => (
                      <option key={severity} value={severity}>
                        {severity.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the incident"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of what happened, when it was discovered, and any immediate actions taken"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affected Systems
                </label>
                <input
                  type="text"
                  value={newIncident.affectedSystems.join(', ')}
                  onChange={(e) => setNewIncident(prev => ({ 
                    ...prev, 
                    affectedSystems: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comma-separated list of affected systems"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newIncident.useQuickReport}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, useQuickReport: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Use quick report template (auto-fills response procedures)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowNewIncidentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportIncident}
                  disabled={!newIncident.type || !newIncident.severity || !newIncident.title || !newIncident.description}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Report Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IncidentResponseDashboard