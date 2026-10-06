export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using FeedWren, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Account Responsibilities</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
              <p className="text-muted-foreground">
                You agree to use FeedWren only for lawful purposes and in accordance with these Terms. You must not use the service to post content that is illegal, harmful, threatening, abusive, or otherwise objectionable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Content and Intellectual Property</h2>
              <p className="text-muted-foreground">
                You retain ownership of content you create using FeedWren. However, by using our service, you grant us the necessary rights to store, process, and transmit your content as required to provide the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground">
                FeedWren integrates with third-party services such as Facebook/Meta. Your use of these services is subject to their respective terms and conditions. We are not responsible for the actions or policies of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                FeedWren is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We make no warranties, expressed or implied, regarding the operation or use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the fullest extent permitted by law, FeedWren shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion. You may also delete your account at any time through the Settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. We will notify users of significant changes by posting the new Terms on this page. Your continued use of the service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms of Service, please contact us at support@feedwren.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
