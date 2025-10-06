import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'Terms of Service | JobFinders.site',
  description: 'Terms of Service for JobFinders.site - Legal terms and conditions',
}

export default function TermsOfServicePage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-ZA')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing and using JobFinders.site ("the Service"), operated by Custom Logic SA Pty LTD 
                ("Company", "we", "us", or "our"), you agree to be bound by these Terms of Service 
                ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
              <p>
                These Terms are governed by South African law and subject to the jurisdiction of 
                South African courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
              <p>
                JobFinders.site is a job matching platform that connects job seekers with employers. 
                Our services include:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Job search and matching algorithms</li>
                <li>CV and profile management</li>
                <li>Application tracking and management</li>
                <li>AI-powered job recommendations</li>
                <li>Premium subscription features</li>
                <li>Employer job posting and candidate management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Eligibility</h2>
              <p>
                To use our Service, you must:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. User Obligations</h2>
              
              <h3 className="text-xl font-medium mb-3">4.1 Accurate Information</h3>
              <p>
                You agree to provide accurate, current, and complete information in your profile, 
                CV, and job applications. Fraudulent or misleading information may result in 
                account termination.
              </p>

              <h3 className="text-xl font-medium mb-3">4.2 Professional Conduct</h3>
              <p>
                You agree to maintain professional conduct when interacting with other users, 
                employers, and our platform. Harassment, discrimination, or inappropriate 
                behavior is strictly prohibited.
              </p>

              <h3 className="text-xl font-medium mb-3">4.3 Account Security</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account 
                credentials and for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
              <p>You may not use our Service for:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Scraping or automated data extraction</li>
                <li>Republication or resale of job data</li>
                <li>Commercial use without written permission</li>
                <li>Posting fraudulent or misleading job listings</li>
                <li>Spamming or unsolicited communications</li>
                <li>Violating intellectual property rights</li>
                <li>Circumventing security measures</li>
                <li>Any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Job Listings and Data Rights</h2>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold mb-2">Important Disclaimer:</h4>
                <ul className="list-disc pl-4">
                  <li>Job information is sourced from employer submissions and public sources</li>
                  <li>Verify all details directly with the employer before applying</li>
                  <li>JobFinders.site is not responsible for job listing accuracy or employer conduct</li>
                  <li>Report suspicious listings to abuse@jobfinders.site</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium mb-3">6.1 Usage Restrictions</h3>
              <p>Job data on our platform is provided for personal job search purposes only. You may not:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Republish or resell job data</li>
                <li>Use automated tools to extract job information</li>
                <li>Use job data for commercial purposes without written permission</li>
                <li>Create derivative databases from our job listings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by 
                Custom Logic SA Pty LTD and are protected by international copyright, trademark, 
                patent, trade secret, and other intellectual property laws.
              </p>
              <p>
                You retain ownership of content you submit (CV, profile information), but grant 
                us a license to use this content to provide our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Premium Subscriptions</h2>
              <p>
                Premium features are available through paid subscriptions. Subscription terms include:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Monthly or annual billing cycles</li>
                <li>Automatic renewal unless cancelled</li>
                <li>14-day money-back guarantee for new subscriptions</li>
                <li>Pro-rated refunds for annual plans (see Refund Policy)</li>
              </ul>
              <p>
                For detailed refund information, see our <a href="/refund" className="text-blue-600 hover:underline">Refund Policy</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. AI-Generated Content</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold mb-2">AI Content Disclaimer:</h4>
                <ul className="list-disc pl-4">
                  <li>Some content may be generated using AI and requires review</li>
                  <li>Users are responsible for accuracy before submission</li>
                  <li>Custom Logic SA is not liable for AI-generated content errors</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Account Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at our sole discretion, 
                without notice, for conduct that we believe violates these Terms or is harmful 
                to other users, us, or third parties, or for any other reason.
              </p>
              <p>
                You may terminate your account at any time through your account settings or by 
                contacting support@jobfinders.site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by South African law, Custom Logic SA Pty LTD 
                shall not be liable for any indirect, incidental, special, consequential, or 
                punitive damages, including without limitation, loss of profits, data, use, 
                goodwill, or other intangible losses.
              </p>
              <p>
                Our total liability for any claim arising out of or relating to these Terms or 
                the Service shall not exceed the amount paid by you for the Service in the 
                12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
              <p>
                Any disputes arising from these Terms or the use of our Service shall be 
                resolved through:
              </p>
              <ol className="list-decimal pl-6 mb-4">
                <li>Good faith negotiation between the parties</li>
                <li>Mediation if negotiation fails</li>
                <li>Arbitration or South African court proceedings as a last resort</li>
              </ol>
              <p>
                These Terms are governed by South African law, and any legal proceedings 
                shall be subject to the jurisdiction of South African courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users 
                of material changes via email or through our platform. Your continued use of 
                the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Company:</strong> Custom Logic SA Pty LTD</p>
                <p><strong>Support:</strong> support@jobfinders.site</p>
                <p><strong>Legal:</strong> legal@jobfinders.site</p>
                <p><strong>Abuse Reports:</strong> abuse@jobfinders.site</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, 
                that provision will be limited or eliminated to the minimum extent necessary 
                so that these Terms will otherwise remain in full force and effect.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}