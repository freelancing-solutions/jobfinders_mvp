import { LLMService } from '@/services/agents/llm/llm-service';
import { OutreachMessage, NetworkingTemplate } from '@/types/agents';

/**
 * Outreach Message Generator
 * Creates personalized outreach messages for networking purposes
 */
export class OutreachMessageGenerator {
  constructor(private llmService: LLMService) {}

  /**
   * Generate personalized outreach message
   */
  async generateMessage(params: {
    recipientProfile: any;
    purpose: string;
    context: any;
    tone: string;
    platform: string;
    senderProfile: any;
    senderGoals: string[];
  }): Promise<OutreachMessage> {
    const {
      recipientProfile,
      purpose,
      context,
      tone,
      platform,
      senderProfile,
      senderGoals
    } = params;

    // Research recipient
    const research = await this.researchRecipient(recipientProfile);

    // Find common ground
    const commonGround = await this.findCommonGround(senderProfile, recipientProfile, research);

    // Craft message
    const message = await this.craftMessage({
      recipientProfile,
      purpose,
      context,
      tone,
      platform,
      senderProfile,
      senderGoals,
      research,
      commonGround
    });

    // Optimize for platform
    const optimizedMessage = this.optimizeForPlatform(message, platform);

    // Generate subject line if needed
    const subjectLine = this.needsSubjectLine(platform)
      ? await this.generateSubjectLine(recipientProfile, purpose, tone)
      : undefined;

    return {
      content: optimizedMessage.content,
      subjectLine,
      platform,
      tone,
      purpose,
      personalizationElements: optimizedMessage.personalizationElements,
      callToAction: optimizedMessage.callToAction,
      followUpTiming: optimizedMessage.followUpTiming,
      effectiveness: optimizedMessage.effectiveness,
      template: optimizedMessage.template,
      tips: optimizedMessage.tips
    };
  }

  /**
   * Generate follow-up messages
   */
  async generateFollowUps(originalMessage: OutreachMessage, recipient: any): Promise<string[]> {
    const followUps = [
      {
        delay: '3-5 days',
        message: await this.generateFollowUpMessage(originalMessage, recipient, 'gentle')
      },
      {
        delay: '1 week',
        message: await this.generateFollowUpMessage(originalMessage, recipient, 'value_add')
      },
      {
        delay: '2 weeks',
        message: await this.generateFollowUpMessage(originalMessage, recipient, 'final')
      }
    ];

    return followUps.map(f => f.message);
  }

  /**
   * Research recipient for personalization
   */
  private async researchRecipient(recipientProfile: any): Promise<any> {
    return {
      recentActivity: recipientProfile.recentPosts || [],
      interests: recipientProfile.interests || [],
      accomplishments: recipientProfile.accomplishments || [],
      currentRole: recipientProfile.currentRole,
      company: recipientProfile.company,
      careerPath: recipientProfile.experience || []
    };
  }

  /**
   * Find common ground between sender and recipient
   */
  private async findCommonGround(senderProfile: any, recipientProfile: any, research: any): Promise<any[]> {
    const commonGround = [];

    // Check for shared connections
    const sharedConnections = this.findSharedConnections(senderProfile, recipientProfile);
    if (sharedConnections.length > 0) {
      commonGround.push({
        type: 'connections',
        value: sharedConnections,
        strength: 'high'
      });
    }

    // Check for shared education
    const sharedEducation = this.findSharedEducation(senderProfile, recipientProfile);
    if (sharedEducation.length > 0) {
      commonGround.push({
        type: 'education',
        value: sharedEducation,
        strength: 'high'
      });
    }

    // Check for shared experience
    const sharedExperience = this.findSharedExperience(senderProfile, recipientProfile);
    if (sharedExperience.length > 0) {
      commonGround.push({
        type: 'experience',
        value: sharedExperience,
        strength: 'medium'
      });
    }

    // Check for shared interests
    const sharedInterests = this.findSharedInterests(senderProfile, recipientProfile);
    if (sharedInterests.length > 0) {
      commonGround.push({
        type: 'interests',
        value: sharedInterests,
        strength: 'medium'
      });
    }

    return commonGround;
  }

