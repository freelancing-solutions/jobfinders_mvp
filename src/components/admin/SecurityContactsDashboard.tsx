'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Users, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  TestTube,
  Send,
  Download,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  Globe,
  Languages,
  Zap
} from 'lucide-react'

// Contact types and enums (matching the backend)
enum ContactType {
  SECURITY_TEAM = 'security_team',
  INCIDENT_COMMANDER = 'incident_commander',
  TECHNICAL_LEAD = 'technical_lead',
  LEGAL_COUNSEL = 'legal_counsel',
  COMPLIANCE_OFFICER = 'compliance_officer',
  COMMUNICATIONS_LEAD = 'communications_lead',
  EXECUTIVE_LEADERSHIP = 'executive_leadership',
  EXTERNAL_CONSULTANT = 'external_consultant',
  REGULATORY_AUTHORITY = 'regulatory_authority',
  LAW_ENFORCEMENT = 'law_enforcement',
  VENDOR_SUPPORT = 'vendor_support',
  EMERGENCY_SERVICES = 'emergency_services'
}

enum ContactPriority {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ESCALATION = 'escalation',
  EMERGENCY = 'emergency'
}

enum ContactAvailability {
  ALWAYS = 'always',
  BUSINESS_HOURS = 'business_hours',
  ON_CALL = 'on_call',
  EMERGENCY_ONLY = 'emergency_only'
}

enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  PHONE = 'phone',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook',
  PAGER = 'pager'
}

interface SecurityContact {
  id: string
  name: string
  title: string
  organization: string
  type: ContactType
  priority: ContactPriority
  availability: ContactAvailability
  contactMethods: ContactMethod[]
  specialties: string[]
  languages: string[]
  timezone: string
  isActive: boolean
  lastContactedAt?: string
  responseTimeMinutes?: number
  notes?: string
  emergencyOnly: boolean
  createdAt: string
  updatedAt: string
}

interface ContactMethod {
  method: NotificationMethod
  value: string
  isPrimary: boolean
  isVerified: boolean
  verifiedAt?: string
  lastUsedAt?: string
  failureCount: number
  maxRetries: number
}

interface ContactStatistics {
  overview: {
    totalContacts: number
    activeContacts: number
    contactsByType: Record<string, number>
    contactsByPriority: Record<string, number>
    contactsByAvailability: Record<string, number>
    totalAttempts: number
    successfulAttempts: number
    failureRate: number
    averageResponseTime: number
    totalEmergencyContacts: number
    activeEmergencyContacts: number
    totalRules: number
    activeRules: number
  }
  periodMetrics: {
    period: string
    totalAttempts: number
    successfulAttempts: number
    successRate: number
    attemptsByMethod: Record<string, { total: number; successful: number; failed: number }>
    dailyBreakdown: Array<{
      date: string
      totalAttempts: number
      successfulAttempts: number
      failedAttempts: number
    }>
  }
  coverageMetrics: {
    coverageScore: number
    timezones: Record<string, number>
    languages: Record<string, number>
    availability: Record<string, number>
    methodCoverage: Record<string, number>
    assessment: {
      timezoneDiversity: string
      languageDiversity: string
      methodDiversity: string
      availabilityCoverage: string
    }
  }
  reliability: {
    averageReliabilityScore: number
    highReliabilityContacts: number
    lowReliabilityContacts: number
    contactReliability?: Array<{
      contactId: string
      contactName: string
      contactType: string
      reliabilityScore: number
      totalMethods: number
      verifiedMethods: number
      failedMethods: number
      lastContactedAt?: string
      responseTimeMinutes?: number
    }>
  }
  recommendations: string[]
}

