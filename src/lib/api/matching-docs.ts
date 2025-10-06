/**
 * API Documentation for Candidate Matching System
 * Auto-generated documentation for matching system endpoints
 */

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  authentication: boolean;
  roles: string[];
  subscription: boolean;
  rateLimit: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Response[];
  examples: Example[];
}

export interface Parameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  location: 'query' | 'path' | 'header';
  example?: any;
}

export interface RequestBody {
  contentType: string;
  schema: string;
  description: string;
  required: boolean;
  example?: any;
}

export interface Response {
  statusCode: number;
  description: string;
  schema?: string;
  example?: any;
}

export interface Example {
  title: string;
  description: string;
  request?: any;
  response?: any;
}

export const MATCHING_API_DOCS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/matching/profiles/candidates',
    description: 'Search and retrieve candidate profiles with filtering and pagination',
    authentication: true,
    roles: ['seeker', 'employer', 'admin'],
    subscription: false,
    rateLimit: '200 requests per 15 minutes',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query for text-based search',
        required: false,
        location: 'query',
        example: 'javascript developer'
      },
      {
        name: 'skills',
        type: 'string[]',
        description: 'Array of required skills',
        required: false,
        location: 'query',
        example: ['javascript', 'react', 'node.js']
      },
      {
        name: 'location',
        type: 'string',
        description: 'Location filter',
        required: false,
        location: 'query',
        example: 'New York'
      },
      {
        name: 'experienceLevel',
        type: 'string',
        description: 'Experience level filter',
        required: false,
        location: 'query',
        example: 'senior'
      },
      {
        name: 'salaryMin',
        type: 'number',
        description: 'Minimum salary filter',
        required: false,
        location: 'query',
        example: 80000
      },
      {
        name: 'salaryMax',
        type: 'number',
        description: 'Maximum salary filter',
        required: false,
        location: 'query',
        example: 120000
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Number of results to return (max 100)',
        required: false,
        location: 'query',
        example: 20
      },
      {
        name: 'offset',
        type: 'number',
        description: 'Number of results to skip for pagination',
        required: false,
        location: 'query',
        example: 0
      }
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Successfully retrieved candidate profiles',
        example: {
          success: true,
          data: [
            {
              id: 'candidate_1',
              userId: 'user_1',
              personalInfo: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                location: { country: 'United States', city: 'New York' }
              },
              professionalSummary: 'Experienced software developer...',
              skills: [
                { name: 'JavaScript', category: 'technical', level: 'advanced' }
              ],
              metadata: { completionScore: 85, isActive: true }
            }
          ],
          meta: {
            total: 150,
            hasMore: true,
            limit: 20,
            offset: 0
          }
        }
      },
      {
        statusCode: 401,
        description: 'Authentication required'
      },
      {
        statusCode: 403,
        description: 'Access denied or insufficient permissions'
      },
      {
        statusCode: 429,
        description: 'Rate limit exceeded'
      }
    ],
    examples: [
      {
        title: 'Search for JavaScript developers',
        description: 'Find candidates with JavaScript skills',
        request: {
          url: '/api/matching/profiles/candidates?skills=javascript&experienceLevel=senior&limit=10'
        }
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/matching/profiles/candidates',
    description: 'Create a new candidate profile',
    authentication: true,
    roles: ['seeker'],
    subscription: false,
    rateLimit: '50 requests per 15 minutes',
    requestBody: {
      contentType: 'application/json',
      schema: 'CreateCandidateProfileSchema',
      description: 'Candidate profile data',
      required: true,
      example: {
        userId: 'user_1',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          location: { country: 'United States', city: 'New York' }
        },
        professionalSummary: 'Experienced software developer with 5+ years...',
        skills: [
          { name: 'JavaScript', category: 'technical', level: 'advanced' }
        ],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Senior Software Engineer',
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2023-12-31T00:00:00Z',
            isCurrent: false,
            description: 'Led development of web applications...'
          }
        ]
      }
    },
    responses: [
      {
        statusCode: 201,
        description: 'Candidate profile created successfully',
        example: {
          success: true,
          data: {
            id: 'candidate_1',
            userId: 'user_1',
            personalInfo: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            },
            metadata: { completionScore: 85, isActive: true }
          },
          message: 'Candidate profile created successfully'
        }
      },
      {
        statusCode: 400,
        description: 'Invalid request data'
      },
      {
        statusCode: 409,
        description: 'Candidate profile already exists'
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/matching/profiles/jobs',
    description: 'Search and retrieve job profiles with filtering and pagination',
    authentication: true,
    roles: ['seeker', 'employer', 'admin'],
    subscription: false,
    rateLimit: '200 requests per 15 minutes',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query for text-based search',
        required: false,
        location: 'query',
        example: 'senior software engineer'
      },
      {
        name: 'skills',
        type: 'string[]',
        description: 'Array of required skills',
        required: false,
        location: 'query',
        example: ['react', 'node.js', 'typescript']
      },
      {
        name: 'location',
        type: 'string',
        description: 'Location filter',
        required: false,
        location: 'query',
        example: 'San Francisco'
      },
      {
        name: 'experienceLevel',
        type: 'string',
        description: 'Experience level filter',
        required: false,
        location: 'query',
        example: 'senior'
      },
      {
        name: 'workType',
        type: 'string[]',
        description: 'Employment type filter',
        required: false,
        location: 'query',
        example: ['full_time', 'remote']
      },
      {
        name: 'salaryMin',
        type: 'number',
        description: 'Minimum salary filter',
        required: false,
        location: 'query',
        example: 120000
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Number of results to return (max 100)',
        required: false,
        location: 'query',
        example: 20
      }
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Successfully retrieved job profiles',
        example: {
          success: true,
          data: [
            {
              id: 'job_1',
              jobId: 'job_db_1',
              employerId: 'employer_1',
              title: 'Senior Software Engineer',
              description: 'We are looking for an experienced...',
              requirements: {
                skills: [
                  { name: 'JavaScript', level: 'advanced', required: true }
                ]
              },
              metadata: { postedDate: '2024-01-01T00:00:00Z', isActive: true }
            }
          ],
          meta: {
            total: 75,
            hasMore: false,
            limit: 20,
            offset: 0
          }
        }
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/matching/profiles/jobs',
    description: 'Create a new job profile',
    authentication: true,
    roles: ['employer'],
    subscription: false,
    rateLimit: '50 requests per 15 minutes',
    requestBody: {
      contentType: 'application/json',
      schema: 'CreateJobProfileSchema',
      description: 'Job profile data',
      required: true,
      example: {
        jobId: 'job_db_1',
        employerId: 'employer_1',
        title: 'Senior Software Engineer',
        description: 'We are looking for an experienced...',
        requirements: {
          skills: [
            { name: 'JavaScript', level: 'advanced', required: true }
          ],
          experience: [
            { title: 'Software Engineer', level: 'senior', yearsRequired: 5 }
          ]
        },
        compensation: {
          salaryRange: { min: 120000, max: 180000, currency: 'USD' }
        },
        location: { country: 'United States', city: 'San Francisco' }
      }
    },
    responses: [
      {
        statusCode: 201,
        description: 'Job profile created successfully',
        example: {
          success: true,
          data: {
            id: 'job_1',
            jobId: 'job_db_1',
            title: 'Senior Software Engineer',
            metadata: { postedDate: '2024-01-01T00:00:00Z', isActive: true }
          },
          message: 'Job profile created successfully'
        }
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/matching/profiles/{id}',
    description: 'Get a specific profile by ID (candidate or job)',
    authentication: true,
    roles: ['seeker', 'employer', 'admin'],
    subscription: false,
    rateLimit: '200 requests per 15 minutes',
    parameters: [
      {
        name: 'id',
        type: 'string',
        description: 'Profile ID (candidate or job profile)',
        required: true,
        location: 'path',
        example: 'candidate_1'
      }
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Successfully retrieved profile',
        example: {
          success: true,
          data: {
            id: 'candidate_1',
            type: 'candidate',
            personalInfo: { firstName: 'John', lastName: 'Doe' },
            metadata: { completionScore: 85, isActive: true }
          }
        }
      },
      {
        statusCode: 403,
        description: 'Access denied - insufficient permissions'
      },
      {
        statusCode: 404,
        description: 'Profile not found'
      }
    ]
  },
  {
    method: 'PUT',
    path: '/api/matching/profiles/{id}',
    description: 'Update a specific profile by ID',
    authentication: true,
    roles: ['seeker', 'employer', 'admin'],
    subscription: false,
    rateLimit: '50 requests per 15 minutes',
    parameters: [
      {
        name: 'id',
        type: 'string',
        description: 'Profile ID to update',
        required: true,
        location: 'path',
        example: 'candidate_1'
      }
    ],
    requestBody: {
      contentType: 'application/json',
      schema: 'UpdateCandidateProfileSchema | UpdateJobProfileSchema',
      description: 'Profile update data',
      required: true
    },
    responses: [
      {
        statusCode: 200,
        description: 'Profile updated successfully',
        example: {
          success: true,
          data: {
            id: 'candidate_1',
            type: 'candidate',
            metadata: { completionScore: 90, isActive: true }
          },
          message: 'Candidate profile updated successfully'
        }
      },
      {
        statusCode: 403,
        description: 'Access denied - can only update own profiles'
      },
      {
        statusCode: 404,
        description: 'Profile not found'
      }
    ]
  },
  {
    method: 'DELETE',
    path: '/api/matching/profiles/{id}',
    description: 'Delete a specific profile by ID',
    authentication: true,
    roles: ['seeker', 'employer', 'admin'],
    subscription: false,
    rateLimit: '50 requests per 15 minutes',
    parameters: [
      {
        name: 'id',
        type: 'string',
        description: 'Profile ID to delete',
        required: true,
        location: 'path',
        example: 'candidate_1'
      }
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Profile deleted successfully',
        example: {
          success: true,
          type: 'candidate',
          message: 'Candidate profile deleted successfully'
        }
      },
      {
        statusCode: 403,
        description: 'Access denied - can only delete own profiles'
      },
      {
        statusCode: 404,
        description: 'Profile not found'
      }
    ]
  }
];

