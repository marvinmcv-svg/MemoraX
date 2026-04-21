import Link from 'next/link';
import { Brain, Zap, Clock, Users, Search, Bell } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Memory',
    description: 'Every message is analyzed for intent, entities, and context. Your memories are structured automatically.',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Search naturally: "what did I discuss about the marketing campaign?" Find anything instantly.',
  },
  {
    icon: Zap,
    title: 'Multi-Channel Capture',
    description: 'WhatsApp, Telegram, Slack, SMS, email, voice — capture from everywhere you communicate.',
  },
  {
    icon: Clock,
    title: 'Smart Reminders',
    description: 'Natural language scheduling: "remind me to follow up next Tuesday" Just works.',
  },
  {
    icon: Bell,
    title: 'Daily Briefings',
    description: 'AI-generated morning digest with your upcoming reminders and memory serendipity.',
  },
  {
    icon: Users,
    title: 'Team Workspaces',
    description: 'Shared memory spaces for teams. Collaborate on institutional knowledge effortlessly.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-xl text-text-primary">MemoraX</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/features" className="text-primary">Features</Link>
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary">Pricing</Link>
            <Link href="/sign-in" className="px-4 py-2 text-text-secondary hover:text-text-primary">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-primary hover:bg-primary-glow text-white rounded-lg"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
              Features That Make MemoraX <span className="text-gradient">Powerful</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need to capture, organize, and recall your digital life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl border border-border bg-surface hover:border-primary transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-text-muted text-sm">
            © 2024 MemoraX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
