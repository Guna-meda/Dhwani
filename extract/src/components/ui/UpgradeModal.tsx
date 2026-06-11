import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Check, ArrowRight, Zap, Target, Layers } from 'lucide-react';

export default function UpgradeModal() {
  const { isUpgradeModalOpen, setUpgradeModalOpen, setView } = useApp();

  if (!isUpgradeModalOpen) return null;

  const handleSelectPlan = () => {
    setUpgradeModalOpen(false);
    setView('billing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="upgrade-paywall-modal">
      <div className="relative w-full max-w-xl bg-brand-surface border border-brand-border rounded-2xl p-6 md:p-8 overflow-hidden glow-border">
        {/* Subtle decorative colors */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-brand-primary/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-brand-secondary/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setUpgradeModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-brand-muted hover:text-brand-text hover:bg-brand-card rounded-md transition-colors"
          aria-label="Close upgrade paywall modal"
          id="close-upgrade-paywall-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Header */}
        <div className="flex flex-col items-center text-center max-w-md mx-auto mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-card border border-brand-border mb-3.5 text-brand-accent">
            <Sparkles className="w-5 h-5 text-brand-accent" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-brand-accent">Dhwani Premium Tier</span>
          <h3 className="text-xl md:text-2xl font-display font-medium text-brand-text mt-2">
            You've used your free audit.
          </h3>
          <p className="text-xs text-brand-muted mt-2">
            LLM recommendation queries are resource-intensive. Unlock continuous optimization tracking, detailed citation audits, and premium competitive analytics.
          </p>
        </div>

        {/* Grid Choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pro tier cards */}
          <div className="bg-brand-card rounded-xl p-5 border border-brand-border flex flex-col justify-between hover:border-brand-primary/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-brand-accent uppercase tracking-wider">Pro Tier</span>
                <span className="bg-brand-primary/10 text-brand-accent text-[9px] font-mono px-2 py-0.5 rounded border border-brand-primary/15">Recommended</span>
              </div>
              <h4 className="text-lg font-medium text-brand-text">$49<span className="text-xs text-brand-muted"> / mo</span></h4>
              <p className="text-[11px] text-brand-muted mt-1 leading-relaxed">
                Complete system response monitoring tailored for growing agencies.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-brand-text/90">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Unlimited audits & re-checks</span></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Competitor tracking (Up to 5)</span></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>PDF & CSV export reporting</span></li>
              </ul>
            </div>
            <button
              onClick={handleSelectPlan}
              className="mt-6 w-full py-2 bg-brand-primary hover:bg-brand-accent text-brand-bg rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all outline-none"
              id="select-pro-paywall-btn"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Agency tier cards */}
          <div className="bg-brand-bg rounded-xl p-5 border border-brand-border flex flex-col justify-between hover:border-brand-accent/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-brand-muted uppercase tracking-wider">Agency Tier</span>
              </div>
              <h4 className="text-lg font-medium text-brand-text">$149<span className="text-xs text-brand-muted"> / mo</span></h4>
              <p className="text-[11px] text-brand-muted mt-1 leading-relaxed">
                Whitelabel templates matching high performance standards for large bureaus.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-brand-text/90">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Multiple brands (Up to 25)</span></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Whitelabel customizable templates</span></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Dedicated weekly API audit</span></li>
              </ul>
            </div>
            <button
              onClick={handleSelectPlan}
              className="mt-6 w-full py-2 bg-brand-surface hover:bg-brand-card text-brand-accent border border-brand-border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all outline-none"
              id="select-agency-paywall-btn"
            >
              <span>Deploy Agency Tier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer text links */}
        <div className="mt-6 pt-5 border-t border-brand-border/40 text-center flex items-center justify-center gap-6 text-xs text-brand-muted">
          <span>Need custom enterprise volumes?</span>
          <button
            onClick={() => {
              setUpgradeModalOpen(false);
              setView('billing');
            }}
            className="text-brand-accent hover:underline focus:outline-none font-medium"
            id="view-full-pricing-btn"
          >
            Read details inside Billing Page
          </button>
        </div>
      </div>
    </div>
  );
}
