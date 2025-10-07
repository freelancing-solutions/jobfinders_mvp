/**
 * React hooks for template export functionality
 * Provides state management and methods for exporting resumes
 */

import { useState, useCallback, useEffect } from 'react';
import { ExportManager, BatchExportJob, ExportHistory, ExportSchedule } from '@/services/template-engine/export/export-manager';
import { ExportService, ExportRequest, ExportResult, ExportFormat } from '@/services/template-engine/export/export-service';
import { ResumeTemplate, TemplateCustomization, ExportOptions } from '@/types/template';

interface UseTemplateExportOptions {
  template: ResumeTemplate;
  customization: TemplateCustomization;
  content: any;
  onExportComplete?: (result: ExportResult) => void;
  onError?: (error: Error) => void;
}

interface ExportState {
  isExporting: boolean;
  exportProgress: number;
  currentFormat: ExportFormat | null;
  history: ExportHistory[];
  statistics: {
    totalExports: number;
    exportsByFormat: Record<ExportFormat, number>;
    averageSize: number;
    popularFormats: Array<{ format: ExportFormat; count: number; percentage: number }>;
  } | null;
}

interface BatchExportState {
  jobs: BatchExportJob[];
  activeJobs: BatchExportJob[];
  completedJobs: BatchExportJob[];
}

interface ScheduledExportState {
  schedules: ExportSchedule[];
  activeSchedules: ExportSchedule[];
}

