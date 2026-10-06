export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              <p className="text-muted-foreground">
                FeedWren collects information you provide directly, including your email address, profile information, and settings. We also collect data related to your use of the service, such as posts created and analytics data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use your information to provide, maintain, and improve our services. This includes managing your account, processing your requests, and communicating with you about our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground">
                FeedWren integrates with Facebook/Meta for social media posting. We also use Supabase for authentication and data storage. These services have their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, update, or delete your personal data. You can delete your account at any time through the Settings page, which will permanently remove all your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at support@feedwren.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
