export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="text-text-secondary mt-2">Start your free trial today</p>
        </div>

        <div className="p-8 rounded-2xl border border-border bg-surface">
          <p className="text-center text-text-muted">
            Sign up with Clerk authentication
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href="/sign-up"
              className="px-6 py-3 bg-primary hover:bg-primary-glow text-white rounded-xl font-medium transition-colors"
            >
              Continue with Clerk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
