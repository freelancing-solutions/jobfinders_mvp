import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

import { MLMatchingEngine } from '@/lib/services/matching/MLMatchingEngine';
import { MatchingAnalyticsDashboard } from '../MatchingAnalyticsDashboard/MatchingAnalyticsDashboard';
import { MatchingInsights } from '../MatchingInsights/MatchingInsights';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />
}));

// Mock data
const mockAnalyticsData = {
  overview: {
    totalMatches: 1247,
    activeMatches: 892,
    newMatches: 45,
    averageScore: 78.5,
    matchRate: 68.2,
    responseRate: 42.3,
    conversionRate: 12.8
  },
  performanceMetrics: {
    accuracyScore: 87.3,
    responseTime: 1.2,
    satisfactionScore: 4.6,
    retentionRate: 73.4,
    improvementRate: 15.2
  },
  skillsGapAnalysis: [
    { skill: 'React', demand: 89, supply: 67, gap: 22 },
    { skill: 'TypeScript', demand: 76, supply: 54, gap: 22 },
    { skill: 'Node.js', demand: 82, supply: 71, gap: 11 }
  ],
  marketTrends: [
    { date: '2024-01', matches: 120, applications: 45, hires: 8 },
    { date: '2024-02', matches: 135, applications: 52, hires: 12 },
    { date: '2024-03', matches: 142, applications: 58, hires: 15 }
  ]
};

const mockMatchData = {
  matchScore: 85,
  confidence: 92,
  factors: [
    {
      name: 'Skills Alignment',
      score: 0.9,
      weight: 0.35,
      details: 'Strong match in core technical skills including React, TypeScript, and Node.js'
    },
    {
      name: 'Experience Relevance',
      score: 0.8,
      weight: 0.25,
      details: '5 years of relevant experience in similar roles'
    },
    {
      name: 'Education Match',
      score: 0.7,
      weight: 0.15,
      details: 'Bachelor\'s degree in Computer Science'
    },
    {
      name: 'Location & Work Style',
      score: 1.0,
      weight: 0.15,
      details: 'Perfect location match with remote work options'
    },
    {
      name: 'Salary Alignment',
      score: 0.8,
      weight: 0.10,
      details: 'Salary expectations well within range'
    }
  ],
  insights: [
    {
      type: 'strength' as const,
      title: 'Strong Technical Foundation',
      description: 'Your technical skills align perfectly with the job requirements',
      actionable: false
    },
    {
      type: 'recommendation' as const,
      title: 'Highlight Recent Projects',
      description: 'Consider emphasizing your recent React projects in your application',
      actionable: true
    }
  ],
  recommendations: [
    'Update your resume to highlight React experience',
    'Add specific metrics from previous roles',
    'Consider obtaining a cloud certification'
  ]
};

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('MLMatchingEngine', () => {
  let engine: MLMatchingEngine;

  beforeEach(() => {
    engine = MLMatchingEngine.getInstance();
  });

  describe('calculateMatchScore', () => {
    it('should calculate match score for valid inputs', async () => {
      const candidate = {
        skills: ['React', 'TypeScript', 'Node.js'],
        experience: [{ title: 'Senior Developer', description: 'Full-stack development', duration: 60, current: true }],
        education: [{ degree: 'Bachelor of Science', field: 'Computer Science', school: 'University' }],
        location: 'San Francisco, CA',
        title: 'Senior Full Stack Developer',
        preferredLocations: ['San Francisco', 'Remote'],
        jobTypes: ['FULL_TIME', 'REMOTE'],
        availability: 'IMMEDIATE'
      };

      const job = {
        title: 'Senior React Developer',
        description: 'Senior React developer position',
        requirements: '5+ years of experience with React',
        requiredSkills: ['React', 'TypeScript', 'JavaScript'],
        location: 'San Francisco, CA',
        type: 'FULL_TIME',
        experienceLevel: 'SENIOR',
        salaryMin: 120000,
        salaryMax: 180000
      };

      const result = await engine.calculateMatchScore(candidate, job);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('insights');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle missing job skills gracefully', async () => {
      const candidate = {
        skills: ['React', 'TypeScript'],
        experience: [],
        education: [],
        location: 'Remote',
        title: 'Developer',
        preferredLocations: [],
        jobTypes: [],
        availability: 'IMMEDIATE'
      };

      const job = {
        title: 'Developer',
        description: 'Developer position',
        requirements: 'Basic development skills',
        requiredSkills: [],
        location: 'Remote',
        type: 'FULL_TIME',
        experienceLevel: 'ENTRY'
      };

      const result = await engine.calculateMatchScore(candidate, job);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should calculate skills similarity correctly', async () => {
      const candidateSkills = ['JavaScript', 'React', 'Node.js'];
      const jobSkills = ['JavaScript', 'TypeScript', 'React'];

      const result = await engine.calculateMatchScore(
        { ...mockMatchData, skills: candidateSkills } as any,
        { requiredSkills: jobSkills } as any
      );

      const skillsFactor = result.factors.find(f => f.name === 'Skills Alignment');
      expect(skillsFactor).toBeDefined();
      expect(skillsFactor!.score).toBeGreaterThan(0.5); // Should have good skills match
    });
  });

  describe('getModelMetrics', () => {
    it('should return model performance metrics', async () => {
      const metrics = await engine.getModelMetrics();

      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('precision');
      expect(metrics).toHaveProperty('recall');
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
    });
  });
});

describe('MatchingAnalyticsDashboard', () => {
  it('should render analytics overview correctly', () => {
    renderWithQueryClient(
      <MatchingAnalyticsDashboard
        userType="seeker"
        timeframe="30d"
        data={mockAnalyticsData}
      />
    );

    expect(screen.getByText('1247')).toBeInTheDocument(); // totalMatches
    expect(screen.getByText('892')).toBeInTheDocument(); // activeMatches
    expect(screen.getByText('78.5%')).toBeInTheDocument(); // averageScore
  });

  it('should handle timeframe changes', () => {
    renderWithQueryClient(
      <MatchingAnalyticsDashboard
        userType="seeker"
        timeframe="30d"
        data={mockAnalyticsData}
      />
    );

    const timeframeButtons = screen.getAllByRole('button');
    const day7Button = timeframeButtons.find(button => button.textContent === '7D');
    const day30Button = timeframeButtons.find(button => button.textContent === '30D');

    expect(day30Button).toHaveClass('bg-primary'); // Should be active
    expect(day7Button).not.toHaveClass('bg-primary');

    if (day7Button) {
      fireEvent.click(day7Button);
      // In a real implementation, this would trigger a data refresh
    }
  });

  it('should display performance metrics', () => {
    renderWithQueryClient(
      <MatchingAnalyticsDashboard
        userType="seeker"
        timeframe="30d"
        data={mockAnalyticsData}
      />
    );

    expect(screen.getByText('87.3%')).toBeInTheDocument(); // accuracyScore
    expect(screen.getByText('1.2s')).toBeInTheDocument(); // responseTime
    expect(screen.getByText('4.6/5')).toBeInTheDocument(); // satisfactionScore
  });

  it('should render charts correctly', () => {
    renderWithQueryClient(
      <MatchingAnalyticsDashboard
        userType="seeker"
        timeframe="30d"
        data={mockAnalyticsData}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});

describe('MatchingInsights', () => {
  it('should display match score and confidence', () => {
    renderWithQueryClient(
      <MatchingInsights {...mockMatchData} />
    );

    expect(screen.getByText('85%')).toBeInTheDocument(); // matchScore
    expect(screen.getByText('High')).toBeInTheDocument(); // confidence level
  });

  it('should show factor analysis', () => {
    renderWithQueryClient(
      <MatchingInsights {...mockMatchData} />
    );

    expect(screen.getByText('Skills Alignment')).toBeInTheDocument();
    expect(screen.getByText('Experience Relevance')).toBeInTheDocument();
    expect(screen.getByText('Education Match')).toBeInTheDocument();
  });

  it('should display insights correctly', () => {
    renderWithQueryClient(
      <MatchingInsights {...mockMatchData} />
    );

    expect(screen.getByText('Strong Technical Foundation')).toBeInTheDocument();
    expect(screen.getByText('Highlight Recent Projects')).toBeInTheDocument();
  });

  it('should show recommendations', () => {
    renderWithQueryClient(
      <MatchingInsights {...mockMatchData} />
    );

    expect(screen.getByText('Update your resume to highlight React experience')).toBeInTheDocument();
    expect(screen.getByText('Add specific metrics from previous roles')).toBeInTheDocument();
  });

  it('should handle applying recommendations', async () => {
    const mockApplyRecommendation = jest.fn();

    renderWithQueryClient(
      <MatchingInsights
        {...mockMatchData}
        onApplyRecommendation={mockApplyRecommendation}
      />
    );

    const applyButtons = screen.getAllByText('Apply');
    fireEvent.click(applyButtons[0]);

    await waitFor(() => {
      expect(mockApplyRecommendation).toHaveBeenCalledWith(
        'Update your resume to highlight React experience'
      );
    });
  });

  it('should switch between tabs correctly', () => {
    renderWithQueryClient(
      <MatchingInsights {...mockMatchData} />
    );

    // Should start with overview tab
    expect(screen.getByText('Match Overview')).toBeInTheDocument();

    // Click on factors tab
    const factorsTab = screen.getByText('Factors');
    fireEvent.click(factorsTab);
    expect(screen.getByText('Detailed Factor Analysis')).toBeInTheDocument();

    // Click on insights tab
    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);
    expect(screen.getByText('Improvement Recommendations')).toBeInTheDocument();

    // Click on recommendations tab
    const recommendationsTab = screen.getByText('Actions');
    fireEvent.click(recommendationsTab);
    expect(screen.getByText('Actionable suggestions')).toBeInTheDocument();
  });

  it('should display different score levels with appropriate colors', () => {
    const highScoreData = { ...mockMatchData, matchScore: 95 };
    const mediumScoreData = { ...mockMatchData, matchScore: 70 };
    const lowScoreData = { ...mockMatchData, matchScore: 45 };

    const { rerender } = renderWithQueryClient(
      <MatchingInsights {...highScoreData} />
    );
    expect(screen.getByText('95%')).toHaveClass('text-green-600');

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MatchingInsights {...mediumScoreData} />
      </QueryClientProvider>
    );
    expect(screen.getByText('70%')).toHaveClass('text-yellow-600');

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MatchingInsights {...lowScoreData} />
      </QueryClientProvider>
    );
    expect(screen.getByText('45%')).toHaveClass('text-red-600');
  });

  it('should handle empty recommendations gracefully', () => {
    const emptyRecommendationsData = {
      ...mockMatchData,
      recommendations: []
    };

    renderWithQueryClient(
      <MatchingInsights {...emptyRecommendationsData} />
    );

    expect(screen.getByText('Great job! Your profile is well-optimized for this position.')).toBeInTheDocument();
  });

  it('should handle empty insights gracefully', () => {
    const emptyInsightsData = {
      ...mockMatchData,
      insights: []
    };

    renderWithQueryClient(
      <MatchingInsights {...emptyInsightsData} />
    );

    expect(screen.getByText('No specific insights available for this match.')).toBeInTheDocument();
  });
});

