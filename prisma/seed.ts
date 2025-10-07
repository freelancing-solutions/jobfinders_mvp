import { db } from '../src/lib/db'
import { JobStatus, ApplicationStatus } from '@prisma/client'

async function main() {
  console.log('Seeding database...')

  // Create job categories
  const categories = await Promise.all([
    db.jobCategory.upsert({
      where: { name: 'Technology' },
      update: {},
      create: {
        name: 'Technology',
        slug: 'technology',
        icon: '💻',
        color: 'bg-blue-100 text-blue-800'
      }
    }),
    db.jobCategory.upsert({
      where: { name: 'Marketing' },
      update: {},
      create: {
        name: 'Marketing',
        slug: 'marketing',
        icon: '📈',
        color: 'bg-green-100 text-green-800'
      }
    }),
    db.jobCategory.upsert({
      where: { name: 'Design' },
      update: {},
      create: {
        name: 'Design',
        slug: 'design',
        icon: '🎨',
        color: 'bg-purple-100 text-purple-800'
      }
    }),
    db.jobCategory.upsert({
      where: { name: 'Sales' },
      update: {},
      create: {
        name: 'Sales',
        slug: 'sales',
        icon: '💼',
        color: 'bg-orange-100 text-orange-800'
      }
    }),
    db.jobCategory.upsert({
      where: { name: 'Finance' },
      update: {},
      create: {
        name: 'Finance',
        slug: 'finance',
        icon: '💰',
        color: 'bg-yellow-100 text-yellow-800'
      }
    }),
    db.jobCategory.upsert({
      where: { name: 'Healthcare' },
      update: {},
      create: {
        name: 'Healthcare',
        slug: 'healthcare',
        icon: '🏥',
        color: 'bg-red-100 text-red-800'
      }
    })
  ])

  // Create companies
  const companies = await Promise.all([
    db.company.upsert({
      where: { name: 'Tech Solutions Inc' },
      update: {},
      create: {
        name: 'Tech Solutions Inc',
        description: 'Leading technology company specializing in innovative software solutions',
        industry: 'Technology',
        city: 'Cape Town',
        province: 'Western Cape',
        country: 'South Africa',
        employeeCount: 250,
        foundedYear: 2015,
        isVerified: true,
        verificationStatus: 'verified'
      }
    }),
    db.company.upsert({
      where: { name: 'AI Innovations' },
      update: {},
      create: {
        name: 'AI Innovations',
        description: 'Cutting-edge AI and machine learning solutions for businesses',
        industry: 'Technology',
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        employeeCount: 150,
        foundedYear: 2018,
        isVerified: true,
        verificationStatus: 'verified'
      }
    }),
    db.company.upsert({
      where: { name: 'Startup Hub' },
      update: {},
      create: {
        name: 'Startup Hub',
        description: 'Accelerating startup growth through mentorship and funding',
        industry: 'Venture Capital',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        country: 'South Africa',
        employeeCount: 50,
        foundedYear: 2020,
        isVerified: false,
        verificationStatus: 'pending'
      }
    }),
    db.company.upsert({
      where: { name: 'Design Studio' },
      update: {},
      create: {
        name: 'Design Studio',
        description: 'Creative design agency specializing in digital experiences',
        industry: 'Design',
        city: 'Cape Town',
        province: 'Western Cape',
        country: 'South Africa',
        employeeCount: 30,
        foundedYear: 2019,
        isVerified: true,
        verificationStatus: 'verified'
      }
    }),
    db.company.upsert({
      where: { name: 'CloudTech' },
      update: {},
      create: {
        name: 'CloudTech',
        description: 'Cloud infrastructure and DevOps solutions provider',
        industry: 'Technology',
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        employeeCount: 80,
        foundedYear: 2017,
        isVerified: true,
        verificationStatus: 'verified'
      }
    }),
    db.company.upsert({
      where: { name: 'Growth Agency' },
      update: {},
      create: {
        name: 'Growth Agency',
        description: 'Digital marketing and growth hacking agency',
        industry: 'Marketing',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        country: 'South Africa',
        employeeCount: 40,
        foundedYear: 2021,
        isVerified: false,
        verificationStatus: 'pending'
      }
    })
  ])

  // Create users for employers
  const employers = await Promise.all([
    db.user.upsert({
      where: { email: 'employer@techsolutions.com' },
      update: {},
      create: {
        email: 'employer@techsolutions.com',
        name: 'John Smith',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZP6', // password: password123
        role: 'employer',
        isActive: true
      }
    }),
    db.user.upsert({
      where: { email: 'employer@aiinnovations.com' },
      update: {},
      create: {
        email: 'employer@aiinnovations.com',
        name: 'Sarah Johnson',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZP6', // password: password123
        role: 'employer',
        isActive: true
      }
    })
  ])

  // Create employer profiles
  const employerProfiles = await Promise.all([
    db.employerProfile.upsert({
      where: { userUid: employers[0].uid },
      update: {},
      create: {
        userUid: employers[0].uid,
        companyId: companies[0].companyId,
        fullName: 'John Smith',
        jobTitle: 'HR Manager',
        isVerified: true,
        isAdmin: true
      }
    }),
    db.employerProfile.upsert({
      where: { userUid: employers[1].uid },
      update: {},
      create: {
        userUid: employers[1].uid,
        companyId: companies[1].companyId,
        fullName: 'Sarah Johnson',
        jobTitle: 'Technical Recruiter',
        isVerified: true,
        isAdmin: true
      }
    })
  ])

  // Create sample jobs
  const jobs = await Promise.all([
    db.job.create({
      data: {
        title: 'Senior Frontend Developer',
        description: 'We are looking for an experienced frontend developer to join our dynamic team. You will be responsible for building responsive web applications using React, TypeScript, and modern CSS frameworks. The ideal candidate will have 5+ years of experience in frontend development and a strong portfolio of web applications.',
        categoryId: categories[0].categoryId, // Technology
        employerId: employerProfiles[0].employerId,
        companyId: companies[0].companyId,
        employmentType: 'full_time',
        isRemote: false,
        salary: {
          min: 800000,
          max: 1200000,
          currency: 'ZAR'
        },
        location: 'Cape Town, Western Cape',
        experienceLevel: 'senior',
        requirements: {
          essential: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Git'],
          preferred: ['Next.js', 'Node.js', 'GraphQL', 'Docker']
        },
        status: 'PUBLISHED',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07'),
        expiresAt: new Date('2025-10-15')
      }
    }),
    db.job.create({
      data: {
        title: 'Data Scientist',
        description: 'Join our data science team to work on cutting-edge AI projects. We are seeking a talented data scientist with experience in machine learning, statistical analysis, and data visualization. You will work with large datasets and help drive business decisions through data-driven insights.',
        categoryId: categories[0].categoryId, // Technology
        employerId: employerProfiles[1].employerId,
        companyId: companies[1].companyId,
        employmentType: 'full_time',
        isRemote: true,
        salary: {
          min: 900000,
          max: 1400000,
          currency: 'ZAR'
        },
        location: 'Johannesburg, Gauteng',
        experienceLevel: 'mid',
        requirements: {
          essential: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Data Visualization'],
          preferred: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas']
        },
        status: 'PUBLISHED',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07'),
        expiresAt: new Date('2025-10-15')
      }
    }),
    db.job.create({
      data: {
        title: 'Product Manager',
        description: 'Lead product development for our innovative startup. We are looking for a product manager with experience in agile methodologies and a track record of launching successful digital products. You will work closely with engineering, design, and marketing teams to deliver exceptional user experiences.',
        categoryId: categories[3].categoryId, // Sales
        employerId: employerProfiles[0].employerId,
        companyId: companies[2].companyId,
        employmentType: 'full_time',
        isRemote: false,
        salary: {
          min: 700000,
          max: 1000000,
          currency: 'ZAR'
        },
        location: 'Durban, KwaZulu-Natal',
        experienceLevel: 'mid',
        requirements: {
          essential: ['Product Management', 'Agile', 'Scrum', 'User Research', 'Analytics'],
          preferred: ['JIRA', 'Figma', 'A/B Testing', 'Growth Hacking']
        },
        status: 'PUBLISHED',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07'),
        expiresAt: new Date('2025-10-15')
      }
    }),
    db.job.create({
      data: {
        title: 'UX Designer',
        description: 'We are seeking a creative UX designer to join our design team. You will be responsible for creating user-centered designs for web and mobile applications. Experience with design tools like Figma, Sketch, and Adobe Creative Suite is required.',
        categoryId: categories[2].categoryId, // Design
        employerId: employerProfiles[1].employerId,
        companyId: companies[3].companyId,
        employmentType: 'full_time',
        isRemote: false,
        salary: {
          min: 600000,
          max: 850000,
          currency: 'ZAR'
        },
        location: 'Cape Town, Western Cape',
        experienceLevel: 'mid',
        requirements: {
          essential: ['UX Design', 'UI Design', 'Figma', 'Sketch', 'Prototyping'],
          preferred: ['User Research', 'Usability Testing', 'Design Systems', 'Adobe Creative Suite']
        },
        status: 'PUBLISHED',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07'),
        expiresAt: new Date('2025-10-15')
      }
    }),
    db.job.create({
      data: {
        title: 'DevOps Engineer',
        description: 'Looking for a DevOps engineer with experience in cloud infrastructure, CI/CD pipelines, and containerization. You will be responsible for maintaining and improving our deployment infrastructure and ensuring high availability of our services.',
        categoryId: categories[0].categoryId, // Technology
        employerId: employerProfiles[0].employerId,
        companyId: companies[4].companyId,
        employmentType: 'full_time',
        isRemote: true,
        salary: {
          min: 750000,
          max: 1100000,
          currency: 'ZAR'
        },
        location: 'Johannesburg, Gauteng',
        experienceLevel: 'mid',
        requirements: {
          essential: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
          preferred: ['Terraform', 'Ansible', 'Jenkins', 'Monitoring']
        },
        status: 'PUBLISHED',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07'),
        expiresAt: new Date('2025-10-15')
      }
    }),
    db.job.create({
      data: {
        title: 'Marketing Manager',
        description: 'Join our marketing team to drive growth for our clients. We are looking for a marketing manager with experience in digital marketing, content strategy, and team leadership. You will develop and execute comprehensive marketing campaigns.',
        categoryId: categories[1].categoryId, // Marketing
        employerId: employerProfiles[1].employerId,
        companyId: companies[5].companyId,
        employmentType: 'full_time',
        isRemote: false,
        salary: {
          min: 550000,
          max: 800000,
          currency: 'ZAR'
        },
        location: 'Durban, KwaZulu-Natal',
        experienceLevel: 'mid',
        requirements: {
          essential: ['Digital Marketing', 'Content Strategy', 'SEO', 'Social Media', 'Analytics'],
          preferred: ['Google Ads', 'Facebook Ads', 'Email Marketing', 'Marketing Automation']
        },
        status: 'PUBLISHED',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07'),
        expiresAt: new Date('2025-10-15')
      }
    })
  ])

  console.log('Database seeded successfully!')
  console.log(`Created ${categories.length} categories`)
  console.log(`Created ${companies.length} companies`)
  console.log(`Created ${employers.length} employers`)
  console.log(`Created ${jobs.length} jobs`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })