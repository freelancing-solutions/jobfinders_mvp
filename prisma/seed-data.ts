import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.savedJob.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.match.deleteMany()
  await prisma.job.deleteMany()
  await prisma.jobCategory.deleteMany()
  await prisma.company.deleteMany()
  await prisma.employerProfile.deleteMany()
  await prisma.jobSeekerProfile.deleteMany()
  await prisma.adminProfile.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️ Cleared existing data')

  // Create Job Categories
  const categories = await Promise.all([
    prisma.jobCategory.create({
      data: {
        name: 'Technology',
        slug: 'technology',
        icon: '💻',
        color: '#3B82F6',
        description: 'Software development, IT, and tech roles'
      }
    }),
    prisma.jobCategory.create({
      data: {
        name: 'Marketing',
        slug: 'marketing',
        icon: '📈',
        color: '#10B981',
        description: 'Digital marketing, content, and brand management'
      }
    }),
    prisma.jobCategory.create({
      data: {
        name: 'Design',
        slug: 'design',
        icon: '🎨',
        color: '#8B5CF6',
        description: 'UI/UX, graphic design, and creative roles'
      }
    }),
    prisma.jobCategory.create({
      data: {
        name: 'Sales',
        slug: 'sales',
        icon: '💼',
        color: '#F59E0B',
        description: 'Sales representatives, account managers, and business development'
      }
    }),
    prisma.jobCategory.create({
      data: {
        name: 'Finance',
        slug: 'finance',
        icon: '💰',
        color: '#06B6D4',
        description: 'Accounting, financial analysis, and banking'
      }
    }),
    prisma.jobCategory.create({
      data: {
        name: 'Healthcare',
        slug: 'healthcare',
        icon: '🏥',
        color: '#EF4444',
        description: 'Medical professionals and healthcare support'
      }
    })
  ])

  console.log(`✅ Created ${categories.length} job categories`)

  // Create Companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp Solutions',
        description: 'Leading software development company specializing in enterprise solutions',
        industry: 'Technology',
        website: 'https://techcorp.example.com',
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        contactEmail: 'careers@techcorp.example.com',
        phoneNumber: '+27 11 123 4567',
        employeeCount: 500,
        foundedYear: 2010,
        techStack: ['React', 'Node.js', 'Python', 'AWS'],
        linkedinUrl: 'https://linkedin.com/company/techcorp',
        isVerified: true,
        verificationStatus: 'verified'
      }
    }),
    prisma.company.create({
      data: {
        name: 'Digital Marketing Pro',
        description: 'Full-service digital marketing agency helping brands grow online',
        industry: 'Marketing',
        website: 'https://digitalmarketingpro.example.com',
        city: 'Cape Town',
        province: 'Western Cape',
        country: 'South Africa',
        contactEmail: 'jobs@digitalmarketingpro.example.com',
        phoneNumber: '+27 21 987 6543',
        employeeCount: 50,
        foundedYear: 2018,
        techStack: ['Google Ads', 'Facebook Ads', 'SEO', 'Content Marketing'],
        linkedinUrl: 'https://linkedin.com/company/digitalmarketingpro',
        isVerified: true,
        verificationStatus: 'verified'
      }
    }),
    prisma.company.create({
      data: {
        name: 'Creative Studio',
        description: 'Award-winning design studio creating beautiful digital experiences',
        industry: 'Design',
        website: 'https://creativestudio.example.com',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        country: 'South Africa',
        contactEmail: 'careers@creativestudio.example.com',
        phoneNumber: '+27 31 456 7890',
        employeeCount: 25,
        foundedYear: 2015,
        techStack: ['Figma', 'Adobe Creative Suite', 'Sketch', 'Principle'],
        linkedinUrl: 'https://linkedin.com/company/creativestudio',
        isVerified: false,
        verificationStatus: 'pending'
      }
    }),
    prisma.company.create({
      data: {
        name: 'FinanceHub',
        description: 'Financial services company providing innovative banking solutions',
        industry: 'Finance',
        website: 'https://financehub.example.com',
        city: 'Pretoria',
        province: 'Gauteng',
        country: 'South Africa',
        contactEmail: 'recruitment@financehub.example.com',
        phoneNumber: '+27 12 345 6789',
        employeeCount: 200,
        foundedYear: 2012,
        techStack: ['Java', 'Spring Boot', 'Oracle', 'Blockchain'],
        linkedinUrl: 'https://linkedin.com/company/financehub',
        isVerified: true,
        verificationStatus: 'verified'
      }
    })
  ])

  console.log(`✅ Created ${companies.length} companies`)

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10)

  const jobSeekers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        passwordHash: hashedPassword,
        name: 'John Doe',
        role: 'seeker',
        isActive: true,
        jobSeekerProfile: {
          create: {
            professionalTitle: 'Senior Software Engineer',
            summary: 'Experienced software engineer with 8+ years in full-stack development. Passionate about creating scalable solutions and mentoring junior developers.',
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
            experienceYears: 8,
            location: 'Johannesburg, Gauteng',
            phone: '+27 83 123 4567',
            website: 'https://johndoe.dev',
            linkedin: 'https://linkedin.com/in/johndoe',
            github: 'https://github.com/johndoe',
            portfolioLinks: ['https://johndoe.dev', 'https://github.com/johndoe'],
            remoteWorkPreference: true,
            salaryExpectationMin: 800000,
            salaryExpectationMax: 1200000,
            currency: 'ZAR',
            availability: '2_weeks'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        passwordHash: hashedPassword,
        name: 'Jane Smith',
        role: 'seeker',
        isActive: true,
        jobSeekerProfile: {
          create: {
            professionalTitle: 'UX/UI Designer',
            summary: 'Creative UX/UI designer with 5 years of experience in user-centered design. Skilled in creating intuitive digital experiences.',
            skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Design Systems'],
            experienceYears: 5,
            location: 'Cape Town, Western Cape',
            phone: '+27 82 987 6543',
            website: 'https://janesmith.design',
            linkedin: 'https://linkedin.com/in/janesmith',
            portfolioLinks: ['https://janesmith.design', 'https://behance.net/janesmith'],
            remoteWorkPreference: true,
            salaryExpectationMin: 600000,
            salaryExpectationMax: 900000,
            currency: 'ZAR',
            availability: 'immediate'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'mike.wilson@example.com',
        passwordHash: hashedPassword,
        name: 'Mike Wilson',
        role: 'seeker',
        isActive: true,
        jobSeekerProfile: {
          create: {
            professionalTitle: 'Digital Marketing Manager',
            summary: 'Results-driven marketing professional with expertise in digital campaigns and brand strategy.',
            skills: ['Google Ads', 'Facebook Ads', 'SEO', 'Content Marketing', 'Analytics', 'Email Marketing'],
            experienceYears: 6,
            location: 'Durban, KwaZulu-Natal',
            phone: '+27 81 456 7890',
            linkedin: 'https://linkedin.com/in/mikewilson',
            remoteWorkPreference: false,
            salaryExpectationMin: 500000,
            salaryExpectationMax: 750000,
            currency: 'ZAR',
            availability: '1_month'
          }
        }
      }
    })
  ])

  const employers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'employer@techcorp.example.com',
        passwordHash: hashedPassword,
        name: 'Sarah Johnson',
        role: 'employer',
        isActive: true,
        employerProfile: {
          create: {
            companyId: companies[0].companyId,
            isVerified: true,
            isAdmin: true,
            fullName: 'Sarah Johnson',
            jobTitle: 'HR Manager',
            companyEmail: 'sarah.johnson@techcorp.example.com',
            phoneNumber: '+27 83 111 2222',
            linkedinUrl: 'https://linkedin.com/in/sarahjohnson'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'employer@digitalmarketingpro.example.com',
        passwordHash: hashedPassword,
        name: 'Tom Brown',
        role: 'employer',
        isActive: true,
        employerProfile: {
          create: {
            companyId: companies[1].companyId,
            isVerified: true,
            isAdmin: true,
            fullName: 'Tom Brown',
            jobTitle: 'Recruitment Specialist',
            companyEmail: 'tom.brown@digitalmarketingpro.example.com',
            phoneNumber: '+27 82 333 4444',
            linkedinUrl: 'https://linkedin.com/in/tombrown'
          }
        }
      }
    })
  ])

  const admin = await prisma.user.create({
    data: {
      email: 'admin@jobfinders.example.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      isActive: true,
      adminProfile: {
        create: {
          permissions: ['user_management', 'job_management', 'company_management', 'analytics', 'system_settings']
        }
      }
    }
  })

  console.log(`✅ Created ${jobSeekers.length} job seekers, ${employers.length} employers, and 1 admin`)

  // Create Jobs
  const employerProfiles = await prisma.employerProfile.findMany()
  
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Full Stack Developer',
        companyId: companies[0].companyId,
        employerId: employerProfiles[0].employerId,
        categoryId: categories[0].categoryId,
        description: 'We are looking for an experienced Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.',
        requirements: {
          required: ['5+ years of experience', 'Proficiency in React and Node.js', 'Experience with cloud platforms'],
          preferred: ['AWS certification', 'Microservices experience', 'Team leadership'],
          education: 'Bachelor\'s degree in Computer Science or related field'
        },
        location: 'Johannesburg, Gauteng',
        salary: {
          min: 800000,
          max: 1200000,
          currency: 'ZAR',
          type: 'annual'
        },
        status: 'PUBLISHED',
        isRemote: true,
        experienceLevel: 'senior',
        employmentType: 'full-time',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    }),
    prisma.job.create({
      data: {
        title: 'UX/UI Designer',
        companyId: companies[2].companyId,
        employerId: employerProfiles[1].employerId,
        categoryId: categories[2].categoryId,
        description: 'Join our creative team as a UX/UI Designer. You will be responsible for creating beautiful and intuitive user interfaces for web and mobile applications.',
        requirements: {
          required: ['3+ years of UX/UI design experience', 'Proficiency in Figma', 'Strong portfolio'],
          preferred: ['Experience with design systems', 'Animation skills', 'Mobile app design'],
          education: 'Degree in Design or related field'
        },
        location: 'Durban, KwaZulu-Natal',
        salary: {
          min: 500000,
          max: 750000,
          currency: 'ZAR',
          type: 'annual'
        },
        status: 'PUBLISHED',
        isRemote: false,
        experienceLevel: 'mid',
        employmentType: 'full-time',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }),
    prisma.job.create({
      data: {
        title: 'Digital Marketing Specialist',
        companyId: companies[1].companyId,
        employerId: employerProfiles[1].employerId,
        categoryId: categories[1].categoryId,
        description: 'We are seeking a talented Digital Marketing Specialist to develop and implement our digital marketing strategies.',
        requirements: {
          required: ['3+ years of digital marketing experience', 'Google Ads certification', 'Analytics experience'],
          preferred: ['Social media marketing', 'Content creation', 'SEO/SEM knowledge'],
          education: 'Degree in Marketing or related field'
        },
        location: 'Cape Town, Western Cape',
        salary: {
          min: 400000,
          max: 600000,
          currency: 'ZAR',
          type: 'annual'
        },
        status: 'PUBLISHED',
        isRemote: true,
        experienceLevel: 'mid',
        employmentType: 'full-time',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }),
    prisma.job.create({
      data: {
        title: 'Junior Software Developer',
        companyId: companies[0].companyId,
        employerId: employerProfiles[0].employerId,
        categoryId: categories[0].categoryId,
        description: 'Looking for a passionate Junior Software Developer to join our team. Great opportunity to learn and grow with experienced mentors.',
        requirements: {
          required: ['1+ years of development experience', 'Knowledge of JavaScript', 'Computer Science degree'],
          preferred: ['Internship experience', 'Open source contributions', 'React knowledge'],
          education: 'Bachelor\'s degree in Computer Science'
        },
        location: 'Johannesburg, Gauteng',
        salary: {
          min: 300000,
          max: 450000,
          currency: 'ZAR',
          type: 'annual'
        },
        status: 'PUBLISHED',
        isRemote: false,
        experienceLevel: 'entry',
        employmentType: 'full-time',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }),
    prisma.job.create({
      data: {
        title: 'Financial Analyst',
        companyId: companies[3].companyId,
        employerId: employerProfiles[0].employerId,
        categoryId: categories[4].categoryId,
        description: 'Join our finance team as a Financial Analyst. You will be responsible for financial planning, analysis, and reporting.',
        requirements: {
          required: ['3+ years of financial analysis experience', 'Strong Excel skills', 'Accounting knowledge'],
          preferred: ['CPA certification', 'Experience with financial software', 'Modeling skills'],
          education: 'Degree in Finance or Accounting'
        },
        location: 'Pretoria, Gauteng',
        salary: {
          min: 450000,
          max: 650000,
          currency: 'ZAR',
          type: 'annual'
        },
        status: 'PUBLISHED',
        isRemote: false,
        experienceLevel: 'mid',
        employmentType: 'full-time',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }),
    prisma.job.create({
      data: {
        title: 'Sales Representative',
        companyId: companies[1].companyId,
        employerId: employerProfiles[1].employerId,
        categoryId: categories[3].categoryId,
        description: 'We are looking for an energetic Sales Representative to drive sales growth and build client relationships.',
        requirements: {
          required: ['2+ years of sales experience', 'Excellent communication skills', 'Valid driver\'s license'],
          preferred: ['B2B sales experience', 'CRM knowledge', 'Digital marketing understanding'],
          education: 'High school diploma, degree preferred'
        },
        location: 'Cape Town, Western Cape',
        salary: {
          min: 250000,
          max: 400000,
          currency: 'ZAR',
          type: 'annual'
        },
        status: 'PUBLISHED',
        isRemote: false,
        experienceLevel: 'entry',
        employmentType: 'full-time',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  ])

  console.log(`✅ Created ${jobs.length} job postings`)

  // Create Job Applications
  const applications = await Promise.all([
    prisma.jobApplication.create({
      data: {
        jobId: jobs[0].jobId,
        jobSeekerProfileId: jobSeekers[0].uid,
        coverLetter: 'I am excited to apply for the Senior Full Stack Developer position. With my 8 years of experience in full-stack development, I believe I would be a great fit for your team.',
        status: 'APPLIED',
        matchScore: 0.85
      }
    }),
    prisma.jobApplication.create({
      data: {
        jobId: jobs[1].jobId,
        jobSeekerProfileId: jobSeekers[1].uid,
        coverLetter: 'As a passionate UX/UI designer with 5 years of experience, I was thrilled to see this opportunity. My portfolio showcases my ability to create user-centered designs.',
        status: 'REVIEWING',
        matchScore: 0.92
      }
    }),
    prisma.jobApplication.create({
      data: {
        jobId: jobs[2].jobId,
        jobSeekerProfileId: jobSeekers[2].uid,
        coverLetter: 'I am excited about the Digital Marketing Specialist position at your company. My experience with Google Ads and social media marketing aligns perfectly with your requirements.',
        status: 'SHORTLISTED',
        matchScore: 0.78
      }
    })
  ])

  console.log(`✅ Created ${applications.length} job applications`)

  // Create Saved Jobs
  const savedJobs = await Promise.all([
    prisma.savedJob.create({
      data: {
        jobSeekerProfileId: jobSeekers[0].uid,
        jobId: jobs[2].jobId,
        notes: 'Interesting remote opportunity'
      }
    }),
    prisma.savedJob.create({
      data: {
        jobSeekerProfileId: jobSeekers[1].uid,
        jobId: jobs[0].jobId,
        notes: 'Great company culture'
      }
    })
  ])

  console.log(`✅ Created ${savedJobs.length} saved jobs`)

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Job Categories: ${categories.length}`)
  console.log(`   - Companies: ${companies.length}`)
  console.log(`   - Users: ${jobSeekers.length + employers.length + 1} (job seekers: ${jobSeekers.length}, employers: ${employers.length}, admin: 1)`)
  console.log(`   - Jobs: ${jobs.length}`)
  console.log(`   - Applications: ${applications.length}`)
  console.log(`   - Saved Jobs: ${savedJobs.length}`)
  console.log('\n🔑 Test Accounts:')
  console.log('   Job Seeker: john.doe@example.com / password123')
  console.log('   Job Seeker: jane.smith@example.com / password123')
  console.log('   Job Seeker: mike.wilson@example.com / password123')
  console.log('   Employer: employer@techcorp.example.com / password123')
  console.log('   Employer: employer@digitalmarketingpro.example.com / password123')
  console.log('   Admin: admin@jobfinders.example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })