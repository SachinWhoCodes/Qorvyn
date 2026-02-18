import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronDown, MessageCircle, CheckCircle } from 'lucide-react';

const FAQ = [
  { q: 'How does Qorvyn work?', a: 'Qorvyn listens to your live conversation via microphone, processes the audio in real time, and provides context cards, predictions, and suggested talking points.' },
  { q: 'Is my audio stored?', a: 'No. Audio is processed in real time to generate context. We do not store or record your conversations. You control start/stop at all times.' },
  { q: 'What are credits?', a: '1 credit = 1 minute of active listening. You get 100 free credits on sign-up and can purchase more in the Wallet.' },
  { q: 'How do I recharge credits?', a: 'Go to Wallet, select a pack or enter a custom amount, pay via UPI, and submit your transaction details. Credits are added after verification.' },
  { q: 'What languages are supported?', a: 'Currently English. Multi-language support is coming soon with the Pro plan.' },
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Support</h1>

        {/* FAQ */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2 mb-10">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3 text-sm text-muted-foreground animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Contact Us</h2>
          </div>

          {submitted ? (
            <div className="text-center py-6 animate-fade-in">
              <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="text-sm text-foreground">Message sent! We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" rows={4} className="text-sm" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground">Send message</Button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
