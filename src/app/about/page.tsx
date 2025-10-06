import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Users, Target, Award, Heart, Globe, Briefcase } from 'lucide-react'
import { Button } from '@/components/design-system'
import { Card, CardContent } from '@/components/design-system'
import { HeroSection, SectionLayout } from '@/components/design-system'

export const metadata: Metadata = {
  title: 'About Us - Job Finders',
  description: 'Learn about Job Finders mission to connect talented professionals with their dream careers in South Africa. Discover our story, values, and commitment to transforming the job market.',
  keywords: 'about job finders, company mission, south africa jobs, career platform, job search',
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <HeroSection
        title="Connecting Dreams with Opportunities"
        subtitle="Building South Africa's Premier Job Platform"
        description="Job Finders is South Africa's premier job platform, dedicated to bridging the gap between talented professionals and forward-thinking companies. We believe everyone deserves a career that fulfills their potential."
        background="gradient"
        size="lg"
        alignment="center"
        actions={
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/jobs">
                Explore Jobs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        }
      />

      {/* Mission & Vision */}
      <SectionLayout
        title="Our Mission"
        description="To revolutionize the South African job market by creating meaningful connections between job seekers and employers. We strive to make career advancement accessible, transparent, and rewarding for everyone."
        spacing="lg"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl-fluid font-semibold mb-2">Empowering Careers</h3>
                <p className="text-muted-foreground">
                  We provide tools and resources to help professionals advance their careers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-secondary/10 rounded-full p-3 flex-shrink-0">
                <Heart className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl-fluid font-semibold mb-2">Building Communities</h3>
                <p className="text-muted-foreground">
                  Creating networks that foster professional growth and collaboration
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl-fluid font-semibold mb-2">Driving Innovation</h3>
                <p className="text-muted-foreground">
                  Leveraging technology to transform how people find and secure employment
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-primary/20">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl-fluid font-bold text-primary mb-2">50K+</div>
                  <div className="text-sm-fluid text-muted-foreground">Active Job Seekers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl-fluid font-bold text-secondary mb-2">2K+</div>
                  <div className="text-sm-fluid text-muted-foreground">Partner Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl-fluid font-bold text-primary mb-2">15K+</div>
                  <div className="text-sm-fluid text-muted-foreground">Jobs Posted Monthly</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl-fluid font-bold text-success mb-2">95%</div>
                  <div className="text-sm-fluid text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionLayout>

      {/* Our Story */}
      <SectionLayout
        title="Our Story"
        description="Founded in 2020, Job Finders emerged from a simple observation: the South African job market needed a platform that truly understood both job seekers and employers."
        background="muted"
        spacing="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="elevated" hover className="transition-base">
            <CardContent className="p-6 text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2020 - The Beginning</h3>
              <p className="text-sm-fluid text-muted-foreground">
                Started with a vision to simplify job searching and hiring in South Africa
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" hover className="transition-base">
            <CardContent className="p-6 text-center">
              <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold mb-2">2022 - Growth</h3>
              <p className="text-sm-fluid text-muted-foreground">
                Reached 10,000 active users and partnered with 500+ companies
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" hover className="transition-base">
            <CardContent className="p-6 text-center">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">2024 - Recognition</h3>
              <p className="text-sm-fluid text-muted-foreground">
                Awarded "Best Job Platform" by SA Tech Awards
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionLayout>

      {/* Our Values */}
      <SectionLayout
        title="Our Core Values"
        description="These principles guide everything we do and shape how we serve our community of job seekers and employers."
        spacing="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Integrity</h3>
            <p className="text-sm-fluid text-muted-foreground">
              We operate with honesty and transparency in all our interactions
            </p>
          </div>

          <div className="text-center">
            <div className="bg-secondary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">Community</h3>
            <p className="text-sm-fluid text-muted-foreground">
              Building strong relationships and supporting our users' success
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Excellence</h3>
            <p className="text-sm-fluid text-muted-foreground">
              Continuously improving our platform and services
            </p>
          </div>

          <div className="text-center">
            <div className="bg-warning/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-10 w-10 text-warning" />
            </div>
            <h3 className="font-semibold mb-2">Innovation</h3>
            <p className="text-sm-fluid text-muted-foreground">
              Embracing new technologies to solve real-world problems
            </p>
          </div>
        </div>
      </SectionLayout>

      {/* Team Section */}
      <SectionLayout
        title="Meet Our Team"
        description="The passionate individuals working to transform South Africa's job market"
        background="muted"
        spacing="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card variant="elevated" hover className="transition-base">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl-fluid font-bold">
                TM
              </div>
              <h3 className="font-semibold mb-1">Thabo Mthembu</h3>
              <p className="text-sm text-primary mb-2">CEO & Founder</p>
              <p className="text-sm-fluid text-muted-foreground">
                Former HR executive with 15+ years experience in talent acquisition
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" hover className="transition-base">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-success to-success-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl-fluid font-bold">
                SP
              </div>
              <h3 className="font-semibold mb-1">Sarah Patel</h3>
              <p className="text-sm text-success mb-2">CTO</p>
              <p className="text-sm-fluid text-muted-foreground">
                Tech innovator specializing in AI-driven matching algorithms
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" hover className="transition-base">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary to-secondary-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl-fluid font-bold">
                MJ
              </div>
              <h3 className="font-semibold mb-1">Michael Johnson</h3>
              <p className="text-sm text-secondary mb-2">Head of Operations</p>
              <p className="text-sm-fluid text-muted-foreground">
                Operations expert focused on scaling and user experience
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionLayout>

      {/* Call to Action */}
      <SectionLayout background="gradient" spacing="xl">
        <div className="text-center">
          <h2 className="text-3xl-fluid font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl-fluid text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream careers through Job Finders
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/auth/signup">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        </div>
      </SectionLayout>
    </div>
  )
}