// Integration tests
describe('Matching System Integration', () => {
  it('should process a complete matching workflow', async () => {
    const engine = MLMatchingEngine.getInstance();

    const candidate = {
      skills: ['React', 'TypeScript', 'Node.js', 'Python'],
      experience: [
        {
          title: 'Senior Full Stack Developer',
          description: 'Led development of microservices architecture using React and Node.js',
          duration: 48,
          current: true
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          school: 'Stanford University'
        }
      ],
      location: 'San Francisco, CA',
      title: 'Senior Full Stack Developer',
      preferredLocations: ['San Francisco', 'Remote'],
      jobTypes: ['FULL_TIME', 'REMOTE'],
      availability: 'IMMEDIATE'
    };

    const job = {
      title: 'Senior React Developer',
      description: 'We are looking for a Senior React Developer to join our team. You will work on building modern web applications using React, TypeScript, and Node.js.',
      requirements: '5+ years of experience with React and TypeScript. Experience with Node.js and microservices architecture.',
      requiredSkills: ['React', 'TypeScript', 'Node.js', 'Git'],
      location: 'San Francisco, CA',
      type: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      salaryMin: 140000,
      salaryMax: 200000,
      industry: 'Technology',
      companySize: 'MEDIUM'
    };

    const result = await engine.calculateMatchScore(candidate, job);

    // Verify the result structure
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('factors');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('insights');

    // Verify reasonable scores
    expect(result.score).toBeGreaterThan(50); // Should be a good match
    expect(result.confidence).toBeGreaterThan(60); // Should have reasonable confidence

    // Verify factor scores are reasonable
    result.factors.forEach(factor => {
      expect(factor.score).toBeGreaterThanOrEqual(0);
      expect(factor.score).toBeLessThanOrEqual(1);
      expect(factor.weight).toBeGreaterThanOrEqual(0);
      expect(factor.weight).toBeLessThanOrEqual(1);
    });

    // Verify insights are provided
    expect(result.insights.length).toBeGreaterThan(0);
    result.insights.forEach(insight => {
      expect(insight).toHaveProperty('type');
      expect(insight).toHaveProperty('title');
      expect(insight).toHaveProperty('description');
      expect(['strength', 'weakness', 'recommendation']).toContain(insight.type);
    });
  });

  it('should handle edge cases gracefully', async () => {
    const engine = MLMatchingEngine.getInstance();

    // Test with minimal data
    const minimalCandidate = {
      skills: [],
      experience: [],
      education: [],
      location: '',
      title: '',
      preferredLocations: [],
      jobTypes: [],
      availability: 'IMMEDIATE'
    };

    const minimalJob = {
      title: '',
      description: '',
      requirements: '',
      requiredSkills: [],
      location: '',
      type: 'FULL_TIME',
      experienceLevel: 'ENTRY'
    };

    const result = await engine.calculateMatchScore(minimalCandidate, minimalJob);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.factors).toBeDefined();
  });
});