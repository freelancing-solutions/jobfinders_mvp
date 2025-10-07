/**
 * Application Service for JobFinders MVP
 * Handles all application-related API calls and business logic
 */

import {
  Application,
  ApplicationFilters,
  ApplicationListConfig,
  ApplicationStats,
  ApplicationTimelineEvent,
  ApplicationNote,
  ApplicationReminder,
  ApplicationExportConfig,
  ApplicationBulkAction,
  GetApplicationsRequest,
  GetApplicationsResponse,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationUpdateEvent,
  ApplicationWebSocketEvents,
} from '@/types/applications'
import { applicationSocketIO } from './websocket-socketio'

/**
 * Application API Service
 */
export class ApplicationService {
  private baseUrl: string

  constructor(baseUrl: string = '/api/applications') {
    this.baseUrl = baseUrl
  }

  /**
   * Get applications with filtering and pagination
   */
  async getApplications(request?: GetApplicationsRequest): Promise<GetApplicationsResponse> {
    const params = new URLSearchParams()

    if (request?.query) {
      const { query } = request

      if (query.page) params.append('page', query.page.toString())
      if (query.pageSize) params.append('pageSize', query.pageSize.toString())
      if (query.status?.length) params.append('status', query.status.join(','))
      if (query.dateFrom) params.append('dateFrom', query.dateFrom)
      if (query.dateTo) params.append('dateTo', query.dateTo)
      if (query.company) params.append('company', query.company)
      if (query.jobTitle) params.append('jobTitle', query.jobTitle)
      if (query.search) params.append('search', query.search)
      if (query.sortBy) params.append('sortBy', query.sortBy)
      if (query.sortOrder) params.append('sortOrder', query.sortOrder)
      if (query.includeAnalytics) params.append('includeAnalytics', 'true')
      if (query.includeNotes) params.append('includeNotes', 'true')
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get a single application by ID
   */
  async getApplication(id: string): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch application: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create a new application
   */
  async createApplication(data: CreateApplicationRequest): Promise<Application> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create application: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update an existing application
   */
  async updateApplication(id: string, data: UpdateApplicationRequest): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update application: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    id: string,
    status: Application['status'],
    note?: string
  ): Promise<Application> {
    return this.updateApplication(id, { status, notes: note })
  }

  /**
   * Add a note to an application
   */
  async addApplicationNote(id: string, note: Omit<ApplicationNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/${id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    })

    if (!response.ok) {
      throw new Error(`Failed to add note: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Upload attachment for application
   */
  async uploadAttachment(
    id: string,
    file: File,
    description?: string
  ): Promise<Application> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    const response = await fetch(`${this.baseUrl}/${id}/attachments`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload attachment: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete application
   */
  async deleteApplication(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete application: ${response.statusText}`)
    }
  }

  /**
   * Archive application
   */
  async archiveApplication(id: string): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/${id}/archive`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to archive application: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Withdraw application
   */
  async withdrawApplication(id: string, reason?: string): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/${id}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      throw new Error(`Failed to withdraw application: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(filters?: ApplicationFilters): Promise<ApplicationStats> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }

    const response = await fetch(`${this.baseUrl}/stats?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch application stats: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Search applications using semantic search
   */
  async searchApplications(query: string, limit?: number): Promise<Application[]> {
    const params = new URLSearchParams()
    params.append('q', query)
    if (limit) params.append('limit', limit.toString())

    const response = await fetch(`${this.baseUrl}/search?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to search applications: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Export applications
   */
  async exportApplications(config: ApplicationExportConfig): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`Failed to export applications: ${response.statusText}`)
    }

    return response.blob()
  }

  /**
   * Perform bulk action on applications
   */
  async performBulkAction(action: ApplicationBulkAction): Promise<{
    success: string[]
    failed: Array<{ id: string; error: string }>
  }> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    })

    if (!response.ok) {
      throw new Error(`Failed to perform bulk action: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Set up reminder for application
   */
  async setReminder(applicationId: string, reminder: Omit<ApplicationReminder, 'id'>): Promise<ApplicationReminder> {
    const response = await fetch(`${this.baseUrl}/${applicationId}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reminder),
    })

    if (!response.ok) {
      throw new Error(`Failed to set reminder: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get all reminders for a user
   */
  async getReminders(): Promise<ApplicationReminder[]> {
    const response = await fetch(`${this.baseUrl}/reminders`)
    if (!response.ok) {
      throw new Error(`Failed to fetch reminders: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reminders/${reminderId}/complete`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to complete reminder: ${response.statusText}`)
    }
  }

  /**
   * Add event listener for Socket.IO events
   */
  addEventListener<T extends keyof ApplicationWebSocketEvents>(
    event: T,
    callback: (data: ApplicationWebSocketEvents[T]) => void
  ): void {
    applicationSocketIO.addEventListener(event, callback)
  }

  /**
   * Remove event listener
   */
  removeEventListener<T extends keyof ApplicationWebSocketEvents>(
    event: T,
    callback: (data: ApplicationWebSocketEvents[T]) => void
  ): void {
    applicationSocketIO.removeEventListener(event, callback)
  }

  /**
   * Close Socket.IO connection
   */
  closeWebSocket(): void {
    applicationSocketIO.disconnect()
  }

  /**
   * Get Socket.IO connection status
   */
  get isConnected(): boolean {
    return applicationSocketIO.isConnected
  }

  /**
   * Get Socket.IO connection state
   */
  get connectionState(): string {
    return applicationSocketIO.connectionState
  }

  /**
   * Get suggested jobs based on existing applications
   */
  async getJobSuggestions(limit: number = 10): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/suggestions/jobs?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Failed to get job suggestions: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get application insights powered by AI
   */
  async getApplicationInsights(applicationId: string): Promise<{
    strengths: string[]
    improvements: string[]
    nextSteps: string[]
    successProbability: number
    marketInsights: string[]
  }> {
    const response = await fetch(`${this.baseUrl}/${applicationId}/insights`)
    if (!response.ok) {
      throw new Error(`Failed to get application insights: ${response.statusText}`)
    }

    return response.json()
  }
}

// Create singleton instance
export const applicationService = new ApplicationService()

// Export types for use in components
export type {
  Application,
  ApplicationFilters,
  ApplicationListConfig,
  ApplicationStats,
  ApplicationTimelineEvent,
  ApplicationNote,
  ApplicationReminder,
  ApplicationExportConfig,
  ApplicationBulkAction,
}