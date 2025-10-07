/**
 * Authentication configuration for NextAuth.js
 * Provides credential-based authentication with role-based access control
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await db.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              jobSeekerProfile: true,
              employerProfile: true,
              adminProfile: true
            }
          })

          if (!user || !user.passwordHash) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          if (!user.isActive) {
            throw new Error('Account is deactivated')
          }

          // Update last login
          await db.user.update({
            where: { uid: user.uid },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            jobSeekerProfile: user.jobSeekerProfile,
            employerProfile: user.employerProfile,
            adminProfile: user.adminProfile
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.role = user.role
          token.jobSeekerProfile = user.jobSeekerProfile
          token.employerProfile = user.employerProfile
          token.adminProfile = user.adminProfile
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.sub || ''
          session.user.role = (token.role as string) || ''
          session.user.jobSeekerProfile = token.jobSeekerProfile || null
          session.user.employerProfile = token.employerProfile || null
          session.user.adminProfile = token.adminProfile || null
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
}