  /**
   * Craft personalized message
   */
  private async craftMessage(params: {
    recipientProfile: any;
    purpose: string;
    context: any;
    tone: string;
    platform: string;
    senderProfile: any;
    senderGoals: string[];
    research: any;
    commonGround: any[];
  }): Promise<any> {
    const {
      recipientProfile,
      purpose,
      context,
      tone,
      platform,
      senderProfile,
      senderGoals,
      research,
      commonGround
    } = params;

    // Select best common ground
    const selectedCommonGround = this.selectBestCommonGround(commonGround);

    // Create opening
    const opening = await this.createOpening(recipientProfile, selectedCommonGround, tone);

    // Create body
    const body = await this.createBody({
      recipientProfile,
      purpose,
      context,
      senderProfile,
      senderGoals,
      research,
      tone
    });

    // Create call to action
    const callToAction = await this.createCallToAction(purpose, platform, tone);

    // Create closing
    const closing = await this.createClosing(tone, senderProfile);

    return {
      content: `${opening}\n\n${body}\n\n${callToAction}\n\n${closing}`,
      personalizationElements: selectedCommonGround,
      callToAction,
      followUpTiming: this.determineFollowUpTiming(purpose, platform),
      effectiveness: this.calculateEffectiveness(selectedCommonGround, purpose, tone),
      template: this.identifyTemplate(purpose, tone),
      tips: await this.generateMessageTips(recipientProfile, platform, purpose)
    };
  }

  /**
   * Create message opening
   */
  private async createOpening(recipientProfile: any, commonGround: any[], tone: string): Promise<string> {
    if (commonGround.length > 0) {
      const bestGround = commonGround[0];

      switch (bestGround.type) {
        case 'connections':
          return `Hi ${recipientProfile.firstName}, I noticed we're both connected with ${bestGround.value[0].name}`;

        case 'education':
          return `Hi ${recipientProfile.firstName}, I saw we both attended ${bestGround.value[0].institution}`;

        case 'experience':
          return `Hi ${recipientProfile.firstName}, I noticed we both have experience in ${bestGround.value[0]}`;

        case 'interests':
          return `Hi ${recipientProfile.firstName}, I saw we're both interested in ${bestGround.value[0]}`;

        default:
          return `Hi ${recipientProfile.firstName},`;
      }
    }

    // Fallback to compliment or observation
    if (recipientProfile.recentPosts && recipientProfile.recentPosts.length > 0) {
      const recentPost = recipientProfile.recentPosts[0];
      return `Hi ${recipientProfile.firstName}, I really enjoyed your recent post about ${recentPost.topic}`;
    }

    if (recipientProfile.accomplishments && recipientProfile.accomplishments.length > 0) {
      return `Hi ${recipientProfile.firstName}, congratulations on your recent ${recipientProfile.accomplishments[0].type}`;
    }

    return `Hi ${recipientProfile.firstName},`;
  }

  /**
   * Create message body
   */
  private async createBody(params: {
    recipientProfile: any;
    purpose: string;
    context: any;
    senderProfile: any;
    senderGoals: string[];
    research: any;
    tone: string;
  }): Promise<string> {
    const {
      recipientProfile,
      purpose,
      context,
      senderProfile,
      senderGoals,
      research,
      tone
    } = params;

    // Build message based on purpose
    switch (purpose) {
      case 'networking':
        return await this.createNetworkingBody(params);

      case 'career_advice':
        return await this.createCareerAdviceBody(params);

      case 'collaboration':
        return await this.createCollaborationBody(params);

      case 'mentorship':
        return await this.createMentorshipBody(params);

      case 'job_opportunity':
        return await this.createJobOpportunityBody(params);

      default:
        return await this.createGeneralBody(params);
    }
  }

  /**
   * Create networking message body
   */
  private async createNetworkingBody(params: any): Promise<string> {
    const { senderProfile, recipientProfile, senderGoals } = params;

    const prompt = `
      Write a networking message body connecting these professionals:

      Sender: ${senderProfile.firstName} ${senderProfile.lastName} - ${senderProfile.currentRole}
      Sender Goals: ${senderGoals.join(', ')}

      Recipient: ${recipientProfile.firstName} ${recipientProfile.lastName} - ${recipientProfile.currentRole} at ${recipientProfile.company}

      The message should be professional, genuine, and focused on building a mutually beneficial connection.
    `;

    const llmRequest = {
      prompt,
      context: 'networking_message_body',
      temperature: 0.7,
      maxTokens: 200
    };

    const response = await this.llmService.generateCompletion(llmRequest);
    return response.content || "I'm currently focused on growing my professional network and would love to connect and learn from your experience.";
  }

