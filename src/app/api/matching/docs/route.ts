import { NextRequest, NextResponse } from 'next/server';
import { generateOpenAPISpec, MATCHING_API_DOCS } from '@/lib/api/matching-docs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const endpoint = searchParams.get('endpoint');
    const method = searchParams.get('method');

    // Return specific endpoint documentation
    if (endpoint && method) {
      const endpointDocs = MATCHING_API_DOCS.find(
        doc => doc.method.toLowerCase() === method.toLowerCase() && doc.path === endpoint
      );

      if (!endpointDocs) {
        return NextResponse.json(
          { error: 'Endpoint documentation not found' },
          { status: 404 }
        );
      }

      if (format === 'html') {
        const html = generateEndpointHTML(endpointDocs);
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      return NextResponse.json({
        success: true,
        data: endpointDocs
      });
    }

    // Return full API documentation
    if (format === 'openapi') {
      const openAPISpec = generateOpenAPISpec();
      return NextResponse.json(openAPISpec);
    }

    if (format === 'html') {
      const html = generateDocumentationHTML();
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Default: JSON format
    return NextResponse.json({
      success: true,
      data: {
        title: 'Candidate Matching System API',
        version: '1.0.0',
        description: 'API endpoints for the AI-powered candidate matching system',
        baseUrl: process.env.NODE_ENV === 'production'
          ? 'https://api.jobfinders.com'
          : 'http://localhost:3010',
        endpoints: MATCHING_API_DOCS,
        rateLimits: {
          profile: '50 requests per 15 minutes',
          search: '200 requests per 15 minutes',
          analysis: '20 requests per hour'
        },
        authentication: {
          type: 'Bearer Token',
          description: 'JWT token required for all endpoints'
        },
        examples: {
          searchCandidates: {
            method: 'GET',
            url: '/api/matching/profiles/candidates?skills=javascript&experienceLevel=senior&limit=10',
            description: 'Search for senior JavaScript developers'
          },
          createCandidateProfile: {
            method: 'POST',
            url: '/api/matching/profiles/candidates',
            description: 'Create a new candidate profile'
          },
          getProfile: {
            method: 'GET',
            url: '/api/matching/profiles/{id}',
            description: 'Get a specific profile by ID'
          }
        }
      }
    });

  } catch (error) {
    console.error('Error generating API documentation:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate API documentation',
        code: 'DOCS_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML documentation for a specific endpoint
 */
function generateEndpointHTML(endpoint: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${endpoint.method} ${endpoint.path} - Matching API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .method {
            background: #28a745;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .method.get { background: #007bff; }
        .method.post { background: #28a745; }
        .method.put { background: #ffc107; color: #000; }
        .method.delete { background: #dc3545; }
        .endpoint {
            font-family: monospace;
            background: #f1f3f4;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 18px;
            margin: 10px 0;
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #007bff;
        }
        .parameter {
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .required {
            color: #dc3545;
            font-weight: bold;
        }
        .optional {
            color: #6c757d;
        }
        .response {
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid #28a745;
        }
        .error {
            border-left-color: #dc3545;
        }
        pre {
            background: #f1f3f4;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Candidate Matching System API</h1>
        <div class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</div>
        <div class="endpoint">${endpoint.path}</div>
        <p>${endpoint.description}</p>
    </div>

    <div class="section">
        <h2>Authentication</h2>
        <p><strong>Required:</strong> ${endpoint.authentication ? 'Yes' : 'No'}</p>
        <p><strong>Roles:</strong> ${endpoint.roles.join(', ')}</p>
        <p><strong>Subscription:</strong> ${endpoint.subscription ? 'Yes' : 'No'}</p>
        <p><strong>Rate Limit:</strong> ${endpoint.rateLimit}</p>
    </div>

    <div class="section">
        <h2>Parameters</h2>
        ${endpoint.parameters.map(param => `
            <div class="parameter">
                <strong>${param.name}</strong>
                <span class="${param.required ? 'required' : 'optional'}">
                    (${param.required ? 'Required' : 'Optional'})
                </span>
                <br>
                <em>Type:</em> ${param.type} |
                <em>Location:</em> ${param.location}
                <br>
                ${param.description}
            </div>
        `).join('')}
    </div>

    ${endpoint.requestBody ? `
    <div class="section">
        <h2>Request Body</h2>
        <p><strong>Content-Type:</strong> ${endpoint.requestBody.contentType}</p>
        <p><strong>Required:</strong> ${endpoint.requestBody.required ? 'Yes' : 'No'}</p>
        <p>${endpoint.requestBody.description}</p>
        ${endpoint.requestBody.example ? `
            <h3>Example:</h3>
            <pre><code>${JSON.stringify(endpoint.requestBody.example, null, 2)}</code></pre>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2>Responses</h2>
        ${endpoint.responses.map(response => `
            <div class="response ${response.statusCode >= 400 ? 'error' : ''}">
                <strong>${response.statusCode} - ${response.description}</strong>
                ${response.example ? `
                    <pre><code>${JSON.stringify(response.example, null, 2)}</code></pre>
                ` : ''}
            </div>
        `).join('')}
    </div>

    ${endpoint.examples.length > 0 ? `
    <div class="section">
        <h2>Examples</h2>
        ${endpoint.examples.map(example => `
            <div style="margin: 15px 0; padding: 15px; background: #e9ecef; border-radius: 4px;">
                <h3>${example.title}</h3>
                <p>${example.description}</p>
                ${example.request ? `
                    <p><strong>Request:</strong></p>
                    <pre><code>${example.request.url}</code></pre>
                ` : ''}
                ${example.response ? `
                    <p><strong>Response:</strong></p>
                    <pre><code>${JSON.stringify(example.response, null, 2)}</code></pre>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
  `;
}

/**
 * Generate complete HTML documentation
 */
function generateDocumentationHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Candidate Matching System API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .endpoint-list {
            display: grid;
            gap: 15px;
        }
        .endpoint-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .endpoint-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
            margin-right: 8px;
        }
        .method.get { background: #007bff; color: white; }
        .method.post { background: #28a745; color: white; }
        .method.put { background: #ffc107; color: #000; }
        .method.delete { background: #dc3545; color: white; }
        .endpoint-path {
            font-family: monospace;
            background: #f1f3f4;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 16px;
            margin: 10px 0;
        }
        .meta {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin: 10px 0;
            font-size: 14px;
            color: #6c757d;
        }
        .meta-item {
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 12px;
        }
        .toc {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .toc ul {
            list-style: none;
            padding: 0;
        }
        .toc li {
            margin: 8px 0;
        }
        .toc a {
            text-decoration: none;
            color: #007bff;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .rate-limits {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Candidate Matching System API</h1>
        <p>AI-powered candidate matching and job recommendations</p>
        <p style="font-size: 16px; opacity: 0.9;">Version 1.0.0</p>
    </div>

    <div class="rate-limits">
        <h2>⚡ Rate Limits</h2>
        <ul>
            <li><strong>Profile Operations:</strong> 50 requests per 15 minutes</li>
            <li><strong>Search Operations:</strong> 200 requests per 15 minutes</li>
            <li><strong>Analysis Operations:</strong> 20 requests per hour</li>
        </ul>
    </div>

    <div class="toc">
        <h2>📚 Table of Contents</h2>
        <ul>
            ${MATCHING_API_DOCS.map((endpoint, index) => `
                <li>
                    <a href="#endpoint-${index}">${endpoint.method} ${endpoint.path}</a>
                </li>
            `).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>🔐 Authentication</h2>
        <p>All endpoints require JWT token authentication. Include the token in the Authorization header:</p>
        <pre><code>Authorization: Bearer &lt;your-jwt-token&gt;</code></pre>
        <p><strong>Required Roles:</strong></p>
        <ul>
            <li><strong>Seeker:</strong> Can manage candidate profiles, search jobs</li>
            <li><strong>Employer:</strong> Can manage job profiles, search candidates</li>
            <li><strong>Admin:</strong> Full access to all endpoints</li>
        </ul>
    </div>

    <div class="endpoint-list">
        ${MATCHING_API_DOCS.map((endpoint, index) => `
            <div class="endpoint-card" id="endpoint-${index}">
                <div>
                    <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                    <div class="endpoint-path">${endpoint.path}</div>
                </div>
                <p>${endpoint.description}</p>
                <div class="meta">
                    <span class="meta-item">Roles: ${endpoint.roles.join(', ')}</span>
                    <span class="meta-item">Auth: ${endpoint.authentication ? 'Required' : 'Optional'}</span>
                    <span class="meta-item">Rate: ${endpoint.rateLimit}</span>
                    ${endpoint.subscription ? '<span class="meta-item">Subscription Required</span>' : ''}
                </div>
                ${endpoint.parameters.length > 0 ? `
                    <details>
                        <summary><strong>Parameters (${endpoint.parameters.length})</strong></summary>
                        ${endpoint.parameters.map(param => `
                            <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong>${param.name}</strong>
                                <span style="color: ${param.required ? '#dc3545' : '#6c757d'};">
                                    (${param.required ? 'Required' : 'Optional'})
                                </span>
                                <br>
                                <em>${param.type}</em> | ${param.location}
                                <br>
                                ${param.description}
                            </div>
                        `).join('')}
                    </details>
                ` : ''}
                ${endpoint.requestBody ? `
                    <details>
                        <summary><strong>Request Body</strong></summary>
                        <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                            <strong>Content-Type:</strong> ${endpoint.requestBody.contentType}<br>
                            <strong>Required:</strong> ${endpoint.requestBody.required ? 'Yes' : 'No'}<br>
                            ${endpoint.requestBody.description}
                        </div>
                    </details>
                ` : ''}
                ${endpoint.responses.length > 0 ? `
                    <details>
                        <summary><strong>Responses (${endpoint.responses.length})</strong></summary>
                        ${endpoint.responses.map(response => `
                            <div style="margin: 8px 0; padding: 8px; border-left: 3px solid ${response.statusCode >= 400 ? '#dc3545' : '#28a745'}; background: #f8f9fa;">
                                <strong>${response.statusCode}</strong> - ${response.description}
                            </div>
                        `).join('')}
                    </details>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>💡 Usage Examples</h2>

        <h3>Search for Candidates</h3>
        <pre><code>GET /api/matching/profiles/candidates?skills=javascript&experienceLevel=senior&limit=10</code></pre>

        <h3>Create Candidate Profile</h3>
        <pre><code>POST /api/matching/profiles/candidates
Content-Type: application/json
Authorization: Bearer &lt;token&gt;

{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "location": { "country": "United States" }
  },
  "professionalSummary": "Experienced software developer...",
  "skills": [
    { "name": "JavaScript", "category": "technical", "level": "advanced" }
  ]
}</code></pre>

        <h3>Get Profile by ID</h3>
        <pre><code>GET /api/matching/profiles/candidate_1</code></pre>
    </div>
</body>
</html>
  `;
}