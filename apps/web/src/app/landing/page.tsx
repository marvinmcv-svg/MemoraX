import Link from 'next/link';
import { ArrowRight, Brain, Zap, Shield, Sparkles, ChevronDown, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background-base overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-background-base to-background-base" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background-base/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-glow-primary">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl text-text-primary">MemoraX</span>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/features" className="text-text-secondary hover:text-text-primary transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/sign-in" className="text-text-secondary hover:text-text-primary transition-colors">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-400 transition-all shadow-glow-primary hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-400 font-medium">AI-Powered Memory OS</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 tracking-tight animate-slide-up">
            Your AI Memory That
            <br />
            <span className="text-gradient-primary">Never Forgets</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            MemoraX captures everything — reminders, tasks, notes, voice memos — across all your channels.
            AI-powered semantic search helps you recall anything instantly.
</p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold text-lg transition-all hover:bg-primary-400 shadow-glow-primary hover:shadow-lg hover:scale-[1.02]"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-2 px-8 py-4 border border-border text-text-primary rounded-xl font-semibold text-lg transition-all hover:bg-surface hover:border-primary-500/30"
            >
              View Demo
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-6 h-6 text-text-muted mx-auto" />
          </div>
        </div>
      </section>

      {/* Channels Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Capture from <span className="text-gradient-primary">Every Channel</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Your memories, unified. Connect WhatsApp, Telegram, Slack, SMS, or email — MemoraX handles them all.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'WhatsApp', emoji: '💬', color: '#25D366' },
              { name: 'Telegram', emoji: '✈️', color: '#0088CC' },
              { name: 'Slack', emoji: '⚡', color: '#4A154B' },
              { name: 'SMS', emoji: '📱', color: '#64748B' },
              { name: 'Email', emoji: '📧', color: '#EA4335' },
              { name: 'Voice', emoji: '🎤', color: '#6366F1' },
            ].map((channel, i) => (
              <div
                key={channel.name}
                className="group relative p-6 rounded-2xl border border-border bg-surface hover:border-primary-500/30 transition-all duration-300 hover:scale-[1.02]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative text-center">
                  <span className="text-4xl mb-3 block">{channel.emoji}</span>
                  <h3 className="font-medium text-text-primary">{channel.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              How It <span className="text-gradient-secondary">Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Capture Anything',
                desc: 'Send messages, voice notes, images, or emails. Our AI processes them all.',
                icon: Brain,
                color: 'primary',
              },
              {
                step: '02',
                title: 'AI Processing',
                desc: 'Intent classification, entity extraction, and semantic embedding — all automatic.',
                icon: Zap,
                color: 'secondary',
              },
              {
                step: '03',
                title: 'Smart Recall',
                desc: 'Search naturally: "what did I discuss about the project?" and find it instantly.',
                icon: Search,
                color: 'accent',
              },
              {
                step: '04',
                title: 'Proactive Reminders',
                desc: 'Daily briefings and timely reminders, delivered where you need them.',
                icon: Shield,
                color: 'primary',
              },
            ].map((feature, i) => (
              <div
                key={feature.step}
                className="group relative p-6 rounded-2xl border border-border bg-surface hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  <span className="text-5xl font-bold text-border/50 absolute -top-2 -right-2">
                    {feature.step}
                  </span>

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    feature.color === 'primary' ? 'bg-primary-500/10' :
                    feature.color === 'secondary' ? 'bg-secondary-500/10' :
                    'bg-accent-500/10'
                  }`}>
                    <feature.icon className={`w-6 h-6 ${
                      feature.color === 'primary' ? 'text-primary-400' :
                      feature.color === 'secondary' ? 'text-secondary-400' :
                      'text-accent-400'
                    }`} />
                  </div>

                  <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl border border-border bg-surface overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-surface to-secondary-500/10" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Ready to Never Forget?
              </h2>
              <p className="text-xl text-text-secondary mb-8 max-w-xl mx-auto">
                Start your free trial today. No credit card required.
              </p>
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold text-lg transition-all hover:bg-primary-400 shadow-glow-primary hover:shadow-lg hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-text-primary">MemoraX</span>
          </Link>
          <p className="text-text-muted text-sm">
            © 2024 MemoraX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