  /**
   * Create career advice message body
   */
  private async createCareerAdviceBody(params: any): Promise<string> {
    const { senderProfile, recipientProfile, senderGoals } = params;

    return `I'm currently ${senderGoals[0] ? 'working towards ' + senderGoals[0] : 'exploring my career options'} and I'm really impressed by your career path in ${recipientProfile.industry || 'your field'}.

I would greatly value your insights and advice on navigating this industry. Would you be open to a brief chat about your experience?`;
  }

  /**
   * Create collaboration message body
   */
  private async createCollaborationBody(params: any): Promise<string> {
    const { senderProfile, recipientProfile, context } = params;

    return `I've been following your work at ${recipientProfile.company} and I'm particularly interested in ${context.topic || 'your recent projects'}.

I believe there might be opportunities for us to collaborate, as my background in ${senderProfile.skills.join(', ')} could complement your current initiatives. Would you be interested in exploring this further?`;
  }

  /**
   * Create mentorship message body
   */
  private async createMentorshipBody(params: any): Promise<string> {
    const { senderProfile, recipientProfile, senderGoals } = params;

    return `Your career journey and achievements in ${recipientProfile.industry || 'your field'} are truly inspiring. As someone ${senderGoals[0] ? 'looking to ' + senderGoals[0] : 'early in my career'}, I would be honored to learn from your experience.

Would you be open to mentoring me or sharing some guidance on navigating this industry?`;
  }

  /**
   * Create job opportunity message body
   */
  private async createJobOpportunityBody(params: any): Promise<string> {
    const { context, recipientProfile } = params;

    return `I'm reaching out about a ${context.role || 'position'} opportunity that I think would be perfect for you. Given your background and experience at ${recipientProfile.company}, I believe your skills would be an excellent match.

Would you be interested in learning more about this opportunity?`;
  }

  /**
   * Create general message body
   */
  private async createGeneralBody(params: any): Promise<string> {
    const { senderProfile, senderGoals } = params;

    return `I'm currently focused on ${senderGoals[0] || 'professional development'} and I'm looking to connect with professionals who share similar interests and values.

I'd love to learn more about your experience and explore how we might support each other's professional growth.`;
  }

  /**
   * Create call to action
   */
  private async createCallToAction(purpose: string, platform: string, tone: string): Promise<string> {
    const ctas: Record<string, Record<string, string>> = {
      networking: {
        linkedin: "I'd love to connect and follow your journey. Would you be open to connecting?",
        email: "Would you be open to a brief virtual coffee chat in the coming weeks?",
        twitter: "Looking forward to following your work and engaging with your content!"
      },
      career_advice: {
        linkedin: "Would you have 15-20 minutes in the coming weeks for a brief virtual chat?",
        email: "I would be grateful for any insights you could share. Would you be open to a brief call?",
        twitter: "Would love to learn from your experience if you're open to sharing!"
      },
      collaboration: {
        linkedin: "Would you be interested in discussing potential collaboration opportunities?",
        email: "I believe there could be synergies between our work. Would you be open to exploring this?",
        twitter: "Let's connect and discuss how we might work together!"
      },
      mentorship: {
        linkedin: "Would you be open to mentoring me or sharing some career guidance?",
        email: "I would be honored to learn from your experience. Would you consider being a mentor?",
        twitter: "Looking up to your leadership and would love to learn from you!"
      },
      job_opportunity: {
        linkedin: "Would you be interested in hearing more about this opportunity?",
        email: "I have an opportunity that might interest you. Would you like to discuss further?",
        twitter: "Great opportunity that might be perfect for you - DM if interested!"
      }
    };

    return ctas[purpose]?.[platform] || "I look forward to connecting with you!";
  }

  /**
   * Create message closing
   */
  private async createClosing(tone: string, senderProfile: any): Promise<string> {
    const closings: Record<string, string> = {
      professional: "Best regards,",
      casual: "Best,",
      formal: "Sincerely,",
      friendly: "Looking forward to connecting,"
    };

    const closing = closings[tone] || "Best regards,";
    return `${closing}\n\n${senderProfile.firstName} ${senderProfile.lastName}`;
  }