export default function SecurityContactsDashboard() {
  const [contacts, setContacts] = useState<SecurityContact[]>([])
  const [statistics, setStatistics] = useState<ContactStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContactType | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<ContactPriority | ''>('')
  const [availabilityFilter, setAvailabilityFilter] = useState<ContactAvailability | ''>('')
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<SecurityContact | null>(null)
  
  // Form states
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [notificationResults, setNotificationResults] = useState<any>(null)

  useEffect(() => {
    fetchContacts()
    fetchStatistics()
  }, [typeFilter, priorityFilter, availabilityFilter, activeFilter])

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (availabilityFilter) params.append('availability', availabilityFilter)
      if (activeFilter !== null) params.append('active', activeFilter.toString())

      const response = await fetch(`/api/v1/security/contacts?${params}`)
      const data = await response.json()

      if (data.success) {
        setContacts(data.data.contacts)
      } else {
        setError(data.error || 'Failed to fetch contacts')
      }
    } catch (err) {
      setError('Failed to fetch contacts')
      console.error('Error fetching contacts:', err)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/v1/security/contacts/statistics?details=true')
      const data = await response.json()

      if (data.success) {
        setStatistics(data.data)
      } else {
        setError(data.error || 'Failed to fetch statistics')
      }
    } catch (err) {
      setError('Failed to fetch statistics')
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTestContact = async (contactId: string, method?: NotificationMethod) => {
    try {
      const response = await fetch('/api/v1/security/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          contactId,
          method
        })
      })

      const data = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        [contactId]: data
      }))

      if (data.success) {
        // Refresh contacts to update last contacted time
        fetchContacts()
      }
    } catch (err) {
      console.error('Error testing contact:', err)
      setTestResults(prev => ({
        ...prev,
        [contactId]: { success: false, error: 'Test failed' }
      }))
    }
  }

  const handleNotifyContact = async (contactId: string, message: string, priority: string) => {
    try {
      const response = await fetch('/api/v1/security/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'notify',
          contactId,
          message,
          priority
        })
      })

      const data = await response.json()
      setNotificationResults(data)

      if (data.success) {
        fetchContacts()
      }
    } catch (err) {
      console.error('Error notifying contact:', err)
      setNotificationResults({ success: false, error: 'Notification failed' })
    }
  }

  const handleBulkNotify = async (contactIds: string[], message: string, priority: string) => {
    try {
      const response = await fetch('/api/v1/security/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_notify',
          contactIds,
          message,
          priority
        })
      })

      const data = await response.json()
      setNotificationResults(data)

      if (data.success) {
        fetchContacts()
      }
    } catch (err) {
      console.error('Error with bulk notification:', err)
      setNotificationResults({ success: false, error: 'Bulk notification failed' })
    }
  }

  const exportReport = () => {
    if (!statistics) return

    const reportData = {
      generatedAt: new Date().toISOString(),
      contacts: contacts.length,
      statistics
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-contacts-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getMethodIcon = (method: NotificationMethod) => {
    switch (method) {
      case NotificationMethod.EMAIL: return <Mail className="w-4 h-4" />
      case NotificationMethod.SMS: return <MessageSquare className="w-4 h-4" />
      case NotificationMethod.PHONE: return <Phone className="w-4 h-4" />
      case NotificationMethod.SLACK: return <MessageSquare className="w-4 h-4" />
      case NotificationMethod.TEAMS: return <MessageSquare className="w-4 h-4" />
      case NotificationMethod.WEBHOOK: return <Zap className="w-4 h-4" />
      case NotificationMethod.PAGER: return <AlertTriangle className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: ContactPriority) => {
    switch (priority) {
      case ContactPriority.PRIMARY: return 'text-red-600 bg-red-50'
      case ContactPriority.SECONDARY: return 'text-orange-600 bg-orange-50'
      case ContactPriority.ESCALATION: return 'text-yellow-600 bg-yellow-50'
      case ContactPriority.EMERGENCY: return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getAvailabilityColor = (availability: ContactAvailability) => {
    switch (availability) {
      case ContactAvailability.ALWAYS: return 'text-green-600 bg-green-50'
      case ContactAvailability.BUSINESS_HOURS: return 'text-blue-600 bg-blue-50'
      case ContactAvailability.ON_CALL: return 'text-orange-600 bg-orange-50'
      case ContactAvailability.EMERGENCY_ONLY: return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Security Contacts Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage emergency contacts and communication channels for security incidents
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
              <button
                onClick={exportReport}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button
                onClick={() => {
                  fetchContacts()
                  fetchStatistics()
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.overview.totalContacts}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {statistics.overview.activeContacts} active
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.periodMetrics.successRate}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {statistics.periodMetrics.successfulAttempts} / {statistics.periodMetrics.totalAttempts} attempts
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Coverage Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.coverageMetrics.coverageScore}
                  </p>
                </div>
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Object.keys(statistics.coverageMetrics.timezones).length} timezones
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.overview.averageResponseTime}m
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Average response time
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {statistics && statistics.recommendations.length > 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recommendations
            </h3>
            <ul className="space-y-2">
              {statistics.recommendations.map((recommendation, index) => (
                <li key={index} className="text-yellow-700 flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ContactType | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.values(ContactType).map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as ContactPriority | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {Object.values(ContactPriority).map(priority => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as ContactAvailability | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Availability</option>
              {Object.values(ContactAvailability).map(availability => (
                <option key={availability} value={availability}>
                  {availability.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>

            <select
              value={activeFilter === null ? '' : activeFilter.toString()}
              onChange={(e) => setActiveFilter(e.target.value === '' ? null : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Methods
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            contact.isActive ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {contact.isActive ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contact.title} • {contact.organization}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {contact.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(contact.priority)}`}>
                          {contact.priority.charAt(0).toUpperCase() + contact.priority.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {contact.contactMethods.map((method, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              method.isVerified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {getMethodIcon(method.method)}
                            {method.method.toUpperCase()}
                            {method.isPrimary && <span className="text-xs">★</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(contact.availability)}`}>
                        {contact.availability.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {contact.timezone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.lastContactedAt ? (
                        <div>
                          <div>{new Date(contact.lastContactedAt).toLocaleDateString()}</div>
                          <div className="text-xs">
                            {new Date(contact.lastContactedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestContact(contact.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Test Contact"
                        >
                          <TestTube className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContact(contact)
                            setShowNotifyModal(true)
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Send Notification"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContact(contact)
                            setShowEditModal(true)
                          }}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                          title="Edit Contact"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      {testResults[contact.id] && (
                        <div className={`text-xs mt-1 ${
                          testResults[contact.id].success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testResults[contact.id].success ? 'Test passed' : 'Test failed'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter || priorityFilter || availabilityFilter || activeFilter !== null
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first security contact.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals would be implemented here */}
      {/* CreateContactModal, EditContactModal, NotifyModal, etc. */}
    </div>
  )
}