import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-xl text-text-primary">MemoraX</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/features" className="text-text-secondary hover:text-text-primary transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-text-secondary hover:text-text-primary transition-colors">
              Docs
            </Link>
            <Link
              href="/sign-in"
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-primary hover:bg-primary-glow text-white rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6">
              Your AI Memory That
              <br />
              <span className="text-gradient">Never Forgets</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">
              MemoraX captures everything — reminders, tasks, notes, voice memos — across all your channels.
              AI-powered semantic search helps you recall anything instantly.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-primary hover:bg-primary-glow text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 glow-primary"
              >
                Start Free Trial
              </Link>
              <Link
                href="/demo"
                className="px-8 py-4 border border-border hover:border-primary text-text-primary rounded-xl font-semibold text-lg transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-border">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-text-primary mb-16">
              Capture from <span className="text-primary">Every Channel</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: 'WhatsApp', icon: '💬', desc: 'Send messages to our bot' },
                { name: 'Telegram', icon: '✈️', desc: 'Native Telegram bot support' },
                { name: 'Slack', icon: '⚡', desc: '/memorax slash commands' },
                { name: 'SMS', icon: '📱', desc: 'Text reminders instantly' },
                { name: 'Email', icon: '📧', desc: 'Forward emails to capture' },
                { name: 'Voice', icon: '🎤', desc: 'Voice memos transcribed' },
              ].map((channel) => (
                <div
                  key={channel.name}
                  className="p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
                >
                  <span className="text-4xl mb-4 block">{channel.icon}</span>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">{channel.name}</h3>
                  <p className="text-text-secondary">{channel.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-border">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-text-primary mb-16">
              How It <span className="text-secondary">Works</span>
            </h2>
            <div className="max-w-3xl mx-auto space-y-12">
              {[
                {
                  step: '1',
                  title: 'Capture Anything',
                  desc: 'Send messages, voice notes, images, or emails. Our AI processes them all.',
                },
                {
                  step: '2',
                  title: 'AI Processing',
                  desc: 'Intent classification, entity extraction, and semantic embedding — all automatic.',
                },
                {
                  step: '3',
                  title: 'Smart Recall',
                  desc: 'Search naturally: "what did I discuss about the project?" and find it instantly.',
                },
                {
                  step: '4',
                  title: 'Proactive Reminders',
                  desc: 'Daily briefings and timely reminders, delivered where you need them.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-border">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Ready to Never Forget?
            </h2>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Start your free trial today. No credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-block px-10 py-4 bg-primary hover:bg-primary-glow text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 glow-primary"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-xl text-text-primary">MemoraX</span>
            </div>
            <p className="text-text-muted text-sm">
              © 2024 MemoraX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
