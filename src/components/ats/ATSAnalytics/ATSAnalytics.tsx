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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  ComposedChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Calendar,
  Target,
  Award,
  Brain,
  Shield,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ATSAnalyticsProps {
  userId: string;
  userRole: string;
}

interface AnalyticsData {
  overview: {
    totalApplications: number;
    averageScore: number;
    complianceRate: number;
    processingTime: number;
    biasDetectionRate: number;
    userSatisfaction: number;
    activeJobs: number;
    monthlyGrowth: number;
  };
  trends: {
    applications: Array<{ date: string; count: number }>;
    scores: Array<{ date: string; avgScore: number; maxScore: number; minScore: number }>;
    compliance: Array<{ date: string; compliant: number; nonCompliant: number }>;
    processing: Array<{ date: string; avgTime: number }>;
  };
  skills: {
    topSkills: Array<{ skill: string; frequency: number; demand: number }>;
    skillGaps: Array<{ skill: string; gap: number; category: string }>;
    skillDistribution: Array<{ category: string; count: number }>;
    skillTrends: Array<{ month: string; skill: string; demand: number }>;
  };
  demographics: {
    scoreDistribution: Array<{ range: string; count: number; percentage: number }>;
    sourceDistribution: Array<{ source: string; count: number }>;
    experienceDistribution: Array<{ level: string; count: number }>;
    educationDistribution: Array<{ level: string; count: number }>;
  };
  compliance: {
    violations: Array<{ type: string; count: number; severity: string }>;
    riskFactors: Array<{ factor: string; impact: number; frequency: number }>;
    remediationProgress: Array<{ action: string; status: string; dueDate: string }>;
    complianceTrends: Array<{ month: string; score: number; violations: number }>;
  };
  performance: {
    efficiency: Array<{ metric: string; current: number; target: number; trend: string }>;
    bottlenecks: Array<{ process: string; avgTime: number; issues: number }>;
    satisfaction: Array<{ aspect: string; score: number; feedback: number }>;
    utilization: Array<{ resource: string; usage: number; capacity: number }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ATSAnalytics({ userId, userRole }: ATSAnalyticsProps) {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, selectedMetric]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from the API
      const mockData: AnalyticsData = {
        overview: {
          totalApplications: 1247,
          averageScore: 78.5,
          complianceRate: 94.2,
          processingTime: 2.3,
          biasDetectionRate: 1.8,
          userSatisfaction: 4.6,
          activeJobs: 12,
          monthlyGrowth: 15.3
        },
        trends: {
          applications: [
            { date: '2024-01-01', count: 89 },
            { date: '2024-01-08', count: 124 },
            { date: '2024-01-15', count: 156 },
            { date: '2024-01-22', count: 198 },
            { date: '2024-01-29', count: 234 }
          ],
          scores: [
            { date: '2024-01-01', avgScore: 72.5, maxScore: 95, minScore: 45 },
            { date: '2024-01-08', avgScore: 75.2, maxScore: 98, minScore: 48 },
            { date: '2024-01-15', avgScore: 77.8, maxScore: 96, minScore: 52 },
            { date: '2024-01-22', avgScore: 78.9, maxScore: 97, minScore: 55 },
            { date: '2024-01-29', avgScore: 79.5, maxScore: 99, minScore: 58 }
          ],
          compliance: [
            { date: '2024-01-01', compliant: 142, nonCompliant: 8 },
            { date: '2024-01-08', compliant: 198, nonCompliant: 12 },
            { date: '2024-01-15', compliant: 267, nonCompliant: 15 },
            { date: '2024-01-22', compliant: 345, nonCompliant: 18 },
            { date: '2024-01-29', compliant: 423, nonCompliant: 21 }
          ],
          processing: [
            { date: '2024-01-01', avgTime: 3.2 },
            { date: '2024-01-08', avgTime: 2.8 },
            { date: '2024-01-15', avgTime: 2.5 },
            { date: '2024-01-22', avgTime: 2.4 },
            { date: '2024-01-29', avgTime: 2.3 }
          ]
        },
        skills: {
          topSkills: [
            { skill: 'JavaScript', frequency: 342, demand: 0.89 },
            { skill: 'React', frequency: 298, demand: 0.85 },
            { skill: 'TypeScript', frequency: 276, demand: 0.82 },
            { skill: 'Python', frequency: 234, demand: 0.88 },
            { skill: 'AWS', frequency: 198, demand: 0.79 }
          ],
          skillGaps: [
            { skill: 'Kubernetes', gap: 0.65, category: 'technical' },
            { skill: 'Machine Learning', gap: 0.58, category: 'technical' },
            { skill: 'GraphQL', gap: 0.52, category: 'technical' },
            { skill: 'DevOps', gap: 0.48, category: 'methodology' },
            { skill: 'Security', gap: 0.42, category: 'technical' }
          ],
          skillDistribution: [
            { category: 'Frontend', count: 423 },
            { category: 'Backend', count: 387 },
            { category: 'DevOps', count: 234 },
            { category: 'Data', count: 198 },
            { category: 'Mobile', count: 156 }
          ],
          skillTrends: [
            { month: 'Jan', skill: 'React', demand: 0.85 },
            { month: 'Feb', skill: 'React', demand: 0.87 },
            { month: 'Mar', skill: 'React', demand: 0.89 },
            { month: 'Jan', skill: 'Vue', demand: 0.45 },
            { month: 'Feb', skill: 'Vue', demand: 0.48 },
            { month: 'Mar', skill: 'Vue', demand: 0.52 }
          ]
        },
        demographics: {
          scoreDistribution: [
            { range: '90-100', count: 124, percentage: 10 },
            { range: '80-89', count: 342, percentage: 27 },
            { range: '70-79', count: 398, percentage: 32 },
            { range: '60-69', count: 267, percentage: 21 },
            { range: '50-59', count: 87, percentage: 7 },
            { range: 'Below 50', count: 29, percentage: 3 }
          ],
          sourceDistribution: [
            { source: 'LinkedIn', count: 456 },
            { source: 'Indeed', count: 342 },
            { source: 'Company Website', count: 234 },
            { source: 'Referrals', count: 156 },
            { source: 'Other', count: 59 }
          ],
          experienceDistribution: [
            { level: 'Entry', count: 234 },
            { level: 'Mid', count: 567 },
            { level: 'Senior', count: 387 },
            { level: 'Executive', count: 59 }
          ],
          educationDistribution: [
            { level: 'High School', count: 45 },
            { level: 'Associate', count: 78 },
            { level: 'Bachelor', count: 678 },
            { level: 'Master', count: 389 },
            { level: 'PhD', count: 57 }
          ]
        },
        compliance: {
          violations: [
            { type: 'Age Discrimination', count: 12, severity: 'high' },
            { type: 'Gender Bias', count: 8, severity: 'medium' },
            { type: 'Accessibility', count: 5, severity: 'low' },
            { type: 'Data Privacy', count: 3, severity: 'high' }
          ],
          riskFactors: [
            { factor: 'Job Description Language', impact: 0.65, frequency: 23 },
            { factor: 'Interview Questions', impact: 0.48, frequency: 15 },
            { factor: 'Application Forms', impact: 0.32, frequency: 8 }
          ],
          remediationProgress: [
            { action: 'Update Job Descriptions', status: 'in_progress', dueDate: '2024-02-15' },
            { action: 'Review Interview Process', status: 'pending', dueDate: '2024-02-20' },
            { action: 'Train Hiring Managers', status: 'completed', dueDate: '2024-01-30' }
          ],
          complianceTrends: [
            { month: 'Jan', score: 92.5, violations: 12 },
            { month: 'Feb', score: 94.2, violations: 8 },
            { month: 'Mar', score: 95.8, violations: 5 }
          ]
        },
        performance: {
          efficiency: [
            { metric: 'Processing Speed', current: 2.3, target: 2.0, trend: 'improving' },
            { metric: 'Accuracy Rate', current: 94.2, target: 95.0, trend: 'stable' },
            { metric: 'User Satisfaction', current: 4.6, target: 4.8, trend: 'improving' },
            { metric: 'System Uptime', current: 99.9, target: 99.9, trend: 'stable' }
          ],
          bottlenecks: [
            { process: 'Resume Parsing', avgTime: 1.2, issues: 3 },
            { process: 'Compliance Check', avgTime: 0.8, issues: 1 },
            { process: 'Score Calculation', avgTime: 0.3, issues: 0 }
          ],
          satisfaction: [
            { aspect: 'Ease of Use', score: 4.7, feedback: 234 },
            { aspect: 'Accuracy', score: 4.5, feedback: 189 },
            { aspect: 'Speed', score: 4.8, feedback: 156 },
            { aspect: 'Support', score: 4.3, feedback: 98 }
          ],
          utilization: [
            { resource: 'API Calls', usage: 87, capacity: 100 },
            { resource: 'Storage', usage: 65, capacity: 100 },
            { resource: 'Processing Units', usage: 92, capacity: 100 }
          ]
        }
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Analytics data has been updated."
    });
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      // In production, this would call the export API
      toast({
        title: "Export Started",
        description: `Generating ${format.toUpperCase()} report...`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report.",
        variant: "destructive"
      });
    }
  };

  const getMetricColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ATS Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your Applicant Tracking System
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
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
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalApplications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{data.overview.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Scoring accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Regulatory compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.processingTime}s</div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Application Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Application Volume</CardTitle>
                <CardDescription>Daily application submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.trends.applications}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Application score ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.demographics.scoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percentage }) => `${range}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.demographics.scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bias Detection */}
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertTitle>Bias Detection Summary</AlertTitle>
            <AlertDescription>
              {data.overview.biasDetectionRate}% of flagged items contained potential bias.
              All items have been reviewed and appropriate actions taken.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Score Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Score Performance</CardTitle>
                <CardDescription>Average, maximum, and minimum scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.trends.scores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgScore" stroke="#8884d8" name="Average" />
                    <Line type="monotone" dataKey="maxScore" stroke="#82ca9d" name="Maximum" />
                    <Line type="monotone" dataKey="minScore" stroke="#ffc658" name="Minimum" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Trends</CardTitle>
                <CardDescription>Compliant vs non-compliant applications</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={data.trends.compliance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="compliant" fill="#82ca9d" name="Compliant" />
                    <Bar dataKey="nonCompliant" fill="#ff8042" name="Non-Compliant" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Most In-Demand Skills</CardTitle>
                <CardDescription>Top skills by frequency and market demand</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.skills.topSkills}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Gap Analysis</CardTitle>
                <CardDescription>Areas where skills are most lacking</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.skills.skillGaps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="gap" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Skill Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Categories</CardTitle>
              <CardDescription>Distribution of skills across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.skills.skillDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category }) => category}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.skills.skillDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Violations */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Violations</CardTitle>
                <CardDescription>Types and frequency of violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.compliance.violations.map((violation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{violation.type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {violation.count} occurrences
                        </p>
                      </div>
                      <Badge variant={
                        violation.severity === 'high' ? 'destructive' :
                        violation.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {violation.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Remediation Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Remediation Actions</CardTitle>
                <CardDescription>Progress on compliance improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.compliance.remediationProgress.map((action, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{action.action}</h4>
                        <Badge variant={
                          action.status === 'completed' ? 'default' :
                          action.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {action.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(action.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Score Trend</CardTitle>
              <CardDescription>Monthly compliance performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.compliance.complianceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#82ca9d" name="Score" />
                  <Line type="monotone" dataKey="violations" stroke="#ff8042" name="Violations" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Efficiency Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.efficiency.map((metric, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{metric.metric}</h4>
                        <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${getMetricColor(metric.current, metric.target)}`}>
                          {metric.current}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {metric.target}
                        </span>
                      </div>
                      <Progress
                        value={(metric.current / metric.target) * 100}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle>User Satisfaction</CardTitle>
                <CardDescription>Feedback ratings by aspect</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={data.performance.satisfaction}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="aspect" />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
                    <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Experience Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Experience Levels</CardTitle>
                <CardDescription>Distribution by experience</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.demographics.experienceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level }) => level}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.demographics.experienceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Education Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Education Levels</CardTitle>
                <CardDescription>Distribution by education</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.demographics.educationDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Application Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Application Sources</CardTitle>
              <CardDescription>Where applicants are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.demographics.sourceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}