export function useTemplateExport({
  template,
  customization,
  content,
  onExportComplete,
  onError
}: UseTemplateExportOptions) {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    exportProgress: 0,
    currentFormat: null,
    history: [],
    statistics: null
  });

  const [batchState, setBatchState] = useState<BatchExportState>({
    jobs: [],
    activeJobs: [],
    completedJobs: []
  });

  const [scheduledState, setScheduledState] = useState<ScheduledExportState>({
    schedules: [],
    activeSchedules: []
  });

  // Load initial data
  useEffect(() => {
    loadExportHistory();
    loadBatchJobs();
    loadScheduledExports();
    loadStatistics();
  }, []);

  // Auto-refresh active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActiveJobs();
      refreshScheduledExports();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadExportHistory = useCallback(() => {
    const { history } = ExportManager.getExportHistory({ limit: 20 });
    setExportState(prev => ({ ...prev, history }));
  }, []);

  const loadBatchJobs = useCallback(() => {
    const jobs = ExportManager.getAllBatchJobs();
    const activeJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
    const completedJobs = jobs.filter(job => job.status === 'completed' || job.status === 'failed');

    setBatchState({ jobs, activeJobs, completedJobs });
  }, []);

  const loadScheduledExports = useCallback(() => {
    const schedules = ExportManager.getAllScheduledExports();
    const activeSchedules = schedules.filter(schedule => schedule.active && schedule.schedule.enabled);

    setScheduledState({ schedules, activeSchedules });
  }, []);

  const loadStatistics = useCallback(() => {
    const stats = ExportManager.getExportStatistics();
    setExportState(prev => ({ ...prev, statistics: stats }));
  }, []);

  const refreshActiveJobs = useCallback(() => {
    const jobs = ExportManager.getAllBatchJobs();
    const activeJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');

    setBatchState(prev => ({
      ...prev,
      jobs,
      activeJobs
    }));
  }, []);

  const refreshScheduledExports = useCallback(() => {
    const schedules = ExportManager.getAllScheduledExports();
    const activeSchedules = schedules.filter(schedule => schedule.active && schedule.schedule.enabled);

    setScheduledState({ schedules, activeSchedules });
  }, []);

  // Single export methods
  const exportResume = useCallback(async (
    format: ExportFormat,
    options?: ExportOptions
  ): Promise<ExportResult | null> => {
    setExportState(prev => ({
      ...prev,
      isExporting: true,
      currentFormat: format,
      exportProgress: 0
    }));

    try {
      const request: ExportRequest = {
        template,
        customization,
        content,
        format,
        options
      };

      const result = await ExportManager.exportWithHistory(request);

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        currentFormat: null,
        exportProgress: 100
      }));

      if (result.success) {
        loadExportHistory();
        loadStatistics();

        // Trigger download
        if (result.data && result.filename) {
          downloadFile(result.data, result.filename, result.mimeType);
        }

        if (onExportComplete) {
          onExportComplete(result);
        }
      } else {
        throw new Error(result.error || 'Export failed');
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed');

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        currentFormat: null,
        exportProgress: 0
      }));

      if (onError) {
        onError(err);
      }

      return null;
    }
  }, [template, customization, content, onExportComplete, onError, loadExportHistory, loadStatistics]);

  const exportToPDF = useCallback((options?: ExportOptions) =>
    exportResume('PDF', options), [exportResume]);

  const exportToDOCX = useCallback((options?: ExportOptions) =>
    exportResume('DOCX', options), [exportResume]);

  const exportToHTML = useCallback((options?: ExportOptions) =>
    exportResume('HTML', options), [exportResume]);

  const exportToTXT = useCallback((options?: ExportOptions) =>
    exportResume('TXT', options), [exportResume]);

  const exportToJSON = useCallback((options?: ExportOptions) =>
    exportResume('JSON', options), [exportResume]);

  // Batch export methods
  const createBatchExport = useCallback((
    name: string,
    formats: ExportFormat[],
    options?: {
      notifyOnComplete?: boolean;
      email?: string;
      compress?: boolean;
    }
  ) => {
    const job = ExportManager.createBatchJob(name, {
      template,
      customization,
      content,
      formats
    }, options);

    loadBatchJobs();
    return job;
  }, [template, customization, content, loadBatchJobs]);

  const processBatchJob = useCallback(async (jobId: string) => {
    try {
      const job = await ExportManager.processBatchJob(jobId);
      loadBatchJobs();
      loadStatistics();
      return job;
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error('Batch export failed'));
      }
      return null;
    }
  }, [onError, loadBatchJobs, loadStatistics]);

  const cancelBatchJob = useCallback((jobId: string) => {
    const success = ExportManager.cancelBatchJob(jobId);
    if (success) {
      loadBatchJobs();
    }
    return success;
  }, [loadBatchJobs]);

  const deleteBatchJob = useCallback((jobId: string) => {
    const success = ExportManager.deleteBatchJob(jobId);
    if (success) {
      loadBatchJobs();
    }
    return success;
  }, [loadBatchJobs]);

  // Scheduled export methods
  const createScheduledExport = useCallback((
    name: string,
    format: ExportFormat,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      enabled?: boolean;
    }
  ) => {
    const scheduled = ExportManager.createScheduledExport(name, {
      template,
      customization,
      content,
      format
    }, {
      ...schedule,
      enabled: schedule.enabled ?? true
    });

    loadScheduledExports();
    return scheduled;
  }, [template, customization, content, loadScheduledExports]);

  const updateScheduledExport = useCallback((id: string, updates: Partial<ExportSchedule>) => {
    const success = ExportManager.updateScheduledExport(id, updates);
    if (success) {
      loadScheduledExports();
    }
    return success;
  }, [loadScheduledExports]);

  const deleteScheduledExport = useCallback((id: string) => {
    const success = ExportManager.deleteScheduledExport(id);
    if (success) {
      loadScheduledExports();
    }
    return success;
  }, [loadScheduledExports]);

  // Preview methods
  const previewExport = useCallback(async (format: ExportFormat, options?: ExportOptions) => {
    try {
      const request: ExportRequest = {
        template,
        customization,
        content,
        format,
        options
      };

      return await ExportService.previewExport(request);
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error('Preview failed'));
      }
      return null;
    }
  }, [template, customization, content, onError]);

  // Validation methods
  const validateExport = useCallback((format: ExportFormat, options?: ExportOptions) => {
    const request: ExportRequest = {
      template,
      customization,
      content,
      format,
      options
    };

    return ExportManager.validateRequest(request);
  }, [template, customization, content]);

  // History management
  const searchHistory = useCallback((query: string) => {
    return ExportManager.searchExportHistory(query);
  }, []);

  const clearHistory = useCallback((olderThan?: Date) => {
    const clearedCount = ExportManager.clearHistory(olderThan);
    loadExportHistory();
    loadStatistics();
    return clearedCount;
  }, [loadExportHistory, loadStatistics]);

  // Utility methods
  const downloadFile = useCallback((data: string | ArrayBuffer, filename: string, mimeType?: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    // Export state
    isExporting: exportState.isExporting,
    exportProgress: exportState.exportProgress,
    currentFormat: exportState.currentFormat,
    history: exportState.history,
    statistics: exportState.statistics,

    // Single export
    exportResume,
    exportToPDF,
    exportToDOCX,
    exportToHTML,
    exportToTXT,
    exportToJSON,

    // Batch export
    batchState,
    createBatchExport,
    processBatchJob,
    cancelBatchJob,
    deleteBatchJob,

    // Scheduled export
    scheduledState,
    createScheduledExport,
    updateScheduledExport,
    deleteScheduledExport,

    // Preview and validation
    previewExport,
    validateExport,

    // History management
    searchHistory,
    clearHistory,
    loadExportHistory,

    // Utility
    downloadFile
  };
}

