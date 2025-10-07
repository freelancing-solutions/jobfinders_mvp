/**
 * Database configuration and Prisma client initialization
 * Provides a singleton Prisma client instance for database operations
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

// Export prisma as an alias for db for backward compatibility
export const prisma = db

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}