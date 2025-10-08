import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface MatchUpdateData {
  userId: string;
  type: 'seeker' | 'employer';
  matchId: string;
  action: 'new' | 'updated' | 'removed';
  data?: any;
  score?: number;
}

interface MatchPreferenceUpdate {
  userId: string;
  preferences: any;
}

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    console.log('Setting up Matching WebSocket server...');

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/matching/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3010",
        methods: ["GET", "POST"]
      }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        // Verify token with NextAuth
        // For now, we'll use a simple verification
        if (!token) {
          return next(new Error('Authentication error'));
        }

        // Get user from database (simplified)
        const userId = socket.handshake.auth.userId;
        if (!userId) {
          return next(new Error('User ID required'));
        }

        socket.data.userId = userId;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    io.on('connection', (socket) => {
      const userId = socket.data.userId;
      console.log(`User ${userId} connected to matching service`);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Handle matching preferences updates
      socket.on('update_preferences', async (preferences: any) => {
        try {
          await prisma.matchingPreference.upsert({
            where: { userId },
            update: preferences,
            create: { userId, ...preferences }
          });

          // Trigger immediate match refresh
          socket.emit('preferences_updated', { success: true });

          // Broadcast to user's other sessions
          socket.to(`user:${userId}`).emit('preferences_updated', preferences);
        } catch (error) {
          socket.emit('error', { message: 'Failed to update preferences' });
        }
      });

      // Handle match requests
      socket.on('request_matches', async (data: { type: 'seeker' | 'employer', limit?: number, offset?: number }) => {
        try {
          const { type, limit = 20, offset = 0 } = data;

          // Get user profile
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              jobSeekerProfile: true,
              employerProfile: true,
            }
          });

          if (!user) {
            socket.emit('error', { message: 'User not found' });
            return;
          }

          let matches;
          if (type === 'seeker' && user.jobSeekerProfile) {
            matches = await getJobSeekerMatches(user.jobSeekerProfile.id, limit, offset);
          } else if (type === 'employer' && user.employerProfile) {
            matches = await getEmployerMatches(user.employerProfile.id, limit, offset);
          } else {
            socket.emit('error', { message: 'Invalid user profile for matching type' });
            return;
          }

          socket.emit('matches_received', {
            matches,
            type,
            hasMore: matches.length === limit,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to fetch matches' });
        }
      });

      // Handle match actions
      socket.on('save_match', async (data: { matchId: string, type: 'seeker' | 'employer' }) => {
        try {
          const { matchId, type } = data;

          if (type === 'seeker') {
            await prisma.savedJob.upsert({
              where: {
                userId_jobId: { userId, jobId: matchId }
              },
              update: {},
              create: { userId, jobId: matchId }
            });
          } else {
            await prisma.savedCandidate.upsert({
              where: {
                employerId_candidateId: { employerId: userId, candidateId: matchId }
              },
              update: {},
              create: { employerId: userId, candidateId: matchId }
            });
          }

          socket.emit('match_saved', { matchId, type, success: true });
        } catch (error) {
          socket.emit('error', { message: 'Failed to save match' });
        }
      });

      socket.on('reject_match', async (data: { matchId: string, type: 'seeker' | 'employer', reason?: string }) => {
        try {
          const { matchId, type, reason } = data;

          if (type === 'seeker') {
            await prisma.rejectedJob.upsert({
              where: {
                userId_jobId: { userId, jobId: matchId }
              },
              update: { reason },
              create: { userId, jobId: matchId, reason }
            });
          } else {
            await prisma.rejectedCandidate.upsert({
              where: {
                employerId_candidateId: { employerId: userId, candidateId: matchId }
              },
              update: { reason },
              create: { employerId: userId, candidateId: matchId, reason }
            });
          }

          socket.emit('match_rejected', { matchId, type, success: true });
        } catch (error) {
          socket.emit('error', { message: 'Failed to reject match' });
        }
      });

      // Handle real-time match notifications
      socket.on('subscribe_to_notifications', () => {
        socket.join(`notifications:${userId}`);
        socket.emit('notification_subscribed', { success: true });
      });

      // Handle match analytics requests
      socket.on('request_analytics', async (data: { type: 'seeker' | 'employer', timeframe: string }) => {
        try {
          const analytics = await getMatchingAnalytics(userId, data.type, data.timeframe);
          socket.emit('analytics_received', analytics);
        } catch (error) {
          socket.emit('error', { message: 'Failed to fetch analytics' });
        }
      });

      // Disconnect handling
      socket.on('disconnect', (reason) => {
        console.log(`User ${userId} disconnected from matching service: ${reason}`);
      });
    });

    // Set up periodic match refresh for active users
    setInterval(async () => {
      const activeSockets = await io.in('active_users').fetchSockets();

      for (const socket of activeSockets) {
        const userId = socket.data.userId;

        // Check if user has new matches
        const hasNewMatches = await checkForNewMatches(userId);

        if (hasNewMatches) {
          socket.emit('new_matches_available', {
            message: 'New matches found!',
            timestamp: new Date().toISOString()
          });
        }
      }
    }, 60000); // Check every minute

    res.socket.server.io = io;
  }

  res.end();
}

