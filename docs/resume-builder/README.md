# Resume Builder System

A comprehensive AI-powered resume builder system with real-time suggestions, template customization, and batch processing capabilities.

## Overview

The Resume Builder system provides users with advanced tools to create, edit, and optimize their resumes using AI-powered suggestions and professional templates. It includes real-time feedback, ATS optimization, and batch processing capabilities for enterprise users.

## Features

### 🎨 **Template System**
- Professional template library with modern designs
- Real-time customization (colors, fonts, layouts)
- Template preview and comparison
- Export to multiple formats (PDF, DOCX, HTML)
- Mobile-responsive design

### 🤖 **AI-Powered Suggestions**
- Real-time content suggestions while editing
- Grammar and spell checking
- ATS optimization recommendations
- Keyword density analysis
- Industry-specific suggestions
- Context-aware improvements

### 📊 **Analysis Dashboard**
- ATS score visualization with detailed breakdowns
- Keyword analysis with match tracking
- Categorized improvement suggestions
- Progress tracking over time
- Export analysis reports

### ⚡ **Batch Processing**
- Queue-based job processing system
- Resume analysis for multiple candidates
- ATS scoring in bulk
- Progress tracking and notifications
- Admin monitoring interface

### 🛠️ **Advanced Editor**
- Drag-and-drop section reordering
- Auto-save functionality
- Undo/redo capabilities
- Collapsible sections
- Real-time validation

## Architecture

### System Components

```
├── src/
│   ├── services/
│   │   ├── resume-builder/
│   │   │   ├── index.ts                 # Main service orchestrator
│   │   │   ├── ai-analyzer.ts           # OpenAI integration
│   │   │   ├── ats-scorer.ts           # ATS scoring algorithm
│   │   │   ├── file-upload.ts          # File handling
│   │   │   ├── openai-service.ts       # OpenAI API client
│   │   │   ├── parser.ts               # Resume parsing
│   │   │   ├── suggestion-engine.ts    # AI suggestions
│   │   │   └── batch-processor.ts     # Batch processing
│   │   └── template-engine/
│   │       ├── index.ts                # Template engine main
│   │       ├── template-registry.ts    # Template storage
│   │       ├── template-renderer.ts    # HTML generation
│   │       └── template-customizer.ts  # Customization logic
│   ├── components/
│   │   ├── resume/
│   │   │   ├── ResumeEditor.tsx        # Main editor
│   │   │   ├── AnalysisDashboard.tsx   # ATS analysis
│   │   │   └── ExportPreview.tsx       # Export interface
│   │   └── template/
│   │       ├── TemplateGallery.tsx     # Template selection
│   │       └── TemplateCustomizer.tsx  # Customization UI
│   ├── hooks/
│   │   ├── use-resume-editor.ts        # Editor state management
│   │   └── use-real-time-suggestions.ts # Real-time suggestions
│   ├── types/
│   │   ├── resume.ts                   # Resume type definitions
│   │   └── template.ts                 # Template type definitions
│   └── app/
│       ├── api/
│       │   ├── resume/
│       │   │   ├── suggestions/route.ts    # Suggestions API
│       │   │   ├── [id]/suggestions/route.ts # Resume-specific API
│       │   │   └── batch/route.ts          # Batch processing API
│       │   └── resume-builder/
│       └── resume-builder/
│           └── page.ts                # Main application page
└── prisma/
    └── migrations/
        └── 003_create_resume_builder_tables.sql
```

### Database Schema

The system uses PostgreSQL with the following key tables:

