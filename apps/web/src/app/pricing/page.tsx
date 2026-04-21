import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '100 memories per month',
      '10 reminders per day',
      'WhatsApp, Telegram, SMS, Email, App',
      'Semantic search',
      'AI intent classification',
      'Entity extraction',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    description: 'For power users who want everything',
    features: [
      'Unlimited memories',
      'Unlimited reminders',
      'All channels including Slack',
      'Priority AI processing',
      'Daily AI briefings',
      'Advanced analytics',
      'API access',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: 'per user / month',
    description: 'For teams that share knowledge',
    features: [
      'Everything in Pro',
      'Shared workspaces',
      'Team memory spaces',
      'Role-based access',
      'Team briefings',
      'Admin controls',
      'SSO/SAML',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PricingPage() {
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
            <Link href="/features" className="text-text-secondary hover:text-text-primary">Features</Link>
            <Link href="/pricing" className="text-primary">Pricing</Link>
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
              Simple, <span className="text-gradient">Honest</span> Pricing
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              No hidden fees. No surprise charges. Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border ${
                  plan.highlighted
                    ? 'border-primary bg-surface glow-primary'
                    : 'border-border bg-surface'
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary text-white rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-text-secondary ml-2">{plan.period}</span>
                </div>
                <p className="text-text-secondary mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-text-secondary">
                      <Check className="w-5 h-5 text-secondary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`block text-center px-6 py-3 rounded-xl font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-primary hover:bg-primary-glow text-white'
                      : 'border border-border hover:border-primary text-text-primary'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-text-muted mt-12">
            All plans include a 14-day free trial. No credit card required.
          </p>
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