// Helper functions (simplified versions of the API functions)
async function getJobSeekerMatches(jobSeekerProfileId: string, limit: number, offset: number) {
  // Implementation similar to the API route but simplified for real-time
  // This would use the same matching algorithms
  return [];
}

async function getEmployerMatches(employerProfileId: string, limit: number, offset: number) {
  // Implementation similar to the API route but simplified for real-time
  return [];
}

async function checkForNewMatches(userId: string): Promise<boolean> {
  // Check if there are new matches since user's last check
  const lastMatch = await prisma.matchingPreference.findUnique({
    where: { userId },
    select: { lastMatchAt: true }
  });

  if (!lastMatch?.lastMatchAt) return false;

  // Check for new jobs/candidates since last match
  const timeThreshold = lastMatch.lastMatchAt;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user) return false;

  if (user.role === 'SEEKER') {
    const newJobsCount = await prisma.job.count({
      where: {
        createdAt: { gt: timeThreshold },
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      }
    });
    return newJobsCount > 0;
  } else if (user.role === 'EMPLOYER') {
    const newCandidatesCount = await prisma.user.count({
      where: {
        role: 'SEEKER',
        createdAt: { gt: timeThreshold },
        jobSeekerProfile: { isNotNull: true }
      }
    });
    return newCandidatesCount > 0;
  }

  return false;
}

async function getMatchingAnalytics(userId: string, type: string, timeframe: string) {
  // Return analytics data based on timeframe
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (type === 'seeker') {
    const [totalMatches, savedJobs, applications] = await Promise.all([
      prisma.savedJob.count({
        where: { userId, createdAt: { gte: startDate } }
      }),
      prisma.savedJob.count({
        where: { userId, createdAt: { gte: startDate } }
      }),
      prisma.application.count({
        where: { userId, createdAt: { gte: startDate } }
      })
    ]);

    return {
      totalMatches,
      savedJobs,
      applications,
      conversionRate: totalMatches > 0 ? (applications / totalMatches) * 100 : 0,
      timeframe
    };
  } else {
    const [totalMatches, savedCandidates, views] = await Promise.all([
      prisma.savedCandidate.count({
        where: { employerId: userId, createdAt: { gte: startDate } }
      }),
      prisma.savedCandidate.count({
        where: { employerId: userId, createdAt: { gte: startDate } }
      }),
      // This would need to be implemented based on job view tracking
      0
    ]);

    return {
      totalMatches,
      savedCandidates,
      views,
      saveRate: totalMatches > 0 ? (savedCandidates / totalMatches) * 100 : 0,
      timeframe
    };
  }
}

// Export a function to broadcast match updates from other parts of the application
export function broadcastMatchUpdate(io: ServerIO, data: MatchUpdateData) {
  io.to(`user:${data.userId}`).emit('match_update', {
    type: data.action,
    matchId: data.matchId,
    matchType: data.type,
    data: data.data,
    score: data.score,
    timestamp: new Date().toISOString()
  });
}

// Export a function to broadcast preference updates
export function broadcastPreferenceUpdate(io: ServerIO, data: MatchPreferenceUpdate) {
  io.to(`user:${data.userId}`).emit('preferences_updated', {
    preferences: data.preferences,
    timestamp: new Date().toISOString()
  });
}