import { AgentRouter } from '@/services/agents/orchestration/agent-router';
import { SessionManager } from '@/services/agents/orchestration/session-manager';
import { ContextManager } from '@/services/agents/orchestration/context-manager';
import { LLMService } from '@/services/agents/llm/llm-service';
import { AgentType } from '@/types/agents';
import { CareerGuidanceAgent } from '@/services/agents/career/career-guidance-agent';
import { InterviewPreparationAgent } from '@/services/agents/interview/interview-prep-agent';
import { ApplicationAssistantAgent } from '@/services/agents/application/application-assistant-agent';
import { EmployerAssistantAgent } from '@/services/agents/employer/employer-assistant-agent';

describe('AI Agents Integration Tests', () => {
  let agentRouter: AgentRouter;
  let sessionManager: SessionManager;
  let contextManager: ContextManager;
  let llmService: LLMService;
  let agents: Map<AgentType, any>;

  beforeAll(async () => {
    // Initialize services
    sessionManager = new SessionManager();
    contextManager = new ContextManager();
    llmService = new LLMService();
    agentRouter = new AgentRouter(sessionManager, contextManager);

    // Initialize agents
    agents = new Map<AgentType, any>();
    agents.set(AgentType.CAREER_GUIDANCE, new CareerGuidanceAgent(
      {
        agentId: 'career-guidance-agent',
        agentType: AgentType.CVERAGE_GUIDANCE,
        name: 'Career Guidance Agent',
        description: 'Provides personalized career advice and planning assistance',
        capabilities: {
          supportedIntents: ['career_guidance', 'skill_analysis', 'market_intelligence'],
          primaryIntents: ['career_guidance'],
          maxConcurrency: 10,
          averageResponseTime: 2000,
          supportedLanguages: ['en'],
          supportsVoice: true,
          supportsFileUpload: true,
          features: ['career_path_analysis', 'skill_gap_identification', 'market_trends']
        },
        modelConfig: {
          primaryModel: 'gpt-4',
          fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: 'You are a Career Guidance Agent, an expert career counselor and coach.',
          responseFormat: 'text',
          tools: []
        },
        behaviorSettings: {
          personality: 'professional',
          responseStyle: 'detailed',
          proactivity: 'moderate',
          followUpEnabled: true,
          suggestionEnabled: true,
          learningEnabled: true
        },
        integrations: ['linkedin', 'github', 'learning_platforms'],
        version: '1.0.0',
        isActive: true
      },
      llmService
    );

    agents.set(AgentType.INTERVIEW_PREPARATION, new InterviewPreparationAgent(
      {
        agentId: 'interview-prep-agent',
        agentType: AgentType.INTERVIEW_PREPARATION,
        name: 'Interview Preparation Agent',
        description: 'Helps users prepare for interviews through practice sessions and optimization',
        capabilities: {
          supportedIntents: ['mock_interview', 'interview_preparation'],
          primaryIntents: ['mock_interview'],
          maxConcurrency: 5,
          averageResponseTime: 3000,
          supportedLanguages: ['en'],
          supportsVoice: true,
          supportsFileUpload: true,
          features: ['mock_interviews', 'answer_optimization', 'speech_analysis']
        },
        modelConfig: {
          primaryModel: 'gpt-4',
          fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
          temperature: 0.6,
          maxTokens: 1500,
          systemPrompt: 'You are an Interview Preparation Agent, an expert interview coach and trainer.',
          responseFormat: 'text',
          tools: []
        },
        behaviorSettings: {
          personality: 'friendly',
          responseStyle: 'comprehensive',
          proactivity: 'proactive',
          followUpEnabled: true,
          suggestionEnabled: true,
          learningEnabled: true
        },
        integrations: ['speech_to_text', 'text_to_speech', 'calendar'],
        version: '1.0.0',
        isActive: true
      },
      llmService
    );

    agents.set(AgentType.APPLICATION_ASSISTANT, new ApplicationAssistantAgent(
      {
        agentId: 'application-assistant-agent',
        agentType: AgentType.APPLICATION_ASSISTANT,
        name: 'Application Assistant Agent',
        description: 'Assists with job application optimization and tracking',
        capabilities: {
          supportedIntents: ['application_optimization', 'application_tracking', 'application_assistance'],
          primaryIntents: ['application_optimization'],
          maxConcurrency: 8,
          averageResponseTime: 2500,
          supportedLanguages: ['en'],
          supportsVoice: false,
          supportsFileUpload: true,
          features: ['resume_optimization', 'ats_optimization', 'application_tracking']
        },
        modelConfig: {
          primaryModel: 'gpt-4',
          fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
          temperature: 0.5,
          maxTokens: 2500,
          systemPrompt: 'You are an Application Assistant Agent, an expert in job applications and ATS optimization.',
          responseFormat: 'text',
          tools: []
        },
        behaviorSettings: {
          personality: 'professional',
          responseStyle: 'detailed',
          proactivity: 'moderate',
          followUpEnabled: true,
          suggestionEnabled: true,
          learningEnabled: false
        },
        integrations: ['resume_parser', 'ats_systems', 'job_boards'],
        version: '1.0.0',
        isActive: true
      },
      llmService
    ));

    agents.set(AgentType.EMPLOYER_ASSISTANT, new EmployerAssistantAgent(
      {
        agentId: 'employer-assistant-agent',
        agentType: AgentType.EMPLOYER_ASSISTANT,
        name: 'Employer Assistant Agent',
        description: 'Assists employers with candidate screening and hiring processes',
        capabilities: {
          supportedIntents: ['candidate_screening', 'job_posting_optimization', 'employer_assistance'],
          primaryIntents: ['candidate_screening'],
          maxConcurrency: 6,
          averageResponseTime: 2200,
          supportedLanguages: ['en'],
          supportsVoice: false,
          supportsFileUpload: true,
          features: ['resume_screening', 'candidate_ranking', 'bias_detection']
        },
        modelConfig: {
          primaryModel: 'gpt-4',
          fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
          temperature: 0.4,
          maxTokens: 2000,
          systemPrompt: 'You are an Employer Assistant Agent, an expert in recruitment and candidate evaluation.',
          responseFormat: 'text',
          tools: []
        },
        behaviorSettings: {
          personality: 'professional',
          responseStyle: 'concise',
          proactivity: 'reactive',
          followUpEnabled: false,
          suggestionEnabled: true,
          learningEnabled: true
        },
        integrations: ['resume_parser', 'job_boards', 'analytics'],
        version: '1.0.0',
        isActive: true
      },
      llmService
    ));

    // Register all agents with the router
    for (const [type, agent] of agents) {
      agentRouter.registerAgent(agent);
    }

    this.logger.info('AI agents initialized for integration testing');
  });

  afterAll(async () => {
    // Clean up
    await sessionManager.cleanup();
    await llmService.shutdown();
  });

  describe('Agent Router', () => {
    describe('agent selection and routing', () => {
      it('should route to career guidance agent for career-related queries', async () => {
        const request = {
          userId: 'user123',
          message: 'I need career advice for my software engineering career',
          context: {
            currentRole: 'Software Engineer',
            experience: '5 years',
            goals: ['Senior Developer']
          }
        };

        const response = await agentRouter.routeRequest(request);

        expect(response.agentType).toBe(AgentType.CAREER_GUIDANCE);
        expect(response.response).toContain('career advice');
      });

      it('should route to interview preparation agent for interview-related queries', async () => {
        const request = {
          userId: 'user123',
          message: 'I need help preparing for a technical interview',
          context: {
            targetRole: 'Senior Software Engineer',
            interviewType: 'technical',
            experience: '5 years'
          }
        };

        const response = await agentRouter.routeRequest(request);

        expect(response.agentType).toBe(AgentType.INTERVIEW_PREPARATION);
        expect(response.response).toContain('technical interview');
      });

      it('should route to application assistant for application-related queries', async () => {
        const request = {
          userId: 'user123',
          message: 'Help me optimize my resume for a job application',
          context: {
            targetRole: 'Software Engineer',
            jobId: 'job123'
          }
        };

        const response = await agentRouter.routeRequest(request);

        expect(response.agentType).toBe(AgentType.APPLICATION_ASSISTANT);
        expect(response.response).toContain('resume optimization');
      });

      it('should route to employer assistant for employer-related queries', async () => {
        const request = {
          userId: 'user123',
          message: 'I need help screening candidates for a software engineer position',
          context: {
            company: 'Tech Corp',
            position: 'Software Engineer',
            experience: '5 years'
          }
        };

        const response = await agentRouter.routeRequest(request);

        expect(response.agentType).toBe(AgentType.EMPLOYER_ASSISTANT);
        expect(response.response).toContain('candidate screening');
      });

      it('should get available agents for user', async () => {
        const userId = 'user123';
        const availableAgents = await agentRouter.getAvailableAgents(userId);

        expect(availableAgents).toContain(AgentType.CAREER_GUIDANCE);
        expect(availableAgents).toContain(AgentType.INTERVIEW_PREPARATION);
        expect(availableAgents).toContain(AgentType.APPLICATION_ASSISTANT);
        expect(availableAgents).toContain(AgentType.EMPLOYER_ASSISTANT);
      });
    });

    describe('Session Management', () => {
      describe('session creation and management', () => {
        it('should create a new agent session', async () => {
          const session = await sessionManager.createSession('user123', {
            agentType: AgentType.CAREER_GUIDANCE,
            initialMessage: 'I need career guidance'
          });

          expect(session.sessionId).toBeDefined();
          expect(session.status).toBe('active');
          expect(session.agentType).toBe(AgentType.CAREER_GUIDANCE);
        });

        it('should add messages to session history', async () => {
          const session = await sessionManager.createSession('user123', {
            agentType: AgentType.CAREER_GUIDANCE
          });

          await sessionManager.addMessage(
            session.sessionId,
            'user',
            'What are the most in-demand skills in tech?',
            {
              messageType: 'text',
              agentType: AgentType.CAREER_GUIDANCE
            }
          );

          const history = await sessionManager.getConversationHistory(session.sessionId);
          expect(history).toHaveLength(1);
          expect(history[0].role).toBe('user');
          expect(history[0].content).toBe('What are the most in-demand skills in tech?');
        });

        it('should pause and resume sessions', async () => {
          const session = await sessionManager.createSession('user123', {
            agentType: AgentType.CAREER_GUIDANCE
          });

          await sessionManager.pauseSession(session.sessionId);
          let pausedSession = await sessionManager.getSession(session.sessionId);
          expect(pausedSession.status).toBe('paused');

          await sessionManager.resumeSession(session.sessionId);
          let resumedSession = await sessionManager.getSession(session.sessionId);
          expect(resumedSession.status).toBe('active');
        });

        it('should complete sessions', async () => {
          const session = await sessionManager.createSession('user123', {
            agentType: AgentType.CAREER_GUIDANCE
          });

          await sessionManager.completeSession(session.sessionId);
          let completedSession = await sessionManager.getSession(session.sessionId);
          expect(completedSession.status).toBe('completed');
        });

        it('should delete sessions', async () => {
          const session = await sessionManager.createSession('user123', {
            agentType: AgentType.CAREER_GUIDANCE
          });

          const deleted = await sessionManager.deleteSession(session.sessionId);
          expect(deleted).toBe(true);

          const deletedSession = await sessionManager.getSession(session.sessionId);
          expect(deletedSession).toBeNull();
        });
      });

      describe('User Sessions', () => {
        it('should get all user sessions', async () => {
          // Create multiple sessions
          await sessionManager.createSession('user123', {
            agentType: AgentType.CAREER_GUIDANCE
          });

          await sessionManager.createSession('user123', {
            agentType: AgentType.INTERVIEW_PREPARATION
          });

          await sessionManager.createSession('user123', {
            agentType: AgentType.APPLICATION_ASSISTANT
          });

          const userSessions = await sessionManager.getUserSessions('user123');

          expect(userSessions).toHaveLength(3);
          expect(userSessions[0].agentType).toBe(AgentType.CAREER_GUIDANCE);
          expect(userSessions[1].agentType).toBe(AgenType.INTERVIEW_PREPARATION);
          expect(userSessions[2].agentType).toBe(AgentType.APPLICATION_ASSISTANT);
        });

        it('get user sessions should filter by active status', async () => {
          // Create active and completed sessions
          const activeSession1 = await sessionManager.createSession('user123', {
            agentType: AgentType.CAREER_GUIDANCE
          });
          const completedSession = await sessionManager.createSession('user123', {
            agentType: AgentType.INTERVIEW_PREPARATION
          });
          await sessionManager.completeSession(completedSession.sessionId);

          const activeSessions = await sessionManager.getUserSessions('user123');
          expect(activeSessions).toHaveLength(1);
          expect(activeSessions[0].agentType).toBe(AgentType.CAREER_GUIDANCE);
        });
      });
    });

    describe('Context Manager', () => {
      describe('context management and sharing', () => {
        it('should get user context', async () => {
          const userId = 'user123';
          const userContext = await contextManager.getUserContext(userId);

          expect(userContext).toBeDefined();
        });

        it('should update user context', async () => {
          const userId = 'user123';
          const updates = {
            careerGoals: ['Senior Developer'],
            targetSalary: { min: 130000, max: 180000 }
          };

          await contextManager.updateUserContext(userId, updates);
          const updatedContext = await contextManager.getUserContext(userId);

          expect(updatedContext.careerGoals).toEqual(['Senior Developer']);
          expect(updatedContext.targetSalary).toEqual({ min: 130000, max: 180000 });
        });

        it('should share context between agents', async () => {
          const userId = 'user123';
          const fromAgent = AgentType.CAREER_GUIDANCE;
          const toAgent = AgentType.INTERVIEW_PREPARATION;
          const contextData = { careerLevel: 'senior' };

          await contextManager.shareContext(fromAgent, toAgent, userId, contextData);

          const sharedContext = await contextManager.getSharedContext(fromAgent, toAgent, userId);
          expect(sharedContext).toEqual(contextData);
        });
      });
    });

    describe('LLM Integration', () => {
      describe('multi-provider support', () => {
        it('should handle LLM service failures gracefully', async () => {
          const request = {
            userId: 'user123',
            message: 'Test request'
          };

          // Mock LLM service failure
          const llmService = new LLMService();
          jest.spyOn(llmService, 'generateCompletion').mockRejectedValueOnce(new Error('LLM service unavailable'));

          const agentRouter = new AgentRouter(
            new SessionManager(),
            new ContextManager(),
            llmService
          );

          try {
            await agentRouter.routeRequest(request);
            fail('Expected error to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
          }
        });

        it('should use fallback models when primary model fails', async () => {
          const request = {
            userId: 'user123',
            message: 'Test fallback'
          };

          const response = await agentRouter.routeRequest(request);
          expect(response.response).toBeDefined();
        });

        it('should validate requests before processing', async () => {
          const invalidRequest = {
            userId: 'user123',
            message: ''
          };

          try {
            await agentRouter.routeRequest(invalidRequest);
            fail('Expected validation error to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain('Message cannot be empty');
          }
        });
      });
    });

    describe('Multi-Agent Coordination', () => {
      describe('agent handoff and collaboration', () => {
        it('should coordinate between multiple agents', async () => {
          const request = {
            userId: 'user123',
            message: 'I need both career advice and interview preparation',
            context: {
              currentRole: 'Software Engineer',
              goals: ['Career advancement', 'Interview preparation']
            }
          };

          const response = await agentRouter.routeRequest(request);

          // Response should indicate which agent handled it
          expect(response.agentType).toBeDefined();
          expect(response.suggestions).toBeDefined();
        });

        it('should share context between collaborating agents', async () => {
          const userId = 'user123';

          // First interaction with career guidance agent
          const request1 = {
            userId,
            message: 'I want to transition to a senior role',
            context: {
              skills: ['JavaScript', 'React', 'Node.js'],
              experience: '5 years'
            }
          };

          const response1 = await agentRouter.routeRequest(request1);

          // Second interaction with interview preparation agent
          const request2 = {
            userId,
            message: 'Help me prepare for interviews',
            context: {
              careerGoals: ['Senior Developer']
            }
          };

          const response2 = await agentRouter.routeRequest(request2);

          // Career guidance agent should have stored context about career goals
          expect(response1.contextUpdate?.currentGoal).toBeDefined();
          // Interview preparation agent should have access to that context
          expect(response2.suggestions.some(s =>
            s.includes('interview preparation') && s.includes('career advancement')
          ));
        });
      });
    });

  describe('Error Handling', () => {
      describe('comprehensive error handling', () => {
        it('should handle LLM service errors with fallback', async () => {
          const request = {
            userId: 'user123',
            message: 'Test error handling'
          };

          const response = await agentRouter.routeRequest(request);
          expect(response).toBeDefined();
          expect(response.errors).toBeDefined();
        });

        it('should handle session not found errors', async () => {
          const request = {
            userId: 'user123',
            message: 'Test non-existent session',
            sessionId: 'non-existent-session'
          };

          try {
            await agentRouter.routeRequest(request);
            fail('Expected error to be thrown');
          } catch (error) {
            expect(error).toBeDefined();
          }
        });

        it('should handle validation errors', async () => {
          const request = {
            userId: 'user123',
            message: '', // Empty message
          };

          try {
            await agentRouter.routeRequest(request);
            fail('Expected validation error to be thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toContain('Message cannot be empty');
          }
        });
      });
    });

  describe('Performance', () => {
    describe('response time optimization', () => {
      it('should complete requests within acceptable time', async () => {
        const startTime = Date.now();
        const request = {
          userId: 'user123',
          message: 'Performance test'
        };

        const response = await agentRouter.routeRequest(request);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(5000); // 5 seconds
      });

      it('should maintain performance under load', async () => {
        const promises = Array(10).fill(null).map(() =>
          agentRouter.routeRequest({
            userId: `user${Math.random()}`,
            message: 'Load test'
          })
        );

        const results = await Promise.allSettled(promises);
        const durations = results.map(result => result.duration);

        expect(durations.every(duration => duration < 5000)).toBe(true);
      });
    });

    describe('Health Monitoring', () => {
      describe('agent health checks', () => {
        it('should check agent health status', async () => {
          const healthStatus = await agentRouter.getAgentStatus();

          expect(healthStatus).toBeDefined();
          expect(Object.keys(healthStatus)).toHaveLength(4); // 4 agent types
          expect(healthStatus[AgentType.CAREER_GUIDANCE].health).toBeDefined();
        });

        it('should detect unhealthy agents', async () => {
          const healthStatus = await agentRouter.getAgentStatus();

          // Mock unhealthy agent
          const unhealthyAgent = agents.get(AgentType.CAREER_GUIDANCE);
          unhealthyAgent.status = AgentStatus.ERROR;

          const updatedHealthStatus = await agentRouter.getAgentStatus();
          expect(updatedHealthStatus[AgentType.CAREER_GUIDANCE].health).toBe('error');
        });
      });
    });

    describe('Integration Scenarios', () => {
      describe('complete user journey', () => {
        it('should handle a complete career guidance session', async () => {
          const userId = 'user123';

          // Start with career guidance
          const careerRequest = {
            userId,
            message: 'I want to advance my career path',
            context: {
              currentRole: 'Software Engineer',
              experience: '5 years',
              goals: ['Senior Developer', 'Team Lead']
            }
          };

          const careerResponse = await agentRouter.routeRequest(careerRequest);
          expect(careerResponse.agentType).toBe(AgentType.CAREER_GUIDANCE);

          // Continue with follow-up questions
          const followUpRequest = {
            userId,
            message: 'What learning resources do you recommend?',
            sessionId: careerResponse.metadata?.sessionId
          };

          const followUpResponse = await agentRouter.routeRequest(followUpRequest);
          expect(followUpResponse.agentType).toBe(AgentType.CAREER_GUIDANCE);
        });

        it('should handle interview preparation flow', async () => {
          const userId = 'user123';

          // Start with interview prep
          const interviewRequest = {
            userId,
            message: 'I have a technical interview tomorrow',
            context: {
              role: 'Senior Software Engineer',
              interviewType: 'technical',
              experience: '5 years',
              date: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          };

          const interviewResponse = await agentRouter.routeRequest(interviewRequest);
          expect(interviewResponse.agentType).toBe(AgentType.INTERVIEW_PREPARATION);
          expect(interviewResponse.suggestions).toContain('technical interview preparation');

          // Schedule follow-up
          const followUpRequest = {
            userId,
            message: 'Schedule interview follow-up',
            sessionId: interviewResponse.metadata?.sessionId
          };

          const followUpResponse = await agentRouter.routeRequest(followUpRequest);
          expect(followUpResponse.actions).toBeDefined();
          expect(followUpResponse.actions.length).toBeGreaterThan(0);
        });

        it('should handle application assistance workflow', async () => {
          const userId = 'user123';

          // Application optimization
          const appRequest = {
            userId,
            message: 'Help me improve my resume',
            context: {
              jobId: 'job123',
              targetRole: 'Software Engineer',
              currentResume: 'resume_v1.pdf'
            }
          };

          const appResponse = await agentRouter.routeRequest(appRequest);
          expect(appResponse.agentType).toBe(AgentType.APPLICATION_ASSISTANT);
          expect(appResponse.suggestions).toContain('resume optimization');

          // Application tracking
          const trackingRequest = {
            userId,
            message: 'Track my application status',
            sessionId: appResponse.metadata?.sessionId
          };

          const trackingResponse = await agentRouter.routeRequest(trackingRequest);
          expect(trackingResponse.actions).toBeDefined();
          expect(trackingResponse.actions.length).toBeGreaterThan(0);
        });

        it('should handle employer assistance workflow', async () => {
          const userId = 'user123';

          // Candidate screening
          const screeningRequest = {
            userId,
            message: 'Screen candidates for software engineer position',
            context: {
              company: 'Tech Corp',
              position: 'Software Engineer',
              experience: '5+ years'
            }
          };

          const screeningResponse = await agentRouter.routeRequest(screeningRequest);
          expect(screeningResponse.agentType).toBe(AgentType.EMPLOYER_ASSISTANT);
          expect(screeningResponse.suggestions).toContain('candidate evaluation');
        });
      });

      describe('Concurrent Sessions', () => {
        it('should handle multiple simultaneous sessions', async () => {
          const userId = 'user123';

          const sessions = Array(5).fill(null).map((_, index) =>
            agentRouter.routeRequest({
              userId: `${userId}_${index}`,
              message: `Session ${index}`,
              context: {
                agentType: Object.values(AgentType)[index % 5]
              }
            })
          });

          const results = await Promise.allSettled(sessions);

          expect(results.length).toBe(5);
          results.forEach((result, index) => {
            expect(result.agentId).toBeDefined();
            expect(Object.values(AgentType)).toContain(result.agentType);
          });
        });
      });
    });
  });

  describe('Data Persistence', () => {
    describe('session data persistence', () => {
      it('should preserve session history', async () => {
        const userId = 'user123';

        const session = await sessionManager.createSession(userId, {
          agentType: AgentType.CAREER_GUIDANCE
        });

        await sessionManager.addMessage(
          session.sessionId,
          'user',
          'First message'
        );

        await sessionManager.addMessage(
          session.sessionId,
          'user',
          'Second message'
        );

        const history = await sessionManager.getConversationHistory(session.sessionId);
        expect(history).toHaveLength(2);
      });

      it('should handle session cleanup', async () => {
        const userId = 'user123';
        const session = await sessionManager.createSession(userId, {
          agentType: AgentType.CAREER_GUIDANCE
        });

        const deleted = await sessionManager.deleteSession(session.sessionId);
        expect(deleted).toBe(true);

        const deletedSession = await sessionManager.getSession(session.sessionId);
        expect(deletedSession).toBeNull();
      });
    });
  });

  describe('Context Sharing Between Agents', () => {
    describe('cross-agent data sharing', () => {
      it('should share career data between related agents', async () => {
        const userId = 'user123';

        // First interaction with career guidance agent
        const careerRequest = {
          userId,
          message: 'I want to focus on machine learning',
          context: {
            skills: ['Python', 'Machine Learning'],
            goals: ['Data Scientist']
          }
        };

        const careerResponse = await agentRouter.routeRequest(careerRequest);
        expect(careerResponse.contextUpdate?.currentGoal).toBeDefined();

        // Then interact with interview preparation agent
        const interviewRequest = {
          userId,
          message: 'Help me prepare for machine learning interviews',
          sessionId: careerResponse.metadata?.sessionId
        };

        const interviewResponse = await agentRouter.routeRequest(interviewRequest);

        // Interview agent should have access to career context
        const sharedContext = await contextManager.getSharedContext(
          AgentType.CAREER_GUIDANCE,
          AgentType.INTERVIEW_PREPARATION,
          userId
        );

        expect(sharedContext).toBeDefined();
        expect(sharedContext?.skills).toContain('Python');
        expect(sharedContext?.goals).toContain('Data Scientist');
      });

      it('maintain shared context consistency', async () => {
        const userId = 'user123';
        const sharedData = {
          careerGoals: ['Team Lead'],
          skills: ['React', 'Node.js'],
          location: 'San Francisco'
        };

        // Share from career to interview
        await contextManager.shareContext(
          AgentType.CAREER_GUIDANCE,
          AgentType.INTERVIEW_PREPARATION,
          userId,
          sharedData
        );

        // Interview agent should have access to shared data
        const sharedContext1 = await contextManager.getSharedContext(
          AgentType.CAREER_GUIDANCE,
          AgentType.INTERVIEW_PREPARATION,
          userId
        );

        expect(sharedContext1).toEqual(sharedData);

        // Update context in interview agent
        await contextManager.updateUserContext(userId, {
          interviewStage: 'preparation',
          confidence: 0.8
        });

        // Check if career agent can see updated context
        const updatedContext = await contextManager.getUserContext(userId);
        expect(updatedContext.interviewStage).toBe('preparation');
        expect(updatedContext.interviewStage).toBe(0.8);
      });
    });
  });

  describe('Error Recovery', () => {
    describe('graceful error handling', () => {
      it('should retry failed requests with fallback models', async () => {
        const request = {
          userId: 'user123',
          message: 'Test error recovery'
        };

        const response = await agentRouter.routeRequest(request);
        expect(response).toBeDefined();
      });

      it('should handle invalid requests gracefully', async () => {
        const invalidRequest = {
          userId: 'user123',
          message: '' // Empty message
        };

        try {
          await agentRouter.routeRequest(invalidRequest);
          fail('Expected validation error');
        } catch (error) {
          expect(error.message).toContain('Message cannot be empty');
        }
      });
    });
  });
});

describe('Agent Type-Specific Tests', () => {
  describe('Career Guidance Agent', () => {
    it('should provide career path analysis', async () => {
      const request = {
        userId: 'user123',
        message: 'What career paths are available for my background?'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.CAREER_GUIDANCE);
      expect(response.response).toContain('career path');
    });

    it('should provide skill gap analysis', async () => {
      const request = {
        userId: 'user123',
        message: 'What skills should I learn for a senior role?'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.CAREER_GUIDANCE);
      expect(response.response).toContain('skill gap');
    });

    it('should provide market intelligence', async () => {
      const request = {
        userId: 'user123',
        message: 'What are the current market trends?'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.CAREER_GUIDANCE);
      expect(response.response).toContain('market trends');
    });
  });

  describe('Interview Preparation Agent', () => {
    it('should generate mock interviews', async () => {
      const request = {
        userId: 'user123',
        message: 'Can you conduct a mock interview?'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.INTERVIEW_PREPARATION);
      expect(response.response).toContain('mock interview');
    });

    it('should provide answer optimization', async () => {
      const request = {
        userId: 'user123',
        message: 'How can I improve my interview answers?'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.INTERVIEW_PREPARATION);
      expect(response.response).toContain('answer optimization');
    });

    it('should generate interview schedules', async () => {
      const request = {
        userId: 'user123',
        message: 'Help me schedule interviews'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.INTERVIEW_PREPARATION);
      expect(response.actions).toBeDefined();
      expect(response.actions!.length).toBeGreaterThan(0);
    });
  });

  describe('Application Assistant Agent', () => {
    it('should optimize resumes', async () => {
      const request = {
        userId: 'user123',
        message: 'Can you optimize my resume?'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.APPLICATION_ASSISTANT);
      expect(response.response).toContain('resume optimization');
    });

    it('should generate cover letters', async () => {
      const request = {
        userId: 'user123',
        message: 'Write a cover letter for my application'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.APPLICATION_ASSISTANT);
      expect(response.response).toContain('cover letter');
    });

    it should track applications', async () => {
      const request = {
        userId: 'user123',
        message: 'Track my application status'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.APPLICATION_ASSISTANT);
      expect(response.actions).toBeDefined();
      expect(response.actions!.some(action => action.type === 'application_tracking'));
    });
  });

  describe('Employer Assistant Agent', () => {
    it('should screen candidates', async () => {
      const request = {
        userId: 'user123',
        message: 'Screen candidates for my position'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.EMPLOYER_ASSISTANT);
      expect(response.response).toContain('candidate screening');
    });

    it('should optimize job postings', async () => {
      const request = {
        userId: 'user123',
        message: 'Optimize my job posting'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.EMPLOYER_ASSISTANT);
      expect(response.response).toContain('job posting optimization');
    });

    it('should coordinate interviews', async () => {
      const request = {
        userId: 'user123',
        message: 'Schedule team interviews'
      };

      const response = await agentRouter.routeRequest(request);
      expect(response.agentType).toBe(AgentType.EMPLOYER_ASSISTANT);
      expect(response.actions).toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle a complete user journey from career assessment to job application', async () => {
      const userId = 'user123';

      // 1. Career Guidance Phase
      const careerRequest = {
        userId,
        message: 'I have 5 years of experience and want to advance to senior level. What path should I consider?',
        context: {
          currentRole: 'Software Engineer',
          experience: '5 years',
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          goals: ['Senior Developer', 'Team Lead'],
          location: 'San Francisco, CA'
        }
      };

      const careerResponse = await agentRouter.routeRequest(careerRequest);
      expect(careerResponse.agentType).toBe(AgentType.CAREER_GUIDANCE);

      // 2. Interview Preparation Phase
      const interviewRequest = {
        userId,
        message: 'I have an interview scheduled for Senior Developer. Can you help me prepare?',
        sessionId: careerResponse.metadata?.sessionId
      };

      const interviewResponse = await agentRouter.routeRequest(interviewRequest);
      expect(interviewResponse.agentType).toBe(AgentType.INTERVIEW_PREPARATION);

      // 3. Application Assistant Phase
      const appRequest = {
        userId,
        message: 'Before the interview, can you help me improve my application?',
        sessionId: interviewResponse.metadata?.sessionId
      };

      const appResponse = await agentRouter.routeRequest(appRequest);
      expect(appResponse.agentType).toBe(AgentType.APPLICATION_ASSISTANT);

      // Each response should provide contextual suggestions and actions
      expect(careerResponse.suggestions.length).toBeGreaterThan(0);
      expect(interviewResponse.suggestions.length).toBeGreaterThan(0);
      expect(appResponse.suggestions.length).toBeGreaterThan(0);
    });

    it('handle multi-agent transitions', async () => {
      const userId = 'user123';

      // Start with career guidance
      const careerRequest = {
        userId,
        message: 'I want to transition from my current role to a senior position',
        context: {
          currentRole: 'Software Engineer',
          experience: '5 years'
        }
      };

      const careerResponse = await agentRouter.routeRequest(careerRequest);

      // Transition to interview preparation based on career guidance
      const interviewRequest = {
        userId,
        message: 'Based on your advice, what should I expect in interviews?',
        sessionId: careerResponse.metadata?.sessionId,
        context: {
          targetLevel: 'Senior Developer',
          skills: careerResponse.context?.targetSkills || []
        }
      };

      const interviewResponse = await agentRouter.routeRequest(interviewRequest);

      // Application assistance based on interview preparation
      const appRequest = {
        userId,
        message: 'Now help me prepare my application',
        sessionId: interviewResponse.metadata?.sessionId,
        context: {
          interviewFeedback: interviewResponse.metadata?.interviewFeedback || []
        }
      };

      const appResponse = await agentRouter.routeRequest(appRequest);

      // Should have consistent session and context across agents
      expect(careerResponse.metadata?.sessionId).toBe(interviewResponse.metadata?.sessionId);
      expect(interviewResponse.metadata?.sessionId).toBe(appResponse.metadata?.sessionId);
      expect(appResponse.metadata?.sessionId).toBe(appResponse.metadata?.sessionId);
    });
  });
});

  describe('Edge Cases', () => {
    describe('boundary conditions', () => {
      it('should handle empty sessions gracefully', async () => {
        const request = {
          userId: 'user123',
          message: '',
          sessionId: ''
        };

        try {
          await agentRouter.routeRequest(request);
          fail('Should throw validation error');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toContain('Message cannot be empty');
        }
      });

      it('should handle missing sessions', async () => {
        const request = {
          userId: 'user123',
          message: 'Continue conversation',
          sessionId: 'non-existent'
        };

        try {
          await agentRouter.routeRequest(request);
          fail('Should throw session not found error');
        } catch (error) {
          expect(error.message).toContain('Session not found');
        }
      });

      it('should handle malformed context', async () => {
        const request = {
          userId: 'user123',
          message: 'Test request',
          context: {
            invalid: 'data'
          }
        };

        try {
          await agentRouter.routeRequest(request);
          fail('Should throw validation error');
        } catch (error) {
          expect(error.message).toBeDefined();
        }
      });
    });
  });
});