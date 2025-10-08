import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  GitBranch,
  Layers,
  MessageSquare,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Zap,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Edit,
  Eye,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueueData {
  name: string;
  depth: number;
  processingRate: number;
  errorRate: number;
  averageLatency: number;
  consumerCount: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface SystemMetrics {
  totalMessages: number;
  totalProcessingRate: number;
  totalErrorRate: number;
  averageLatency: number;
  activeConsumers: number;
  memoryUsage: number;
  cpuUsage: number;
  redisMemoryUsage: number;
  redisConnections: number;
}

interface AlertData {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  queue?: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface ScheduleData {
  id: string;
  name: string;
  queue: string;
  type: string;
  nextRun: Date;
  lastRun?: Date;
  occurrenceCount: number;
  isActive: boolean;
}

interface ScalingEvent {
  id: string;
  queueName: string;
  action: 'scale_up' | 'scale_down';
  fromConsumers: number;
  toConsumers: number;
  timestamp: Date;
  status: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function MessageQueueDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedQueue, setSelectedQueue] = useState('all');

  const [queues, setQueues] = useState<QueueData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [scalingEvents, setScalingEvents] = useState<ScalingEvent[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe, selectedQueue]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [queuesRes, metricsRes, alertsRes, schedulesRes, healthRes] = await Promise.all([
        fetch('/api/message-queue?type=queues'),
        fetch('/api/message-queue?type=metrics'),
        fetch('/api/message-queue?type=alerts'),
        fetch('/api/message-queue?type=schedules'),
        fetch('/api/message-queue?type=health')
      ]);

      const queuesData = await queuesRes.json();
      const metricsData = await metricsRes.json();
      const alertsData = await alertsRes.json();
      const schedulesData = await schedulesRes.json();
      const healthData = await healthRes.json();

      setQueues(queuesData.queues || []);
      setSystemMetrics(metricsData);
      setAlerts(alertsData.active || []);
      setSchedules(schedulesData.schedules || []);
      setHealthStatus(healthData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Dashboard data has been updated."
    });
  };

  const handleQueueAction = async (queueName: string, action: string) => {
    try {
      const response = await fetch('/api/message-queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purge_queue',
          queueName
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Queue ${queueName} has been purged.`
        });
        await fetchDashboardData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} queue ${queueName}`,
        variant: "destructive"
      });
    }
  };

  const handleScheduleAction = async (scheduleId: string, action: string) => {
    try {
      const response = await fetch('/api/message-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'execute' ? 'execute_schedule' : 'update_schedule',
          scheduleId,
          ...(action === 'activate' && { updates: { isActive: true } }),
          ...(action === 'deactivate' && { updates: { isActive: false } })
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Schedule ${action}d successfully.`
        });
        await fetchDashboardData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} schedule`,
        variant: "destructive"
      });
    }
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      if (action === 'resolve') {
        const response = await fetch('/api/message-queue', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resolve_alert',
            alertId
          })
        });

        if (response.ok) {
          toast({
            title: "Alert Resolved",
            description: "The alert has been marked as resolved."
          });
          await fetchDashboardData();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Message Queue Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and management of the message queue system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">15 min</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health */}
      {healthStatus && (
        <Alert className={
          healthStatus.status === 'healthy' ? 'border-green-200 bg-green-50' :
          healthStatus.status === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }>
          {healthStatus.status === 'healthy' && <CheckCircle className="h-4 w-4" />}
          {healthStatus.status === 'degraded' && <AlertTriangle className="h-4 w-4" />}
          {healthStatus.status === 'unhealthy' && <AlertTriangle className="h-4 w-4" />}
          <AlertTitle className="capitalize">
            System Status: {healthStatus.status}
          </AlertTitle>
          <AlertDescription>
            Overall response time: {healthStatus.overallResponseTime}ms
            {healthStatus.checks.some((check: any) => check.status === 'fail') && (
              <span className="ml-2">• Some checks failed</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.totalMessages.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all queues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.totalProcessingRate.toFixed(1) || 0}/s
            </div>
            <p className="text-xs text-muted-foreground">
              Messages per second
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consumers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.activeConsumers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(
              (systemMetrics?.totalErrorRate || 0) > 0.05 ? 'critical' :
              (systemMetrics?.totalErrorRate || 0) > 0.02 ? 'warning' : 'healthy'
            )}`}>
              {((systemMetrics?.totalErrorRate || 0) * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Error percentage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="queues" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="scaling">Auto Scaling</TabsTrigger>
          <TabsTrigger value="consumers">Consumers</TabsTrigger>
        </TabsList>

        <TabsContent value="queues" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Queue List */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Overview</CardTitle>
                <CardDescription>Real-time queue status and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queues.map((queue) => (
                    <div key={queue.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{queue.name}</h4>
                          <Badge className={getStatusBgColor(queue.status)}>
                            {queue.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Depth:</span>
                            <span className="ml-1 font-medium">{queue.depth}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rate:</span>
                            <span className="ml-1 font-medium">{queue.processingRate.toFixed(1)}/s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latency:</span>
                            <span className="ml-1 font-medium">{queue.averageLatency}ms</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Consumers:</span>
                            <span className="ml-1 font-medium">{queue.consumerCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQueueAction(queue.name, 'purge')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Queue Depth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Depth</CardTitle>
                <CardDescription>Current message depth across queues</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={queues}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="depth" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Processing Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Performance</CardTitle>
                <CardDescription>Message processing metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={queues}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="processingRate" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Error Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Error Rates</CardTitle>
                <CardDescription>Error rates by queue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={queues}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="errorRate" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* System Resources */}
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
              <CardDescription>Current system resource utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Memory Usage</div>
                  <div className="text-2xl font-bold">
                    {((systemMetrics?.memoryUsage || 0) / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CPU Usage</div>
                  <div className="text-2xl font-bold">
                    {systemMetrics?.cpuUsage.toFixed(1) || 0}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Redis Memory</div>
                  <div className="text-2xl font-bold">
                    {((systemMetrics?.redisMemoryUsage || 0) / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Redis Connections</div>
                  <div className="text-2xl font-bold">
                    {systemMetrics?.redisConnections || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No active alerts</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{alert.type}</Badge>
                          <span className="font-medium">{alert.queue && `Queue: ${alert.queue}`}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {alert.timestamp.toLocaleString()}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAlertAction(alert.id, 'resolve')}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Messages</CardTitle>
              <CardDescription>Recurring and scheduled message configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{schedule.name}</h4>
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                        <div>Queue: {schedule.queue}</div>
                        <div>Type: {schedule.type}</div>
                        <div>Next Run: {schedule.nextRun.toLocaleString()}</div>
                        <div>Occurrences: {schedule.occurrenceCount}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScheduleAction(schedule.id, 'execute')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      {schedule.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleAction(schedule.id, 'deactivate')}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleAction(schedule.id, 'activate')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scaling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto Scaling Events</CardTitle>
              <CardDescription>Recent auto scaling activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scalingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-8 w-8 mx-auto mb-2" />
                    <p>No scaling events recorded</p>
                  </div>
                ) : (
                  scalingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{event.queueName}</h4>
                          <Badge variant={
                            event.action === 'scale_up' ? 'default' : 'secondary'
                          }>
                            {event.action === 'scale_up' ? 'Scale Up' : 'Scale Down'}
                          </Badge>
                          <Badge variant="outline">{event.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {event.fromConsumers} → {event.toConsumers} consumers
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consumer Instances</CardTitle>
              <CardDescription>Active consumer instances and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p>Consumer details would be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}