  /**
   * Optimize message for platform
   */
  private optimizeForPlatform(message: any, platform: string): any {
    switch (platform) {
      case 'linkedin':
        return this.optimizeForLinkedIn(message);

      case 'twitter':
        return this.optimizeForTwitter(message);

      case 'email':
        return this.optimizeForEmail(message);

      default:
        return message;
    }
  }

  /**
   * Optimize for LinkedIn
   */
  private optimizeForLinkedIn(message: any): any {
    // LinkedIn allows longer form content
    return {
      ...message,
      content: message.content,
      tips: [
        ...message.tips,
        "Keep message under 300 characters for connection requests",
        "Use LinkedIn's character limit effectively",
        "Include relevant hashtags if appropriate"
      ]
    };
  }

  /**
   * Optimize for Twitter
   */
  private optimizeForTwitter(message: any): any {
    // Twitter has character limits
    const truncated = message.content.length > 280
      ? message.content.substring(0, 270) + "..."
      : message.content;

    return {
      ...message,
      content: truncated,
      tips: [
        ...message.tips,
        "Keep under 280 characters",
        "Use relevant hashtags",
        "Tag the person if appropriate"
      ]
    };
  }

  /**
   * Optimize for Email
   */
  private optimizeForEmail(message: any): any {
    return {
      ...message,
      content: message.content,
      tips: [
        ...message.tips,
        "Keep subject line compelling but professional",
        "Use professional email signature",
        "Consider best sending times"
      ]
    };
  }

  /**
   * Generate subject line
   */
  private async generateSubjectLine(recipientProfile: any, purpose: string, tone: string): Promise<string> {
    const subjectTemplates: Record<string, string[]> = {
      networking: [
        "Connection from fellow [industry] professional",
        "Let's connect professionally",
        "Following your work at [company]"
      ],
      career_advice: [
        "Seeking career advice from [industry] leader",
        "Question about career path in [industry]",
        "Would value your insights on [topic]"
      ],
      collaboration: [
        "Potential collaboration opportunity",
        "Synergy between our work in [field]",
        "Exploring collaboration possibilities"
      ],
      mentorship: [
        "Mentorship request from aspiring [role]",
        "Learning from your [industry] experience",
        "Seeking guidance from [role]"
      ],
      job_opportunity: [
        "Exciting opportunity for [role]",
        "Role that matches your background",
        "Career opportunity you might be interested in"
      ]
    };

    const templates = subjectTemplates[purpose] || subjectTemplates.networking;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
      .replace('[industry]', recipientProfile.industry || 'your industry')
      .replace('[company]', recipientProfile.company || 'your company')
      .replace('[field]', recipientProfile.field || 'your field')
      .replace('[role]', recipientProfile.currentRole || 'your role')
      .replace('[topic]', recipientProfile.specialty || 'your specialty');
  }

  /**
   * Check if platform needs subject line
   */
  private needsSubjectLine(platform: string): boolean {
    return platform === 'email';
  }

  /**
   * Generate follow-up message
   */
  private async generateFollowUpMessage(
    originalMessage: OutreachMessage,
    recipient: any,
    type: string
  ): Promise<string> {
    switch (type) {
      case 'gentle':
        return `Hi ${recipient.firstName}, just wanted to follow up on my previous message. I understand you're busy, but I'd really value the chance to connect when you have a moment.`;

      case 'value_add':
        return `Hi ${recipient.firstName}, I came across this article about [relevant topic] and thought you might find it interesting given your work in [recipient.field]. Hope you're having a great week!`;

      case 'final':
        return `Hi ${recipient.firstName}, I'll stop bothering you, but I wanted to say I really admire your work and hope our paths cross in the future. Wishing you all the best!`;

      default:
        return `Hi ${recipient.firstName}, just wanted to follow up briefly. Hope you're having a great week!`;
    }
  }

  /**
   * Determine follow-up timing
   */
  private determineFollowUpTiming(purpose: string, platform: string): string {
    const timingMap: Record<string, Record<string, string>> = {
      networking: {
        linkedin: '1 week',
        email: '3-5 days',
        twitter: '2-3 days'
      },
      career_advice: {
        linkedin: '1 week',
        email: '1 week',
        twitter: '3-4 days'
      },
      job_opportunity: {
        linkedin: '3-5 days',
        email: '2-3 days',
        twitter: '1-2 days'
      }
    };

    return timingMap[purpose]?.[platform] || '1 week';
  }

