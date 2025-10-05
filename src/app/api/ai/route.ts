import { AIAgentSystem } from '@/services/ai-agents';
import { ATSSystem } from '@/services/ats-system';
import { MatchingEngine } from '@/services/matching-engine';

export async function POST(req: Request) {
  const { type, params } = await req.json();
  
  switch (type) {
    case 'career-advice':
      const agent = new AIAgentSystem();
      return Response.json(await agent.getCareerAdvice(params));
      
    case 'ats-analyze':
      const ats = new ATSSystem();
      return Response.json(await ats.analyzeResume(params.resume, params.job));
      
    case 'find-matches':
      const matcher = new MatchingEngine();
      return Response.json(await matcher.findMatches(params));
  }
}