- **resumes** - Main resume storage
- **experience** - Work experience entries
- **education** - Education background
- **certifications** - Professional certifications
- **languages** - Language skills
- **projects** - Portfolio projects
- **batch_match_jobs** - Batch processing jobs

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- OpenAI API key
- Redis (for caching)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jobfinders_mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   REDIS_URL=redis://localhost:6379
   ```

4. **Run database migrations**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Usage

### Resume Creation Workflow

1. **Access the Resume Builder**
   - Navigate to `/resume-builder`

2. **Choose a Template**
   - Browse template gallery
   - Preview different designs
   - Select preferred template

3. **Edit Resume Content**
   - Fill in personal information
   - Add work experience
   - Include education details
   - List skills and certifications

4. **Get AI Suggestions**
   - Real-time suggestions appear while editing
   - Grammar and spell checking
   - ATS optimization tips
   - Keyword recommendations

5. **Customize Design**
   - Adjust colors and fonts
   - Modify layout sections
   - Preview changes in real-time

6. **Analyze and Export**
   - View ATS score breakdown
   - Implement suggestions
   - Export to desired format

### API Integration

#### Generate Suggestions
```javascript
const response = await fetch('/api/resume/suggestions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'general',
    resumeData: resumeData,
    targetJobTitle: 'Software Engineer',
    section: 'experience',
    focus: 'content'
  })
});
```

#### Batch Processing
```javascript
const response = await fetch('/api/resume/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    type: 'resume_analysis',
    resumeIds: ['resume-1', 'resume-2'],
    emailNotification: true
  })
});
```

## Configuration

### Template Configuration

Templates are defined in the `src/templates/` directory:

```typescript
export const executiveProTemplate: ResumeTemplate = {
  id: 'executive-pro',
  name: 'Executive Pro',
  category: 'professional',
  // ... template configuration
};
```

### AI Model Configuration

AI suggestions use OpenAI GPT-4 with configurable parameters:

```typescript
const suggestionRequest = {
  resumeData,
  targetJobTitle,
  targetIndustry,
  section: 'experience',
  focus: 'content' // 'ats' | 'content' | 'formatting' | 'keywords'
};
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test files
npm test __tests__/resume-builder/

# Run integration tests
npm test __tests__/integration/
```

### Test Coverage

- **Unit Tests**: Individual service and component testing
- **Integration Tests**: API endpoint testing
- **Component Tests**: React component testing
- **Performance Tests**: File processing and AI response times

## Performance

### Optimization Features

- **Caching**: Redis-based caching for AI responses
- **Debouncing**: Reduced API calls during typing
- **Lazy Loading**: Components loaded on demand
- **Compression**: Optimized asset delivery

### Performance Metrics

- Resume parsing: <30 seconds
- AI analysis: <5 seconds
- Template rendering: <2 seconds
- File upload success rate: >99%

## Security

### Security Features

- **Authentication**: User-based access control
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive data validation
- **File Scanning**: Virus scanning for uploads
- **Data Encryption**: Sensitive field encryption

### Security Best Practices

- Environment variables for secrets
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file handling

## Monitoring

### Logging

Comprehensive logging system:

```typescript
// Application logging
logger.info('Resume created', { resumeId, userId });

// Error tracking
logger.error('AI analysis failed', { error, resumeId });

// Performance monitoring
logger.metric('suggestion_generation_time', duration);
```

### Health Checks

- API endpoint monitoring
- Database connection health
- External service status (OpenAI, Redis)
- File system accessibility

## Troubleshooting

### Common Issues

1. **AI Suggestions Not Working**
   - Check OpenAI API key configuration
   - Verify rate limits and quotas
   - Check network connectivity

2. **Template Rendering Issues**
   - Clear template cache
   - Verify template syntax
   - Check CSS compilation

3. **Batch Processing Failures**
   - Check queue status
   - Verify database connections
   - Review error logs

4. **File Upload Problems**
   - Check file size limits
   - Verify file formats
   - Review virus scanning logs

### Debug Mode

Enable debug logging:

```bash
DEBUG=resume-builder:* npm run dev
```

## Contributing

### Development Guidelines

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Testing**: Write tests for new features
3. **Documentation**: Update README and inline comments
4. **Security**: Follow security best practices

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request for review

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting guide
- Review the API documentation