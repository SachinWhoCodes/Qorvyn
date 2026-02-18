import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { TranscriptPanel } from '@/components/copilot/TranscriptPanel';
import { KnowledgePanel } from '@/components/copilot/KnowledgePanel';
import { PredictionsPanel } from '@/components/copilot/PredictionsPanel';
import { useApp } from '@/contexts/AppContext';
import { Shield, WifiOff } from 'lucide-react';

const TABS = ['Transcript', 'Knowledge', 'Next 5 Min'] as const;

const Index = () => {
  const { isListening, user, demoSecondsUsed } = useApp();
  const [mobileTab, setMobileTab] = useState<typeof TABS[number]>('Transcript');

  const demoRemaining = user ? null : Math.max(0, 180 - demoSecondsUsed);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Layout>
      {/* Demo banner */}
      {!user && demoRemaining !== null && demoRemaining < 180 && (
        <div className="bg-accent border-b border-border px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-accent-foreground">
          <span className="font-medium">{formatTime(demoRemaining)} trial remaining</span>
          <span className="text-muted-foreground">—</span>
          <button onClick={() => window.location.href = '/register'} className="text-primary font-medium hover:underline">
            Sign up to continue
          </button>
        </div>
      )}

      {/* Privacy note */}
      <div className="border-b border-border px-4 py-1 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <Shield className="w-2.5 h-2.5" />
        Audio is processed locally to generate context. You control start/stop at all times.
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden border-b border-border flex">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${
              mobileTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:flex h-[calc(100vh-6.5rem)]">
        <div className="w-[35%] border-r border-border overflow-hidden">
          <TranscriptPanel />
        </div>
        <div className="w-[35%] border-r border-border overflow-hidden">
          <KnowledgePanel />
        </div>
        <div className="w-[30%] overflow-hidden">
          <PredictionsPanel />
        </div>
      </div>

      {/* Mobile: tabbed view */}
      <div className="lg:hidden h-[calc(100vh-8rem)]">
        {mobileTab === 'Transcript' && <TranscriptPanel />}
        {mobileTab === 'Knowledge' && <KnowledgePanel />}
        {mobileTab === 'Next 5 Min' && <PredictionsPanel />}
      </div>
    </Layout>
  );
};

export default Index;
