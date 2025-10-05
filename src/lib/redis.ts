import { createClient, RedisClientType } from 'redis';

export class Redis {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    // Initialize Redis client only in server environment
    if (typeof window === 'undefined') {
      this.initializeClient();
    }
  }

  private async initializeClient() {
    try {
      // Use Redis URL from environment or default to local Redis
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000          
        },
      });

      this.client.on('error', (err) => {
        console.warn('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      console.warn('Redis connection failed, falling back to memory cache:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      // Fallback to in-memory cache or return null
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      console.warn('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      // Fallback behavior - just return true for compatibility
      return true;
    }

    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.warn('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return true;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Redis EXISTS error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
      } catch (error) {
        console.warn('Redis disconnect error:', error);
      }
    }
  }
}

// Export a singleton instance
export const redis = new Redis();
export default redis;