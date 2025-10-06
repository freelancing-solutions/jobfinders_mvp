'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  RefreshCw,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchJob {
  id: string;
  type: string;
  status: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdBy: string;
  metadata: Record<string, any>;
}

interface Queue {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  processingEnabled: boolean;
  maxConcurrentJobs: number;
  priority: number;
  stats: {
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    averageWaitTime: number;
  };
}

interface BatchMonitorProps {
  className?: string;
}

export const BatchMonitor: React.FC<BatchMonitorProps> = ({ className }) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/resume/batch?action=get&limit=100');
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      setError('Error fetching jobs');
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchQueues = async () => {
    try {
      const response = await fetch('/api/resume/batch?action=queues');
      const data = await response.json();

      if (data.success) {
        setQueues(data.data);
      } else {
        setError('Failed to fetch queues');
      }
    } catch (err) {
      setError('Error fetching queues');
      console.error('Error fetching queues:', err);
    }
  };

  const toggleQueueProcessing = async (queueId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, enabled }),
      });

      if (response.ok) {
        await fetchQueues();
      }
    } catch (err) {
      console.error('Error toggling queue processing:', err);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/resume/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', jobId }),
      });

      if (response.ok) {
        await fetchJobs();
      }
    } catch (err) {
      console.error('Error cancelling job:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchQueues()]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchJobs();
      fetchQueues();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Activity className="h-4 w-4" />;
      case 'queued': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <Pause className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredJobs = jobs.filter(job => {
    const statusMatch = selectedStatus === 'all' || job.status === selectedStatus;
    const queueMatch = selectedQueue === 'all' || job.metadata?.queueId === selectedQueue;
    return statusMatch && queueMatch;
  });

  const activeJobs = jobs.filter(job => job.status === 'processing');
  const recentJobs = jobs
    .filter(job => job.status === 'completed')
    .slice(0, 10);

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Job Monitor</h2>
          <p className="text-gray-600">Monitor and manage batch processing jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchJobs()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeJobs.length}</div>
            <p className="text-xs text-gray-500">Currently processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Queued Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter(j => j.status === 'queued').length}
            </div>
            <p className="text-xs text-gray-500">Waiting to process</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter(j =>
                j.status === 'completed' &&
                new Date(j.completedAt || j.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-gray-500">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {jobs.filter(j => j.status === 'failed').length}
            </div>
            <p className="text-xs text-gray-500">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All Status</option>
              <option value="queued">Queued</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All Queues</option>
              {queues.map(queue => (
                <option key={queue.id} value={queue.id}>{queue.name}</option>
              ))}
            </select>
          </div>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Jobs ({filteredJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs">
                          {job.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {job.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(job.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(job.status)}
                              {job.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={job.progress} className="h-2" />
                            <span className="text-xs text-gray-500">{job.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.processedItems}/{job.totalItems}
                          {job.failedItems > 0 && (
                            <span className="text-red-500 text-xs ml-1">
                              ({job.failedItems} failed)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {(job.status === 'queued' || job.status === 'processing') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelJob(job.id)}
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queues" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queues.map(queue => (
              <Card key={queue.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{queue.name}</CardTitle>
                      <CardDescription>{queue.description}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant={queue.processingEnabled ? "default" : "outline"}
                      onClick={() => toggleQueueProcessing(queue.id, !queue.processingEnabled)}
                    >
                      {queue.processingEnabled ? (
                        <><Play className="h-4 w-4 mr-1" />Enabled</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-1" />Paused</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Queued</p>
                      <p className="text-2xl font-bold text-yellow-600">{queue.stats.queued}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Processing</p>
                      <p className="text-2xl font-bold text-blue-600">{queue.stats.processing}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{queue.stats.completed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{queue.stats.failed}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Concurrency: {queue.stats.processing}/{queue.maxConcurrentJobs}</span>
                      <span>Avg Wait: {Math.round(queue.stats.averageWaitTime / 1000)}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Processing Jobs ({activeJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs currently processing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map(job => (
                    <Card key={job.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">
                              {job.type.replace('_', ' ')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Job ID: {job.id}
                            </CardDescription>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            Processing
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{job.processedItems} of {job.totalItems} items</span>
                            <span>Started: {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};