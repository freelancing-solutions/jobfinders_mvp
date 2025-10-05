# Resume Builder Requirements

## Core Requirements
1. AI-Powered Content Generation
   - Job description analysis
   - Achievement formatting
   - Keyword optimization
   - Industry-specific suggestions

2. Template System
   - ATS-friendly layouts
   - Industry-specific templates
   - Custom styling options
   - PDF/DOCX export

3. Integration Points
   - OpenRouter API (claude-2) for content generation
   - PDF generation service
   - Local storage for drafts
   - Cloud storage for final versions

## Technical Requirements
```typescript
interface ResumeTemplate {
    id: string;
    name: string;
    industry: string[];
    sections: Section[];
    styling: StyleConfig;
    atsScore: number;
}

interface AIGenerationConfig {
    model: 'claude-2' | 'gpt-3.5-turbo';
    context: {
        industry: string;
        experienceLevel: string;
        targetRole: string;
    };
    temperature: number;
}
```