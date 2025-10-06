import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy | JobFinders.site',
  description: 'Cookie Policy for JobFinders.site - How we use cookies and tracking technologies',
}

export default function CookiePolicyPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Cookie Policy</CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-ZA')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
              <p>
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                enabling certain functionality.
              </p>
              <p>
                This Cookie Policy explains how JobFinders.site, operated by Custom Logic SA Pty LTD, 
                uses cookies and similar tracking technologies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium mb-3">2.1 Essential Cookies</h3>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="font-medium mb-2">These cookies are necessary for the website to function properly:</p>
                <ul className="list-disc pl-4">
                  <li><strong>Authentication:</strong> Keep you logged in during your session</li>
                  <li><strong>Security:</strong> Protect against cross-site request forgery (CSRF)</li>
                  <li><strong>Session Management:</strong> Maintain your session state</li>
                  <li><strong>Load Balancing:</strong> Distribute traffic across our servers</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                  <em>These cookies cannot be disabled as they are essential for the website to work.</em>
                </p>
              </div>

              <h3 className="text-xl font-medium mb-3">2.2 Analytics Cookies</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p className="font-medium mb-2">These cookies help us understand how you use our website:</p>
                <ul className="list-disc pl-4">
                  <li><strong>Google Analytics:</strong> Track page views, user behavior, and site performance</li>
                  <li><strong>Usage Statistics:</strong> Monitor feature usage and user engagement</li>
                  <li><strong>Error Tracking:</strong> Identify and fix technical issues</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                  <em>You can opt out of these cookies through our cookie consent banner.</em>
                </p>
              </div>

              <h3 className="text-xl font-medium mb-3">2.3 Functional Cookies</h3>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <p className="font-medium mb-2">These cookies enhance your experience on our website:</p>
                <ul className="list-disc pl-4">
                  <li><strong>Theme Preferences:</strong> Remember your dark/light mode choice</li>
                  <li><strong>Language Settings:</strong> Store your preferred language</li>
                  <li><strong>Search Filters:</strong> Remember your job search preferences</li>
                  <li><strong>Notification Settings:</strong> Store your notification preferences</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium mb-3">2.4 Marketing Cookies</h3>
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                <p className="font-medium mb-2">These cookies help us provide relevant job recommendations:</p>
                <ul className="list-disc pl-4">
                  <li><strong>Job Recommendations:</strong> Personalize job suggestions based on your activity</li>
                  <li><strong>Email Preferences:</strong> Customize job alert emails</li>
                  <li><strong>A/B Testing:</strong> Test different features to improve user experience</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                  <em>You can opt out of these cookies through our cookie consent banner.</em>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
              <p>We use the following third-party services that may set cookies:</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 mt-4">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Service</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Cookie Names</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Google Analytics</td>
                      <td className="border border-gray-300 px-4 py-2">Website analytics</td>
                      <td className="border border-gray-300 px-4 py-2">_ga, _ga_*, _gid</td>
                      <td className="border border-gray-300 px-4 py-2">2 years / 24 hours</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Paddle</td>
                      <td className="border border-gray-300 px-4 py-2">Payment processing</td>
                      <td className="border border-gray-300 px-4 py-2">paddle_*</td>
                      <td className="border border-gray-300 px-4 py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">NextAuth.js</td>
                      <td className="border border-gray-300 px-4 py-2">Authentication</td>
                      <td className="border border-gray-300 px-4 py-2">next-auth.session-token</td>
                      <td className="border border-gray-300 px-4 py-2">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Cookie Duration</h2>
              <p>Cookies are classified by how long they remain on your device:</p>
              
              <h3 className="text-xl font-medium mb-3">4.1 Session Cookies</h3>
              <p>
                These cookies are temporary and are deleted when you close your browser. 
                They are used for essential functions like maintaining your login session.
              </p>

              <h3 className="text-xl font-medium mb-3">4.2 Persistent Cookies</h3>
              <p>
                These cookies remain on your device for a specified period or until you delete them. 
                They remember your preferences across multiple visits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-xl font-medium mb-3">5.1 Cookie Consent Banner</h3>
              <p>
                When you first visit our website, you'll see a cookie consent banner where you can:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Accept all cookies</li>
                <li>Reject non-essential cookies</li>
                <li>Customize your cookie preferences</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">5.2 Browser Settings</h3>
              <p>
                You can also manage cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>View and delete existing cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Block all cookies (may affect website functionality)</li>
                <li>Set preferences for third-party cookies</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">5.3 Browser-Specific Instructions</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Impact of Disabling Cookies</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold mb-2">Important Notice:</h4>
                <p>
                  Disabling certain cookies may affect your experience on our website. 
                  Essential cookies are required for basic functionality and cannot be disabled.
                </p>
              </div>
              
              <p>If you disable non-essential cookies, you may experience:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Less personalized job recommendations</li>
                <li>Loss of saved preferences (theme, language)</li>
                <li>Reduced functionality in some features</li>
                <li>Need to re-enter information more frequently</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our 
                practices or for other operational, legal, or regulatory reasons. We will notify 
                you of any material changes by updating the "Last updated" date at the top of 
                this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies or this Cookie Policy, 
                please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@jobfinders.site</p>
                <p><strong>Data Protection Officer:</strong> dpo@jobfinders.site</p>
                <p><strong>Company:</strong> Custom Logic SA Pty LTD</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Related Policies</h2>
              <p>For more information about how we handle your data, please see:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a></li>
                <li><a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a></li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}