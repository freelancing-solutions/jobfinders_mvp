export interface JobSeekerProfile {
  userUid: string
  professionalTitle?: string
  summary?: string
  skills?: string[]
  experienceYears?: number
  location?: string
  phone?: string
  website?: string
  linkedin?: string
  github?: string
  portfolioLinks?: string[]
  remoteWorkPreference?: boolean
  salaryExpectationMin?: number
  salaryExpectationMax?: number
  currency: string
  availability?: string
  resumeFileUrl?: string
}