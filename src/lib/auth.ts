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
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.jobSeekerProfile = user.jobSeekerProfile
        token.employerProfile = user.employerProfile
        token.adminProfile = user.adminProfile
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.jobSeekerProfile = token.jobSeekerProfile
        session.user.employerProfile = token.employerProfile
        session.user.adminProfile = token.adminProfile
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
}