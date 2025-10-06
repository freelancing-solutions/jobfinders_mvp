import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/app-layout'

export const metadata: Metadata = {
  title: 'Refund Policy | JobFinders.site',
  description: 'Refund Policy for JobFinders.site - Money-back guarantee and refund procedures',
}

export default function RefundPolicyPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Refund Policy</CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-ZA')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
              <p>
                At JobFinders.site, operated by Custom Logic SA Pty LTD, we stand behind our service 
                and want you to be completely satisfied with your Premium subscription. This Refund 
                Policy outlines the terms and conditions for refunds on our platform.
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
                <h4 className="font-semibold mb-2">14-Day Money-Back Guarantee</h4>
                <p>
                  We offer a 14-day money-back guarantee for all new Premium subscriptions. 
                  If you're not satisfied with our service, you can request a full refund 
                  within 14 days of your initial purchase.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligible Refunds</h2>
              
              <h3 className="text-xl font-medium mb-3">2.1 New Subscriptions</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Full refund available within 14 days of first-time Premium subscription purchase</li>
                <li>Applies to both monthly and annual subscription plans</li>
                <li>No questions asked - we'll process your refund promptly</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 Technical Issues</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Service unavailability for more than 24 consecutive hours</li>
                <li>Critical features not working as advertised</li>
                <li>Data loss due to platform errors (not user error)</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.3 Billing Errors</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Duplicate charges or incorrect billing amounts</li>
                <li>Charges after successful cancellation</li>
                <li>Unauthorized charges (subject to investigation)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Refund Types</h2>
              
              <h3 className="text-xl font-medium mb-3">3.1 Full Refunds</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p><strong>When:</strong> Within 14 days of initial purchase</p>
                <p><strong>Amount:</strong> 100% of subscription fee</p>
                <p><strong>Processing Time:</strong> 7-10 business days</p>
              </div>

              <h3 className="text-xl font-medium mb-3">3.2 Pro-Rated Refunds</h3>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <p><strong>When:</strong> Annual subscriptions cancelled after 14-day period</p>
                <p><strong>Amount:</strong> Unused portion of annual subscription</p>
                <p><strong>Calculation:</strong> (Remaining months ÷ 12) × Annual fee</p>
                <p><strong>Processing Time:</strong> 7-10 business days</p>
              </div>

              <h3 className="text-xl font-medium mb-3">3.3 Partial Refunds</h3>
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                <p><strong>When:</strong> Service disruptions or technical issues</p>
                <p><strong>Amount:</strong> Proportional to service downtime</p>
                <p><strong>Evaluation:</strong> Case-by-case basis</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Situations</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold mb-2">Refunds will NOT be provided for:</h4>
                <ul className="list-disc pl-4">
                  <li>Monthly subscriptions after the 14-day guarantee period</li>
                  <li>Subscriptions cancelled due to Terms of Service violations</li>
                  <li>Accounts terminated for fraudulent activity</li>
                  <li>Change of mind after using the service beyond 14 days</li>
                  <li>Failure to use the service (non-usage is not grounds for refund)</li>
                  <li>Third-party payment processing fees</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. How to Request a Refund</h2>
              
              <h3 className="text-xl font-medium mb-3">5.1 Contact Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Email:</strong> support@jobfinders.site</p>
                <p><strong>Subject Line:</strong> "Refund Request - [Your Account Email]"</p>
                <p><strong>Response Time:</strong> Within 24 hours</p>
              </div>

              <h3 className="text-xl font-medium mb-3">5.2 Required Information</h3>
              <p>Please include the following in your refund request:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your account email address</li>
                <li>Subscription purchase date</li>
                <li>Reason for refund request</li>
                <li>Transaction ID (if available)</li>
                <li>Any relevant screenshots or documentation</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">5.3 Processing Steps</h3>
              <ol className="list-decimal pl-6 mb-4">
                <li><strong>Request Submission:</strong> Send email with required information</li>
                <li><strong>Acknowledgment:</strong> We'll confirm receipt within 24 hours</li>
                <li><strong>Review:</strong> Our team will review your request (1-2 business days)</li>
                <li><strong>Decision:</strong> We'll notify you of approval or denial</li>
                <li><strong>Processing:</strong> Approved refunds processed within 7-10 business days</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Refund Processing</h2>
              
              <h3 className="text-xl font-medium mb-3">6.1 Payment Method</h3>
              <p>
                Refunds will be processed to the original payment method used for the purchase. 
                We cannot process refunds to different payment methods or accounts.
              </p>

              <h3 className="text-xl font-medium mb-3">6.2 Processing Time</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
                <li><strong>PayPal:</strong> 3-5 business days</li>
                <li><strong>Bank Transfers:</strong> 7-14 business days</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                <em>Processing times may vary depending on your bank or payment provider.</em>
              </p>

              <h3 className="text-xl font-medium mb-3">6.3 Currency and Fees</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Refunds processed in the original transaction currency</li>
                <li>Payment processing fees are non-refundable</li>
                <li>Currency conversion fees (if any) are not covered</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Subscription Cancellation</h2>
              
              <h3 className="text-xl font-medium mb-3">7.1 How to Cancel</h3>
              <p>You can cancel your subscription at any time through:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your account settings dashboard</li>
                <li>Emailing support@jobfinders.site</li>
                <li>Using the cancellation link in billing emails</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">7.2 Cancellation Effects</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Premium features remain active until the end of current billing period</li>
                <li>No automatic refund for remaining subscription time (except annual plans)</li>
                <li>Account reverts to free tier after subscription expires</li>
                <li>Data and profile information are preserved</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Dispute Resolution</h2>
              <p>
                If you're not satisfied with our refund decision, you can:
              </p>
              <ol className="list-decimal pl-6 mb-4">
                <li>Request a review by emailing escalation@jobfinders.site</li>
                <li>Provide additional documentation or context</li>
                <li>Contact your payment provider for a chargeback (as a last resort)</li>
              </ol>
              <p>
                We encourage direct communication to resolve any issues before initiating 
                chargebacks, as this helps us improve our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Special Circumstances</h2>
              
              <h3 className="text-xl font-medium mb-3">9.1 Service Discontinuation</h3>
              <p>
                If we discontinue the service, all active subscribers will receive:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>30 days advance notice</li>
                <li>Full refund for unused subscription time</li>
                <li>Data export assistance</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">9.2 Account Violations</h3>
              <p>
                Accounts terminated for Terms of Service violations forfeit refund eligibility. 
                However, we may consider partial refunds on a case-by-case basis for minor violations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Refund Requests:</strong> support@jobfinders.site</p>
                <p><strong>Billing Questions:</strong> billing@jobfinders.site</p>
                <p><strong>Escalations:</strong> escalation@jobfinders.site</p>
                <p><strong>Company:</strong> Custom Logic SA Pty LTD</p>
                <p><strong>Business Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM SAST</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Policy Updates</h2>
              <p>
                We may update this Refund Policy from time to time. Material changes will be 
                communicated via email to active subscribers. Continued use of our service 
                after policy updates constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Legal Compliance</h2>
              <p>
                This Refund Policy complies with South African consumer protection laws and 
                international best practices. Your statutory rights as a consumer are not 
                affected by this policy.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}