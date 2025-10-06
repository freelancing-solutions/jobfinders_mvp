import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy | JobFinders.site',
  description: 'Privacy Policy for JobFinders.site - Your data protection rights under POPIA',
}

export default function PrivacyPolicyPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-ZA')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                JobFinders.site is operated by Custom Logic SA Pty LTD ("we", "us", or "our"). 
                We are committed to protecting your personal information and your right to privacy. 
                This Privacy Policy explains how we collect, use, and protect your information when 
                you use our job matching platform.
              </p>
              <p>
                This policy complies with the Protection of Personal Information Act (POPIA) of South Africa 
                and applies to all users of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Name, email address, and contact details</li>
                <li>Professional information (CV, work experience, skills)</li>
                <li>Job preferences and search criteria</li>
                <li>Identity numbers (encrypted and stored securely)</li>
                <li>Salary expectations and employment history</li>
                <li>Profile photos and professional documents</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 Technical Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and interaction data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Job matching and recommendation services</li>
                <li>Account management and authentication</li>
                <li>Communication about job opportunities and platform updates</li>
                <li>Analytics to improve our services</li>
                <li>Compliance with legal obligations</li>
                <li>Fraud prevention and security monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
              <p>We use the following third-party services that may process your data:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Paddle:</strong> Payment processing for premium subscriptions</li>
                <li><strong>Resend:</strong> Email delivery services</li>
                <li><strong>Claude AI:</strong> AI-powered job matching and recommendations</li>
                <li><strong>Google Analytics:</strong> Website usage analytics (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights Under POPIA</h2>
              <p>You have the following rights regarding your personal information:</p>
              
              <h3 className="text-xl font-medium mb-3">5.1 Right of Access</h3>
              <p>You can request access to all personal information we hold about you.</p>
              
              <h3 className="text-xl font-medium mb-3">5.2 Right to Correction</h3>
              <p>You can update or correct your personal information through your profile settings.</p>
              
              <h3 className="text-xl font-medium mb-3">5.3 Right to Deletion</h3>
              <p>You can request deletion of your account and personal data (right to be forgotten).</p>
              
              <h3 className="text-xl font-medium mb-3">5.4 Right to Data Portability</h3>
              <p>You can request a copy of your data in a machine-readable format.</p>
              
              <p className="mt-4">
                To exercise these rights, contact us at: <strong>dpo@jobfinders.site</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active, 
                plus an additional 2 years after account deletion for legal compliance purposes. 
                You may request earlier deletion by contacting our Data Protection Officer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
              <p>We implement industry-standard security measures including:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Encryption of data at rest and in transit</li>
                <li>Secure password hashing with bcrypt</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication systems</li>
                <li>Virus scanning for uploaded documents</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
              <p>
                We use cookies for essential functionality, analytics, and personalization. 
                You can manage your cookie preferences through our cookie consent banner. 
                For detailed information, see our <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Data Protection Officer:</strong> dpo@jobfinders.site</p>
                <p><strong>General Inquiries:</strong> support@jobfinders.site</p>
                <p><strong>Security Issues:</strong> security@jobfinders.site</p>
                <p><strong>Company:</strong> Custom Logic SA Pty LTD</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any 
                material changes by email or through our platform. Your continued use of our 
                services after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Complaints</h2>
              <p>
                If you have concerns about how we handle your personal information, you may 
                lodge a complaint with the South African Information Regulator at: 
                <a href="https://www.justice.gov.za/inforeg/" className="text-blue-600 hover:underline ml-1">
                  www.justice.gov.za/inforeg/
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}