  /**
   * Calculate message effectiveness
   */
  private calculateEffectiveness(commonGround: any[], purpose: string, tone: string): number {
    let score = 0.5; // Base score

    // Boost for strong common ground
    if (commonGround.some(g => g.strength === 'high')) {
      score += 0.2;
    }

    // Boost for appropriate tone
    if (tone === 'professional') {
      score += 0.1;
    }

    // Boost for clear purpose
    if (['networking', 'career_advice', 'collaboration'].includes(purpose)) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Identify message template
   */
  private identifyTemplate(purpose: string, tone: string): string {
    return `${purpose}_${tone}`;
  }

  /**
   * Generate message tips
   */
  private async generateMessageTips(recipientProfile: any, platform: string, purpose: string): Promise<string[]> {
    const baseTips = [
      "Personalize the message based on recipient's profile",
      "Keep it concise and focused on them",
      "Be genuine and authentic",
      "End with a clear but not demanding call to action"
    ];

    const platformTips: Record<string, string[]> = {
      linkedin: [
        "Research their recent posts and activity",
        "Check for mutual connections",
        "Keep connection request messages under 300 characters"
      ],
      email: [
        "Use a professional email address",
        "Include a clear subject line",
        "Consider the best time to send (often Tuesday-Thursday morning)"
      ],
      twitter: [
        "Keep it brief due to character limits",
        "Use relevant hashtags",
        "Consider replying to a tweet rather than DM initially"
      ]
    };

    const purposeTips: Record<string, string[]> = {
      career_advice: [
        "Be specific about what advice you're seeking",
        "Show you've done your research on them",
        "Be respectful of their time"
      ],
      collaboration: [
        "Clearly state potential mutual benefits",
        "Be specific about collaboration ideas",
        "Show relevant examples of your work"
      ],
      mentorship: [
        "Express genuine admiration for their work",
        "Be clear about what you're seeking",
        "Respect their decision if they decline"
      ]
    };

    return [
      ...baseTips,
      ...(platformTips[platform] || []),
      ...(purposeTips[purpose] || [])
    ];
  }

  /**
   * Find shared connections
   */
  private findSharedConnections(senderProfile: any, recipientProfile: any): any[] {
    const senderConnections = senderProfile.connections || [];
    const recipientConnections = recipientProfile.connections || [];

    return senderConnections.filter((conn: any) =>
      recipientConnections.some((rConn: any) => rConn.id === conn.id)
    );
  }

  /**
   * Find shared education
   */
  private findSharedEducation(senderProfile: any, recipientProfile: any): any[] {
    const senderEducation = senderProfile.education || [];
    const recipientEducation = recipientProfile.education || [];

    return senderEducation.filter((edu: any) =>
      recipientEducation.some((rEdu: any) =>
        rEdu.institution === edu.institution || rEdu.degree === edu.degree
      )
    );
  }

  /**
   * Find shared experience
   */
  private findSharedExperience(senderProfile: any, recipientProfile: any): any[] {
    const senderExperience = senderProfile.experience || [];
    const recipientExperience = recipientProfile.experience || [];

    const shared = [];
    for (const senderExp of senderExperience) {
      for (const recipientExp of recipientExperience) {
        if (senderExp.company === recipientExp.company) {
          shared.push(`Worked at ${senderExp.company}`);
        }
        if (senderExp.industry === recipientExp.industry) {
          shared.push(`Experience in ${senderExp.industry}`);
        }
        if (senderExp.role === recipientExp.role) {
          shared.push(`Similar role as ${senderExp.role}`);
        }
      }
    }

    return [...new Set(shared)];
  }

  /**
   * Find shared interests
   */
  private findSharedInterests(senderProfile: any, recipientProfile: any): string[] {
    const senderInterests = senderProfile.interests || [];
    const recipientInterests = recipientProfile.interests || [];

    return senderInterests.filter((interest: string) =>
      recipientInterests.includes(interest)
    );
  }

  /**
   * Select best common ground for opening
   */
  private selectBestCommonGround(commonGround: any[]): any[] {
    return commonGround.sort((a, b) => {
      const strengthOrder = { high: 3, medium: 2, low: 1 };
      const typeOrder = { connections: 4, education: 3, experience: 2, interests: 1 };

      const strengthDiff = strengthOrder[b.strength] - strengthOrder[a.strength];
      if (strengthDiff !== 0) return strengthDiff;

      return typeOrder[b.type] - typeOrder[a.type];
    });
  }
}