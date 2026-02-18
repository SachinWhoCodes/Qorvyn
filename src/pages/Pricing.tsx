import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    credits: '100 mins',
    features: ['Live transcript', 'Context cards', 'Predictions', '3-min demo without login'],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    credits: '300 mins',
    features: ['Everything in Free', 'Priority processing', 'Export transcripts', 'Multi-language support'],
    cta: 'Buy credits',
    highlight: true,
  },
  {
    name: 'Team',
    price: '₹1,499',
    credits: '1000 mins',
    features: ['Everything in Pro', 'Team sharing', 'API access', 'Custom integrations', 'Dedicated support'],
    cta: 'Buy credits',
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Simple, credit-based pricing</h1>
        <p className="text-muted-foreground mb-12 max-w-md mx-auto">
          Start free with 100 minutes. Buy more credits when you need them. No subscriptions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 text-left transition-all ${
                plan.highlight
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-lg'
                  : 'border-border bg-card'
              }`}
            >
              <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">/ {plan.credits}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${plan.highlight ? 'bg-primary text-primary-foreground' : ''}`}
                variant={plan.highlight ? 'default' : 'outline'}
                onClick={() => navigate(plan.name === 'Free' ? '/register' : '/wallet')}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
