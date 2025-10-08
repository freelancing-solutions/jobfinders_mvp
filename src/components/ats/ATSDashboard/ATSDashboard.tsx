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
  Cell
} from 'recharts';
import {
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Target,
  Award,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ATSDashboardProps {
  jobId?: string;
  userId: string;
}

interface ATSData {
  overview: {
    totalJobs: number;
    totalApplications: number;
    averageScore: number;
    complianceRate: number;
    recentApplications: number;
  };
  jobBreakdown: Array<{
    id: string;
    title: string;
    applicationCount: number;
    averageScore: number;
    complianceRate: number;
  }>;
  trends: {
    applicationGrowth: number;
    scoreImprovement: number;
    complianceImprovement: number;
  };
  applications: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    status: string;
    appliedAt: string;
    atsAnalysis?: {
      overallScore: number;
      skillsMatch: number;
      experienceMatch: number;
      educationMatch: number;
      confidence: number;
    };
    atsCompliance?: {
      status: string;
      overallScore: number;
      riskLevel: string;
    };
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ATSDashboard({ jobId, userId }: ATSDashboardProps) {
  const { toast } = useToast();
  const [data, setData] = useState<ATSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>(jobId || 'all');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchATSData();
  }, [selectedJob, timeframe]);

  const fetchATSData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ats?type=analytics${selectedJob !== 'all' ? `&id=${selectedJob}` : ''}`);
      if (response.ok) {
        const atsData = await response.json();
        setData(atsData);
      } else {
        throw new Error('Failed to fetch ATS data');
      }
    } catch (error) {
      console.error('Error fetching ATS data:', error);
      toast({
        title: "Error",
        description: "Failed to load ATS data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchATSData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "ATS data has been updated."
    });
  };

  const handleAnalyzeApplication = async (applicationId: string) => {
    try {
      const response = await fetch('/api/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_application',
          applicationId
        })
      });

      if (response.ok) {
        toast({
          title: "Analysis Complete",
          description: "Application has been analyzed with ATS."
        });
        await fetchATSData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze application.",
        variant: "destructive"
      });
    }
  };

  const handleBulkAnalysis = async () => {
    try {
      const applicationIds = data?.applications
        .filter(app => !app.atsAnalysis)
        .map(app => app.id) || [];

      if (applicationIds.length === 0) {
        toast({
          title: "No Applications",
          description: "All applications have been analyzed.",
        });
        return;
      }

      const response = await fetch('/api/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_analyze',
          applicationIds,
          settings: {
            priority: 'high',
            enableComplianceChecking: true,
            enableBiasDetection: true
          }
        })
      });

      if (response.ok) {
        toast({
          title: "Bulk Analysis Started",
          description: `Analyzing ${applicationIds.length} applications.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start bulk analysis.",
        variant: "destructive"
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <p className="text-muted-foreground">No ATS data available.</p>
      </div>
    );
  }

  const scoreDistribution = [
    { range: '90-100', count: 12, percentage: 20 },
    { range: '80-89', count: 18, percentage: 30 },
    { range: '70-79', count: 15, percentage: 25 },
    { range: '60-69', count: 9, percentage: 15 },
    { range: '50-59', count: 4, percentage: 7 },
    { range: 'Below 50', count: 2, percentage: 3 }
  ];

  const complianceData = [
    { name: 'Compliant', value: 65, color: '#00C49F' },
    { name: 'Warning', value: 25, color: '#FFBB28' },
    { name: 'Non-Compliant', value: 10, color: '#FF8042' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ATS Dashboard</h2>
          <p className="text-muted-foreground">
            Applicant Tracking System insights and analytics
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
          <Button onClick={handleBulkAnalysis}>
            <Target className="h-4 w-4 mr-2" />
            Bulk Analyze
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.recentApplications} in last {timeframe}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(data.overview.averageScore)}`}>
              {data.overview.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.trends.scoreImprovement > 0 ? '+' : ''}{data.trends.scoreImprovement}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(data.overview.complianceRate)}`}>
              {data.overview.complianceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.trends.complianceImprovement > 0 ? '+' : ''}{data.trends.complianceImprovement}% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {data.jobBreakdown.length} positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Application score ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Compliance check results</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Job Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Job Performance</CardTitle>
              <CardDescription>Application metrics by job posting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.jobBreakdown.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.applicationCount} applications
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getScoreColor(job.averageScore)}`}>
                          {job.averageScore}% avg
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getScoreColor(job.complianceRate)}`}>
                          {job.complianceRate}% compliant
                        </div>
                        <div className="text-xs text-muted-foreground">Compliance</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Detailed ATS analysis for each application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{application.name}</h4>
                        <p className="text-sm text-muted-foreground">{application.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{application.status}</Badge>
                        {!application.atsAnalysis && (
                          <Button
                            size="sm"
                            onClick={() => handleAnalyzeApplication(application.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Analyze
                          </Button>
                        )}
                      </div>
                    </div>

                    {application.atsAnalysis && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <div className={`text-lg font-bold ${getScoreColor(application.atsAnalysis.overallScore)}`}>
                            {application.atsAnalysis.overallScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">Overall Score</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {application.atsAnalysis.skillsMatch}%
                          </div>
                          <div className="text-xs text-muted-foreground">Skills Match</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {application.atsAnalysis.experienceMatch}%
                          </div>
                          <div className="text-xs text-muted-foreground">Experience</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {application.atsAnalysis.confidence}%
                          </div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                        </div>
                      </div>
                    )}

                    {application.atsCompliance && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Badge className={getComplianceColor(application.atsCompliance.status)}>
                          {application.atsCompliance.status}
                        </Badge>
                        <Badge className={getRiskColor(application.atsCompliance.riskLevel)}>
                          {application.atsCompliance.riskLevel} risk
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>ATS metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={[
                      { name: 'Week 1', score: 72, compliance: 85 },
                      { name: 'Week 2', score: 75, compliance: 88 },
                      { name: 'Week 3', score: 78, compliance: 87 },
                      { name: 'Week 4', score: 82, compliance: 91 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" name="Avg Score" />
                    <Line type="monotone" dataKey="compliance" stroke="#82ca9d" name="Compliance %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Important ATS indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Processing Time</span>
                  <span className="font-medium">2.3s avg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Accuracy Rate</span>
                  <span className="font-medium">94.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bias Detection Rate</span>
                  <span className="font-medium">1.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>User Satisfaction</span>
                  <span className="font-medium">4.6/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Compliance Monitoring</AlertTitle>
            <AlertDescription>
              Automated compliance checks ensure your job postings meet legal requirements.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Issues</CardTitle>
                <CardDescription>Detected compliance concerns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Age Discrimination</span>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Found age-specific language in 2 job postings
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Gender Bias</span>
                    <Badge variant="secondary">Medium Risk</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gendered terms detected in descriptions
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Remediation Actions</CardTitle>
                <CardDescription>Recommended fixes for compliance issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border rounded-lg">
                  <h5 className="font-medium text-yellow-800">Priority: High</h5>
                  <p className="text-sm text-yellow-700 mt-1">
                    Remove age requirements from job postings
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border rounded-lg">
                  <h5 className="font-medium text-blue-800">Priority: Medium</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    Use gender-neutral language throughout
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}