import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NetworkingAssistantAgent } from '@/services/agents/networking/networking-assistant-agent';
import { LLMService } from '@/services/agents/llm/llm-service';
import { SessionManager } from '@/services/agents/orchestration/session-manager';
import { ContextManager } from '@/services/agents/orchestration/context-manager';
import {
  AgentType,
  NetworkingRequest,
  NetworkingResponse,
  AgentRequest,
  AgentResponse
} from '@/types/agents';

// Mock dependencies
jest.mock('@/services/agents/llm/llm-service');
jest.mock('@/services/agents/orchestration/session-manager');
jest.mock('@/services/agents/orchestration/context-manager');

describe('NetworkingAssistantAgent Integration Tests', () => {
  let networkingAgent: NetworkingAssistantAgent;
  let mockLLMService: jest.Mocked<LLMService>;
  let mockSessionManager: jest.Mocked<SessionManager>;
  let mockContextManager: jest.Mocked<ContextManager>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockLLMService = new LLMService({} as any) as jest.Mocked<LLMService>;
    mockSessionManager = new SessionManager({} as any) as jest.Mocked<SessionManager>;
    mockContextManager = new ContextManager({} as any) as jest.Mocked<ContextManager>;

    // Create networking agent instance
    networkingAgent = new NetworkingAssistantAgent(
      mockLLMService,
      mockSessionManager,
      mockContextManager
    );

    // Setup default mock responses
    setupDefaultMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Agent Configuration', () => {
    it('should have correct agent type', () => {
      expect(networkingAgent.getAgentType()).toBe(AgentType.NETWORKING_ASSISTANT);
    });

    it('should have appropriate capabilities', () => {
      const capabilities = networkingAgent.getCapabilities();

      expect(capabilities.supportedIntents).toContain('networking_assistance');
      expect(capabilities.supportedIntents).toContain('connection_recommendations');
      expect(capabilities.features).toContain('strategy_generation');
      expect(capabilities.features).toContain('outreach_messaging');
      expect(capabilities.features).toContain('event_analysis');
    });

    it('should be healthy when initialized', async () => {
      const health = await networkingAgent.getHealthStatus();
      expect(health.status).toBe('active');
    });
  });

  describe('Strategy Generation', () => {
    it('should generate comprehensive networking strategy', async () => {
      const request: AgentRequest = {
        message: 'Generate a networking strategy for my career transition',
        context: {},
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      // Mock LLM service response
      mockLLMService.generateCompletion.mockResolvedValue({
        content: JSON.stringify([
          {
            category: 'Online Presence',
            items: ['Optimize LinkedIn profile', 'Share industry content', 'Engage with discussions']
          }
        ]),
        usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 },
        model: 'gpt-4',
        finishReason: 'stop'
      });

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.suggestions).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.confidence).toBeGreaterThan(0.8);
    });

    it('should personalize strategy based on user profile', async () => {
      const userProfile = {
        industry: 'Technology',
        experienceLevel: 'senior',
        careerGoals: ['leadership', 'thought_leadership'],
        currentNetwork: [],
        skills: ['JavaScript', 'React', 'Team Leadership']
      };

      const request: AgentRequest = {
        message: 'Create networking strategy for senior tech leader',
        context: { profile: userProfile },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      // Mock context manager to return user profile
      mockContextManager.getUserContext.mockResolvedValue({
        profile: userProfile
      });

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(mockContextManager.getUserContext).toHaveBeenCalledWith('test-user-456');
    });

    it('should handle strategy generation errors gracefully', async () => {
      const request: AgentRequest = {
        message: 'Generate strategy',
        context: {},
        sessionId: 'invalid-session',
        userId: 'test-user-456',
        messageType: 'text'
      };

      // Mock context manager to throw error
      mockContextManager.getUserContext.mockRejectedValue(new Error('User not found'));

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('Outreach Message Generation', () => {
    it('should generate personalized outreach messages', async () => {
      const contactProfile = {
        name: 'John Doe',
        company: 'Tech Corp',
        role: 'Senior Engineer',
        industry: 'Technology',
        interests: ['Machine Learning', 'Cloud Computing']
      };

      const request: AgentRequest = {
        message: 'Generate outreach message for John Doe at Tech Corp',
        context: {
          contact: contactProfile,
          purpose: 'networking',
          tone: 'professional',
          platform: 'linkedin'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toContain('Hi John');
      expect(response.suggestions).toBeDefined();
      expect(response.actions).toBeDefined();
    });

    it('should generate appropriate follow-up messages', async () => {
      const originalMessage = {
        content: 'Hi John, I noticed we both work in tech...',
        platform: 'linkedin',
        tone: 'professional'
      };

      const contact = {
        name: 'John Doe',
        company: 'Tech Corp'
      };

      // Test follow-up generation
      const response = await networkingAgent.processRequest({
        message: 'Generate follow-ups for my message to John',
        context: {
          originalMessage,
          contact,
          action: 'generate_followups'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      });

      expect(response.success).toBe(true);
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });

    it('should optimize messages for different platforms', async () => {
      const platforms = ['linkedin', 'twitter', 'email'];

      for (const platform of platforms) {
        const request: AgentRequest = {
          message: `Generate message for ${platform}`,
          context: {
            contact: { name: 'Jane Smith' },
            purpose: 'networking',
            platform
          },
          sessionId: 'test-session-123',
          userId: 'test-user-456',
          messageType: 'text'
        };

        const response = await networkingAgent.processRequest(request);

        expect(response.success).toBe(true);

        // Platform-specific validation
        if (platform === 'twitter') {
          expect(response.content.length).toBeLessThanOrEqual(280);
        }
        if (platform === 'email') {
          expect(response.actions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: 'send_email'
              })
            ])
          );
        }
      }
    });
  });

  describe('Network Analysis and Tracking', () => {
    it('should analyze networking activities', async () => {
      const activities = [
        {
          type: 'connection_request',
          date: '2024-01-15',
          platform: 'linkedin',
          success: true,
          response: true
        },
        {
          type: 'event_attendance',
          date: '2024-01-20',
          platform: 'in-person',
          success: true,
          newConnections: 5
        }
      ];

      const request: AgentRequest = {
        message: 'Analyze my networking activities',
        context: {
          activities,
          timeframe: '30d',
          action: 'track_networking'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should generate networking insights', async () => {
      const analysis = {
        totalActivities: 25,
        weeklyAverage: 6.25,
        platformDiversity: 3,
        engagementRate: 0.75,
        responseRate: 0.60,
        followUpRate: 0.40
      };

      const request: AgentRequest = {
        message: 'Generate insights from my networking data',
        context: {
          analysis,
          action: 'generate_insights'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });

    it('should track progress towards networking goals', async () => {
      const goals = [
        {
          id: '1',
          title: 'Expand Professional Network',
          target: 50,
          timeframe: '6m',
          category: 'growth'
        }
      ];

      const currentProgress = {
        newConnections: 15,
        opportunitiesGenerated: 2,
        eventsAttended: 1
      };

      const request: AgentRequest = {
        message: 'Track my networking goal progress',
        context: {
          goals,
          progress: currentProgress,
          action: 'track_goals'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toContain('30%'); // 15 out of 50 connections
    });
  });

  describe('Event Analysis', () => {
    it('should find and analyze networking events', async () => {
      const eventParams = {
        location: 'San Francisco',
        industry: 'Technology',
        interests: ['AI', 'Startups'],
        timeframe: '90d',
        eventTypes: ['virtual', 'in-person'],
        careerLevel: 'senior'
      };

      const request: AgentRequest = {
        message: 'Find networking events in San Francisco tech scene',
        context: {
          ...eventParams,
          action: 'analyze_events'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.suggestions).toBeDefined();
    });

    it('should rank events by relevance', async () => {
      const events = [
        {
          id: '1',
          title: 'Tech Conference',
          relevanceScore: 0.9,
          networkingValue: 'high'
        },
        {
          id: '2',
          title: 'Local Meetup',
          relevanceScore: 0.7,
          networkingValue: 'medium'
        }
      ];

      const userProfile = {
        industry: 'Technology',
        interests: ['AI', 'Cloud Computing']
      };

      const request: AgentRequest = {
        message: 'Rank these events by relevance',
        context: {
          events,
          profile: userProfile,
          action: 'rank_events'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      mockContextManager.getUserContext.mockResolvedValue({ profile: userProfile });

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toContain('Tech Conference'); // Higher relevance first
    });

    it('should provide event preparation guidance', async () => {
      const topEvents = [
        {
          id: '1',
          title: 'Tech Summit 2024',
          type: 'in-person',
          attendees: 200,
          tags: ['technology', 'innovation']
        }
      ];

      const userProfile = {
        role: 'Software Engineer',
        goals: ['career_growth', 'network_expansion']
      };

      const request: AgentRequest = {
        message: 'Help me prepare for Tech Summit 2024',
        context: {
          events: topEvents,
          profile: userProfile,
          action: 'preparation_guide'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toContain('research');
      expect(response.suggestions).toBeDefined();
      expect(response.actions).toBeDefined();
    });
  });

  describe('Contact Management', () => {
    it('should add new networking contacts', async () => {
      const contactData = {
        name: 'Alice Johnson',
        email: 'alice@techcorp.com',
        company: 'Tech Corp',
        role: 'Product Manager',
        industry: 'Technology',
        source: 'LinkedIn',
        tags: ['product', 'tech', 'leadership']
      };

      const request: AgentRequest = {
        message: 'Add Alice Johnson to my network',
        context: {
          action: 'add_contact',
          contactData
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toContain('added successfully');
    });

    it('should analyze network composition', async () => {
      const request: AgentRequest = {
        message: 'Analyze my professional network',
        context: {
          action: 'analyze_network'
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it('should suggest potential connections', async () => {
      const request: AgentRequest = {
        message: 'Suggest people I should connect with',
        context: {
          action: 'suggest_contacts',
          criteria: {
            industry: 'Technology',
            role: 'Engineering Manager',
            location: 'San Francisco'
          }
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      const request: AgentRequest = {
        message: '',
        context: {},
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle LLM service failures', async () => {
      const request: AgentRequest = {
        message: 'Generate networking strategy',
        context: {},
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      // Mock LLM service to throw error
      mockLLMService.generateCompletion.mockRejectedValue(new Error('LLM service unavailable'));

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('LLM service');
    });

    it('should handle session management failures', async () => {
      const request: AgentRequest = {
        message: 'Generate strategy',
        context: {},
        sessionId: 'invalid-session',
        userId: 'test-user-456',
        messageType: 'text'
      };

      // Mock session manager to throw error
      mockSessionManager.getSession.mockRejectedValue(new Error('Session not found'));

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('Performance and Scaling', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        message: `Generate strategy ${i}`,
        context: {},
        sessionId: `session-${i}`,
        userId: 'test-user-456',
        messageType: 'text' as const
      }));

      // Mock LLM service to respond quickly
      mockLLMService.generateCompletion.mockResolvedValue({
        content: 'Strategy generated successfully',
        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
        model: 'gpt-4',
        finishReason: 'stop'
      });

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => networkingAgent.processRequest(req))
      );
      const endTime = Date.now();

      expect(responses).toHaveLength(10);
      expect(responses.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain response quality under load', async () => {
      const heavyRequest: AgentRequest = {
        message: 'Generate comprehensive networking strategy with detailed analysis',
        context: {
          detailedAnalysis: true,
          includeMetrics: true,
          timeframe: '12m',
          goals: ['career_growth', 'network_expansion', 'thought_leadership']
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(heavyRequest);

      expect(response.success).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.metadata.confidence).toBeGreaterThan(0.7);
      expect(response.metadata.processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Integration with Other Services', () => {
    it('should integrate with session management', async () => {
      const request: AgentRequest = {
        message: 'Generate strategy',
        context: {},
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      await networkingAgent.processRequest(request);

      expect(mockSessionManager.getSession).toHaveBeenCalledWith('test-session-123');
    });

    it('should integrate with context management', async () => {
      const request: AgentRequest = {
        message: 'Generate personalized strategy',
        context: {},
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      await networkingAgent.processRequest(request);

      expect(mockContextManager.getUserContext).toHaveBeenCalledWith('test-user-456');
    });

    it('should update context with networking insights', async () => {
      const request: AgentRequest = {
        message: 'Generate networking insights',
        context: {},
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      if (response.metadata?.contextUpdate) {
        expect(mockContextManager.updateUserContext).toHaveBeenCalledWith(
          'test-user-456',
          response.metadata.contextUpdate
        );
      }
    });
  });

  describe('Data Privacy and Security', () => {
    it('should handle sensitive contact information securely', async () => {
      const sensitiveContact = {
        name: 'John Doe',
        email: 'john@company.com',
        phone: '+1-555-0123',
        personalNotes: 'Met at conference, interested in AI'
      };

      const request: AgentRequest = {
        message: 'Add contact with sensitive information',
        context: {
          action: 'add_contact',
          contactData: sensitiveContact
        },
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      // Ensure sensitive information is not exposed in response
      expect(response.content).not.toContain('+1-555-0123');
    });

    it('should respect user privacy preferences', async () => {
      const userPreferences = {
        privacy: {
          shareAnalytics: false,
          allowContactSharing: false,
          dataRetention: '90d'
        }
      };

      mockContextManager.getUserPreferences.mockResolvedValue(userPreferences);

      const request: AgentRequest = {
        message: 'Analyze my network',
        context: {},
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        messageType: 'text'
      };

      const response = await networkingAgent.processRequest(request);

      expect(response.success).toBe(true);
      expect(mockContextManager.getUserPreferences).toHaveBeenCalledWith('test-user-456');
    });
  });

  function setupDefaultMocks(): void {
    // Mock LLM service default response
    mockLLMService.generateCompletion.mockResolvedValue({
      content: 'Networking strategy generated successfully',
      usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 },
      model: 'gpt-4',
      finishReason: 'stop'
    });

    // Mock session manager default response
    mockSessionManager.getSession.mockResolvedValue({
      sessionId: 'test-session-123',
      userId: 'test-user-456',
      context: {},
      lastActivity: new Date(),
      isActive: true
    });

    // Mock context manager default response
    mockContextManager.getUserContext.mockResolvedValue({
      profile: {
        industry: 'Technology',
        experienceLevel: 'senior',
        careerGoals: ['leadership'],
        currentNetwork: []
      }
    });

    mockContextManager.getUserPreferences.mockResolvedValue({
      agentPreferences: {
        [AgentType.NETWORKING_ASSISTANT]: {
          enabled: true,
          personality: 'professional',
          responseStyle: 'comprehensive'
        }
      }
    });
  }
});