/**
 * Generate OpenAPI/Swagger specification
 */
export function generateOpenAPISpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Candidate Matching System API',
      version: '1.0.0',
      description: 'API endpoints for the AI-powered candidate matching system',
      contact: {
        name: 'API Support',
        email: 'support@jobfinders.com'
      }
    },
    servers: [
      {
        url: 'https://api.jobfinders.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3010',
        description: 'Development server'
      }
    ],
    paths: generatePaths(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  };
}

/**
 * Generate OpenAPI paths from documentation
 */
function generatePaths() {
  const paths: any = {};

  for (const endpoint of MATCHING_API_DOCS) {
    const path = endpoint.path.replace('{id}', '{id}');
    const method = endpoint.method.toLowerCase();

    if (!paths[path]) {
      paths[path] = {};
    }

    paths[path][method] = {
      summary: endpoint.description,
      description: endpoint.description,
      tags: ['Matching'],
      security: endpoint.authentication ? [{ bearerAuth: [] }] : [],
      parameters: endpoint.parameters.map(param => ({
        name: param.name,
        in: param.location,
        description: param.description,
        required: param.required,
        schema: { type: param.type }
      })),
      requestBody: endpoint.requestBody ? {
        content: {
          'application/json': {
            schema: { type: 'object' },
            example: endpoint.requestBody.example
          }
        }
      } : undefined,
      responses: endpoint.responses.reduce((acc, response) => {
        acc[response.statusCode.toString()] = {
          description: response.description,
          content: response.example ? {
            'application/json': {
              example: response.example
            }
          } : undefined
        };
        return acc;
      }, {} as any)
    };
  }

  return paths;
}

/**
 * Get endpoint documentation by method and path
 */
export function getEndpointDocs(method: string, path: string): ApiEndpoint | undefined {
  return MATCHING_API_DOCS.find(
    endpoint => endpoint.method.toLowerCase() === method.toLowerCase() && endpoint.path === path
  );
}

/**
 * Get all endpoints for a specific role
 */
export function getEndpointsByRole(role: string): ApiEndpoint[] {
  return MATCHING_API_DOCS.filter(endpoint => endpoint.roles.includes(role));
}

/**
 * Get rate limit information
 */
export function getRateLimitInfo() {
  return {
    profile: '50 requests per 15 minutes',
    search: '200 requests per 15 minutes',
    analysis: '20 requests per hour'
  };
}