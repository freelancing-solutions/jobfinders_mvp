/**
 * Templates Page
 *
 * Comprehensive template management interface that showcases all available
 * templates, provides recommendations, and allows users to manage their
 * template customizations and preferences.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { TemplateCustomizationPanel } from '@/components/templates/TemplateCustomizationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Layout,
  Palette,
  TrendingUp,
  Star,
  Download,
  Users,
  Eye,
  Settings,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resume Templates - JobFinders',
  description: 'Choose from our collection of professional resume templates. ATS-optimized, customizable, and designed to help you stand out.',
};

// Mock data for statistics (in a real app, this would come from an API)
const templateStats = {
  totalTemplates: 150,
  premiumTemplates: 45,
  freeTemplates: 105,
  totalDownloads: 1250000,
  averageRating: 4.7,
  newThisMonth: 12
};

const featuredCategories = [
  {
    name: 'Professional',
    description: 'Clean and classic designs perfect for corporate environments',
    icon: Layout,
    count: 48,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Modern',
    description: 'Contemporary designs with creative elements and layouts',
    icon: Sparkles,
    count: 36,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    name: 'Creative',
    description: 'Bold and artistic templates for design and creative roles',
    icon: Palette,
    count: 28,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    name: 'Technical',
    description: 'Optimized for engineering and technical positions',
    icon: Settings,
    count: 24,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'Academic',
    description: 'Formal designs for academic and research positions',
    icon: Star,
    count: 14,
    color: 'bg-amber-100 text-amber-600'
  }
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Professional Resume Templates
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Choose from 150+ ATS-optimized templates designed by professionals.
              Stand out from the crowd and land your dream job.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{templateStats.totalTemplates}</div>
                <div className="text-blue-100">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{(templateStats.averageRating).toFixed(1)}</div>
                <div className="text-blue-100">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {(templateStats.totalDownloads / 1000000).toFixed(1)}M+
                </div>
                <div className="text-blue-100">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{templateStats.newThisMonth}</div>
                <div className="text-blue-100">New This Month</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Layout className="w-5 h-5 mr-2" />
                Browse Templates
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <Eye className="w-5 h-5 mr-2" />
                Preview Examples
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Templates?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our templates are designed with ATS optimization and modern best practices in mind
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>ATS Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  All our templates are tested and optimized for Applicant Tracking Systems to ensure your resume gets noticed.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Easy Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Change colors, fonts, and layouts with our intuitive customization tools. No design experience needed.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Multiple Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Export your resume in PDF, DOCX, or HTML formats. Perfect for online applications and printing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Templates by Category</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the perfect template for your industry and experience level
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {featuredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="secondary">{category.count} templates</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                    <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:border-blue-200">
                      View Templates
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Template Gallery */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">All Templates</h2>
            <p className="text-xl text-gray-600">
              Browse our complete collection of professional resume templates
            </p>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            </div>
          }>
            <TemplateGallery
              enableRecommendations={true}
              showPremiumOnly={false}
              maxVisible={24}
            />
          </Suspense>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Your Professional Resume?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Join thousands of job seekers who have landed their dream jobs with our professional templates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Layout className="w-5 h-5 mr-2" />
              Start Building Your Resume
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Users className="w-5 h-5 mr-2" />
              View Success Stories
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}