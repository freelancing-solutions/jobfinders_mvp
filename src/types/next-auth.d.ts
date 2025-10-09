import 'next-auth'
import { DefaultSession } from 'next-auth'
import { UserRole } from '@/types/roles'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}