// Additional specialized hooks
export function useBatchExport() {
  const [jobs, setJobs] = useState<BatchExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadJobs = useCallback(() => {
    setIsLoading(true);
    const allJobs = ExportManager.getAllBatchJobs();
    setJobs(allJobs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const createJob = useCallback((
    name: string,
    requests: Omit<ExportRequest, 'format'> & { formats: ExportFormat[] },
    options?: BatchExportJob['options']
  ) => {
    const job = ExportManager.createBatchJob(name, requests, options);
    loadJobs();
    return job;
  }, [loadJobs]);

  const processJob = useCallback(async (jobId: string) => {
    const job = await ExportManager.processBatchJob(jobId);
    loadJobs();
    return job;
  }, [loadJobs]);

  const cancelJob = useCallback((jobId: string) => {
    const success = ExportManager.cancelBatchJob(jobId);
    if (success) {
      loadJobs();
    }
    return success;
  }, [loadJobs]);

  const deleteJob = useCallback((jobId: string) => {
    const success = ExportManager.deleteBatchJob(jobId);
    if (success) {
      loadJobs();
    }
    return success;
  }, [loadJobs]);

  return {
    jobs,
    isLoading,
    loadJobs,
    createJob,
    processJob,
    cancelJob,
    deleteJob
  };
}

export function useExportHistory() {
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback((options?: {
    templateId?: string;
    format?: ExportFormat;
    limit?: number;
    offset?: number;
  }) => {
    setIsLoading(true);
    const result = ExportManager.getExportHistory(options);
    setHistory(result.history);
    setIsLoading(false);
    return result;
  }, []);

  const searchHistory = useCallback((query: string) => {
    return ExportManager.searchExportHistory(query);
  }, []);

  const recordDownload = useCallback((historyId: string) => {
    const success = ExportManager.recordDownload(historyId);
    if (success) {
      loadHistory();
    }
    return success;
  }, [loadHistory]);

  const clearHistory = useCallback((olderThan?: Date) => {
    const clearedCount = ExportManager.clearHistory(olderThan);
    loadHistory();
    return clearedCount;
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    loadHistory,
    searchHistory,
    recordDownload,
    clearHistory
  };
}

export function useScheduledExports() {
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSchedules = useCallback(() => {
    setIsLoading(true);
    const allSchedules = ExportManager.getAllScheduledExports();
    setSchedules(allSchedules);
    setIsLoading(false);
  }, []);

  const createSchedule = useCallback((
    name: string,
    request: ExportRequest,
    schedule: ExportSchedule['schedule']
  ) => {
    const scheduled = ExportManager.createScheduledExport(name, request, schedule);
    loadSchedules();
    return scheduled;
  }, [loadSchedules]);

  const updateSchedule = useCallback((id: string, updates: Partial<ExportSchedule>) => {
    const success = ExportManager.updateScheduledExport(id, updates);
    if (success) {
      loadSchedules();
    }
    return success;
  }, [loadSchedules]);

  const deleteSchedule = useCallback((id: string) => {
    const success = ExportManager.deleteScheduledExport(id);
    if (success) {
      loadSchedules();
    }
    return success;
  }, [loadSchedules]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  return {
    schedules,
    isLoading,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  };
}