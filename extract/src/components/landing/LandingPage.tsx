import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import InteractiveScanner from '../ui/InteractiveScanner';
import { 
  Signal, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Globe, 
  Bot, 
  EyeOff, 
  ChevronRight, 
  Activity, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  Briefcase, 
  MapPin, 
  TrendingUp, 
  Check 
} from 'lucide-react';

export default function LandingPage() {
  const { triggerAudit, setAuthModalOpen, setAuthModalView, setView } = useApp();
  
  // Interactive Live Demo custom audit Form
  const [bizName, setBizName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  
  // Scoring state for simulated running
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStepMsg, setAuditStepMsg] = useState('');

  // Built-in static Demo state so user can evaluate before submitting
  const demoPreview = {
    businessName: 'Acme SEO',
    visibilityScore: 32,
    topCompetitor: 'BrightSEO',
    competitorMultiplier: 18,
    missingQueries: 14,
    citationGaps: 22
  };

  const startAnimatedLiveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName || !category || !city) {
      alert('Please fill out all search credentials to launch search scanning');
      return;
    }

    setIsAuditing(true);
    setAuditProgress(5);
    setAuditStepMsg('Initializing secure resonance probe...');

    const interval = setInterval(() => {
      setAuditProgress(prev => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 100) {
          clearInterval(interval);
          setAuditStepMsg('Syncing telemetry vectors...');
          setTimeout(() => {
            setIsAuditing(false);
            setAuditProgress(0);
            triggerAudit(bizName, category, city);
          }, 600);
          return 100;
        }
        
        // Progress Messages
        if (next > 80) setAuditStepMsg('Compiling ChatGPT & Gemini comparison gaps...');
        else if (next > 55) setAuditStepMsg('Querying conversational indices for Claude references...');
        else if (next > 30) setAuditStepMsg('Running 400 recommendation audits in parallel...');
        else if (next > 15) setAuditStepMsg('Spawning virtual agentic recommendation workers...');
        
        return next;
      });
    }, 180);
  };

  const handleSeeSampleReport = () => {
    setView('overview');
  };

  return (
    <div className="relative w-full overflow-hidden bg-brand-bg min-h-screen text-brand-text selection:bg-brand-primary selection:text-brand-bg" id="landing-main-view">
      {/* Structural Ambient Grid Backgrounds */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-radial-gradient opacity-30 pointer-events-none" />
      <div className="absolute top-[800px] left-1/4 right-0 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] pointer-events-none" />

      {/* Landing Navigation Header */}
      <header className="relative z-30 border-b border-brand-border/60 bg-brand-bg/80 backdrop-blur-md sticky top-0" id="landing-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setView('overview')} id="landing-badge">
            <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-primary/25 flex items-center justify-center text-brand-primary">
              <Signal className="w-4 h-4" />
            </div>
            <span className="font-display font-medium text-lg tracking-tight text-brand-text">Dhwani</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-brand-muted">
            <a href="#problem" className="hover:text-brand-text transition-colors">The Invisible Gap</a>
            <a href="#how-it-works" className="hover:text-brand-text transition-colors">How it works</a>
            <a href="#features" className="hover:text-brand-text transition-colors">Features</a>
            <a href="#pricing" className="hover:text-brand-text transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setAuthModalView('signIn');
                setAuthModalOpen(true);
              }}
              className="text-brand-muted hover:text-brand-text text-xs font-mono px-3 py-1.5 transition-colors cursor-pointer"
              id="nav-signin-btn"
            >
              Log In
            </button>
            <button 
              onClick={() => {
                setAuthModalView('signUp');
                setAuthModalOpen(true);
              }}
              className="bg-brand-primary hover:bg-brand-accent text-brand-bg text-xs font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(42,161,152,0.3)]"
              id="nav-signup-btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative z-20 pt-16 pb-12 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="hero">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 bg-brand-surface border border-brand-border px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider text-brand-accent uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen SEO for Conversational Search</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium tracking-tight text-white leading-[1.1]">
              Google ranks you.<br className="hidden sm:inline" />
              <span className="text-brand-accent text-glow bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary">AI recommends you.</span>
            </h1>
            
            <p className="text-sm sm:text-base text-brand-muted max-w-xl leading-relaxed font-sans font-light">
              See how often ChatGPT, Claude, Gemini and Perplexity recommend your business compared to competitors in hundreds of structured buyer-choice scenarios.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href="#live-demo" 
                className="bg-brand-primary hover:bg-brand-accent text-brand-bg px-5 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 group transition-all cursor-pointer shadow-[0_4px_20px_rgba(42,161,152,0.15)]"
                id="hero-free-audit-cta"
              >
                <span>Run Free Recommendation Audit</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <button 
                onClick={handleSeeSampleReport}
                className="bg-brand-surface hover:bg-brand-card text-brand-text border border-brand-border px-5 py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="hero-example-report-cta"
              >
                <span>See Example Report</span>
                <ChevronRight className="w-4 h-4 text-brand-accent" />
              </button>
            </div>

            {/* Quick social proof metrics */}
            <div className="pt-8 border-t border-brand-border/40 grid grid-cols-3 gap-4 font-mono text-[10px]">
              <div>
                <span className="block text-brand-accent text-sm sm:text-base font-bold">14+ Seconds</span>
                <span className="text-brand-muted">Median audit run time</span>
              </div>
              <div>
                <span className="block text-brand-accent text-sm sm:text-base font-bold">120k+ Prompts</span>
                <span className="text-brand-muted">Daily recommendation checks</span>
              </div>
              <div>
                <span className="block text-brand-accent text-sm sm:text-base font-bold">99.4% Sync</span>
                <span className="text-brand-muted">Platform citation mapping</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <InteractiveScanner />
          </div>
        </div>
      </section>

      {/* 2. LIVE INTERACTIVE DEMO AUDIT BAR SECTION */}
      <section className="relative z-20 py-16 bg-brand-surface/40 border-y border-brand-border/60 scroll-mt-20" id="live-demo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
            <span className="text-[10px] font-mono text-brand-primary uppercase tracking-widest">Interactive Audit Simulator</span>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-white">
              Witness conversational intelligence in action
            </h2>
            <p className="text-xs text-brand-muted leading-relaxed">
              Test your business parameters below. We launch simulated prompts parsing OpenAI, Anthropic, Google, and Perplexity reference indexes to evaluate your resonance core.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* The Audit Tool Form */}
            <div className="bg-brand-card p-6 rounded-2xl border border-brand-primary/25 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary/20 via-brand-accent to-brand-primary/20 animate-pulse" />
              
              {isAuditing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-primary/10 border-t-brand-accent animate-spin" />
                    <Signal className="w-6 h-6 text-brand-primary animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <span className="block font-mono text-xs text-brand-accent">{auditStepMsg}</span>
                    <span className="block text-2xl font-bold font-display text-white">{auditProgress}% COMPLETE</span>
                  </div>
                  {/* Progress Indicator Bar */}
                  <div className="w-full max-w-md h-1.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                    <div className="h-full bg-brand-primary" style={{ width: `${auditProgress}%` }} />
                  </div>
                </div>
              ) : (
                <form onSubmit={startAnimatedLiveAudit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-1.5">Business Name</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Agency"
                          value={bizName}
                          onChange={(e) => setBizName(e.target.value)}
                          className="w-full bg-brand-bg pl-9 pr-3 py-2 text-sm text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-1.5">Category</label>
                      <div className="relative">
                        <Sliders className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. SEO Agency, Dentist, Consultant"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-brand-bg pl-9 pr-3 py-2 text-sm text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-1.5">Target City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Chicago, New York"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-brand-bg pl-9 pr-3 py-2 text-sm text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full cursor-pointer bg-brand-primary hover:bg-brand-accent text-brand-bg font-semibold text-xs py-3 rounded-lg flex items-center justify-center gap-2 mt-4 hover:shadow-[0_0_15px_rgba(42,161,152,0.3)] transition-all uppercase tracking-wider"
                    id="submit-interactive-audit-btn"
                  >
                    <Search className="w-4 h-4" />
                    <span>Generate Instant Live Audit</span>
                  </button>
                </form>
              )}

              {/* Default Mock stats layout representation below */}
              <div className="mt-8 pt-6 border-t border-brand-border/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-brand-bg rounded-xl p-3 border border-brand-border/60">
                  <span className="block text-[10px] font-mono text-brand-muted uppercase">Mock Business</span>
                  <span className="text-sm font-medium text-white">{demoPreview.businessName}</span>
                </div>
                <div className="bg-brand-bg rounded-xl p-3 border border-brand-border/60">
                  <span className="block text-[10px] font-mono text-brand-muted uppercase">AI VISIBILITY SCORE</span>
                  <span className="text-sm font-bold text-[#2AA198] text-glow">{demoPreview.visibilityScore}%</span>
                </div>
                <div className="bg-brand-bg rounded-xl p-3 border border-brand-border/60">
                  <span className="block text-[10px] font-mono text-brand-muted uppercase">TOP COMPETITOR</span>
                  <span className="text-sm font-medium text-brand-accent">{demoPreview.topCompetitor} (Appears {demoPreview.competitorMultiplier}x more)</span>
                </div>
                <div className="bg-brand-bg rounded-xl p-3 border border-brand-border/60">
                  <span className="block text-[10px] font-mono text-brand-muted uppercase">MISSING / CITATIONS GAPS</span>
                  <span className="text-sm font-medium text-white">{demoPreview.missingQueries} / {demoPreview.citationGaps}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM SECTION */}
      <section className="relative z-20 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20" id="problem">
        <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
          <span className="text-[10px] font-mono text-brand-primary uppercase tracking-widest">A Fatal Blindspot</span>
          <h2 className="text-3xl md:text-4xl font-display font-medium text-white">
            You might rank #1 and still be invisible.
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed font-sans font-light">
            Traditional SEO focuses on page-rank matching strings. Conversational bots synthesize unstructured context from multiple sources and formulate answers using proprietary recommend layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border/70 hover:border-brand-primary/25 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-brand-bg flex items-center justify-center border border-white/5 text-brand-muted">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-medium text-white">Google Search</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                The traditional user goes to Google, types standard keywords, looks at list search positions, and clicks on local domain URLs. Easy to rank with backlink metrics.
              </p>
            </div>
            <div className="mt-8 text-[11px] font-mono text-[#1F7A72]">
              DECONSTRUCTED INDEX MATCHING
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-brand-surface rounded-2xl p-6 border border-brand-primary/25 glow-border transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 text-brand-accent">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-medium text-brand-accent">AI Search Answer</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                The modern customer enters complex prompts ("Which boutique agency supports Chicago startups?"). LLMs scan citation-clusters, map entities, and recommend precisely three players.
              </p>
            </div>
            <div className="mt-8 text-[11px] font-mono text-brand-accent text-glow">
              SYNTHESIZED RECOMMENDER LAYER
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border/70 hover:border-brand-accent/20 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-brand-bg flex items-center justify-center border border-white/5 text-[#E68E97]">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-medium text-white">The Reality</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                If the underlying models retrieve no credible evidence matching your brand entity within key reference layers, you simply do not exist. Your visibility drops to absolute zero.
              </p>
            </div>
            <div className="mt-8 text-[11px] font-mono text-[#E68E97]">
              CITATION BLINDNESS RISK
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="relative z-20 py-20 bg-brand-surface/20 border-y border-brand-border/50 scroll-mt-20" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16 max-w-md mx-auto">
            <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Procedural Architecture</span>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-white">
              Dynamic Recommendation Auditing
            </h2>
          </div>

          {/* Timeline format */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Horizontal progress guide line */}
            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary opacity-30 z-0" />

            <div className="relative z-10 text-left space-y-3 flex flex-col items-start bg-brand-card/40 md:bg-transparent p-5 md:p-0 rounded-xl border border-brand-border/40 md:border-none">
              <div className="w-11 h-11 rounded-full bg-brand-surface border border-brand-primary/40 flex items-center justify-center font-mono text-xs font-bold text-brand-accent">
                01
              </div>
              <h4 className="text-sm font-medium text-white">Enter your business</h4>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                Provide your core operating category and location vectors to identify active conversational bounds of your client sector.
              </p>
            </div>

            <div className="relative z-10 text-left space-y-3 flex flex-col items-start bg-brand-card/40 md:bg-transparent p-5 md:p-0 rounded-xl border border-brand-border/40 md:border-none">
              <div className="w-11 h-11 rounded-full bg-brand-surface border border-brand-primary/40 flex items-center justify-center font-mono text-xs font-bold text-brand-accent">
                02
              </div>
              <h4 className="text-sm font-medium text-white">Audit prompt execution</h4>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                Our multi-agent search grid runs hundreds of recursive prompt variations modeling modern customer discovery routines.
              </p>
            </div>

            <div className="relative z-10 text-left space-y-3 flex flex-col items-start bg-brand-card/40 md:bg-transparent p-5 md:p-0 rounded-xl border border-brand-border/40 md:border-none">
              <div className="w-11 h-11 rounded-full bg-brand-surface border border-brand-primary/40 flex items-center justify-center font-mono text-xs font-bold text-brand-accent">
                03
              </div>
              <h4 className="text-sm font-medium text-white">Compare the competitor</h4>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                Deconstruct who AI bots recommend instead of your services, mapping respective reference channels and authority index.
              </p>
            </div>

            <div className="relative z-10 text-left space-y-3 flex flex-col items-start bg-brand-card/40 md:bg-transparent p-5 md:p-0 rounded-xl border border-brand-border/40 md:border-none">
              <div className="w-11 h-11 rounded-full bg-brand-primary/15 border border-brand-accent/40 flex items-center justify-center font-mono text-xs font-bold text-brand-accent text-glow animate-pulse">
                04
              </div>
              <h4 className="text-sm font-medium text-brand-accent">Fix visibility gaps</h4>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                Publish high quality data clusters tailored to target AI index configurations to secure persistent model citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURES SECTION */}
      <section className="relative z-20 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20" id="features">
        <div className="text-center space-y-3 mb-16 max-w-md mx-auto">
          <span className="text-[10px] font-mono text-brand-primary uppercase tracking-widest">Enterprise Core Capabilities</span>
          <h2 className="text-2xl md:text-3xl font-display font-medium text-white">
            Engineered for Deep Resonance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-brand-card rounded-2xl p-6 border border-brand-border hover:border-brand-primary/30 transition-all hover:-translate-y-1">
            <Activity className="w-5 h-5 text-brand-accent mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">AI Visibility Score</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Consolidated real-time index estimating your exact recommendation frequency across top language networks.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-brand-card rounded-2xl p-6 border border-brand-border hover:border-brand-primary/30 transition-all hover:-translate-y-1">
            <TrendingUp className="w-5 h-5 text-brand-accent mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">Competitor Detection</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Scan competitor citation densities and identify exactly who ChatGPT mentions when search parameters match your business tags.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-brand-card rounded-2xl p-6 border border-brand-border hover:border-brand-primary/30 transition-all hover:-translate-y-1">
            <Globe className="w-5 h-5 text-brand-accent mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">Citation Gap Analysis</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Locate specific community blogs, wikis, and discussion grids where models crawl reference context for recommendation.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-brand-card rounded-2xl p-6 border border-brand-border hover:border-brand-primary/30 transition-all hover:-translate-y-1">
            <Search className="w-5 h-5 text-brand-accent mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">Missing Queries</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Unlock the critical search phrases and intent sequences where competitors appear and your organization falls draft blind.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-brand-card rounded-2xl p-6 border border-brand-border hover:border-brand-primary/30 transition-all hover:-translate-y-1">
            <FileText className="w-5 h-5 text-brand-accent mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">Content Suggestions</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Generate actionable, structured schema-perfect copy guides to optimize crawl density and accelerate model indexing.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-brand-card rounded-2xl p-6 border border-brand-border hover:border-brand-primary/30 transition-all hover:-translate-y-1">
            <ShieldCheck className="w-5 h-5 text-brand-accent mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">Shareable Report Cards</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Publish structured web-cards highlighting recommendations status to back trust indicators for prospective customers.
            </p>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON SECTION */}
      <section className="relative z-20 py-20 bg-brand-surface/30 border-y border-brand-border/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12 max-w-md mx-auto">
            <span className="text-[10px] font-mono text-brand-primary uppercase tracking-widest">Industry Evolution</span>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-white">
              Traditional SEO vs. Dhwani
            </h2>
          </div>

          <div className="max-w-4xl mx-auto bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-bg/50 border-b border-brand-border font-mono text-brand-muted text-[10px] uppercase tracking-wider">
                  <th className="p-4 sm:p-5">Strategic Parameter</th>
                  <th className="p-4 sm:p-5">Traditional SEO Platforms</th>
                  <th className="p-4 sm:p-5 text-brand-accent">Dhwani Optimization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40 text-brand-text/90">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Primary Focus Vector</td>
                  <td className="p-4 sm:p-5 text-brand-muted">Search Engine Page Position & domain index rank</td>
                  <td className="p-4 sm:p-5 text-brand-accent bg-brand-primary/5 font-medium">Model Choice recommending probability & citation resonance</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Target Platforms</td>
                  <td className="p-4 sm:p-5 text-brand-muted">Google Bot, Bing Crawler indexes</td>
                  <td className="p-4 sm:p-5 text-brand-accent bg-brand-primary/5 font-medium">ChatGPT / Claude / Gemini / Perplexity core parameters</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Authority Calculation</td>
                  <td className="p-4 sm:p-5 text-brand-muted">Domain backlinks weight, anchor text strings</td>
                  <td className="p-4 sm:p-5 text-brand-accent bg-brand-primary/5 font-medium">Entity co-occurrence density & community recommendations</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Crawl Optimization Technique</td>
                  <td className="p-4 sm:p-5 text-brand-muted">Meta description attributes, image tag tags</td>
                  <td className="p-4 sm:p-5 text-brand-accent bg-brand-primary/5 font-medium">Unstructured Q&A optimization & JSON-LD context tags</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Reporting Interval</td>
                  <td className="p-4 sm:p-5 text-brand-muted">Delayed weekly keyword tracking rankings</td>
                  <td className="p-4 sm:p-5 text-brand-accent bg-brand-primary/5 font-medium">On-demand recursive agent scans simulating active buyers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
      <section className="relative z-20 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16 max-w-md mx-auto">
          <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Industry Reviews</span>
          <h2 className="text-2xl md:text-3xl font-display font-medium text-white">
            Trusted by Modern Integrators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border/60 flex flex-col justify-between">
            <p className="text-xs text-brand-muted leading-relaxed font-light italic">
              "We ranked #1 for 'enterprise design system studio SF' on standard search interfaces, yet noticed a sharp drop in inbound organic conversions. Dhwani proved Claude was recommending two boutique agencies instead of us due to missing forum density. Fixing that citation network saved our sales pipe."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-card flex items-center justify-center border border-brand-primary/20 text-brand-accent text-xs font-semibold">
                MR
              </div>
              <div>
                <span className="block text-xs font-semibold text-white">Marc Raymond</span>
                <span className="block text-[10px] text-brand-muted font-mono">Principal of ShiftLabs, SF</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border/60 flex flex-col justify-between">
            <p className="text-xs text-brand-muted leading-relaxed font-light italic">
              "We integrated Dhwani within our weekly marketing workflow. Being able to run on-demand recommendation audits and get immediate schema updates lets you treat AI research engines as genuine growth systems."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-card flex items-center justify-center border border-brand-primary/20 text-brand-accent text-xs font-semibold">
                EL
              </div>
              <div>
                <span className="block text-xs font-semibold text-white">Eva Lindqvist</span>
                <span className="block text-[10px] text-brand-muted font-mono">SEO Director, Nordic Scale</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section className="relative z-20 py-20 bg-brand-surface/20 border-y border-brand-border/40 scroll-mt-20" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16 max-w-md mx-auto">
            <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Enterprise Options</span>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-white">
              Pick Your Optimization Pace
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-brand-card rounded-2xl p-6 border border-brand-border flex flex-col justify-between hover:border-brand-primary/25 transition-all">
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">Baseline Test</span>
                <h3 className="text-xl font-medium text-white">Free Plan</h3>
                <div className="text-2xl font-bold font-display text-white">$0</div>
                <p className="text-xs text-brand-muted">Try out Dhwani recommendations metrics for exactly one brand audit instance.</p>
                <div className="pt-4 border-t border-brand-border/40 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> <span>1 Comprehensive audit</span></div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> <span>SaaS Landing Preview metrics</span></div>
                  <div className="flex items-center gap-2 text-brand-muted/60"><Check className="w-3.5 h-3.5" /> <span>No competitor historical tracking</span></div>
                  <div className="flex items-center gap-2 text-brand-muted/60"><Check className="w-3.5 h-3.5" /> <span>No CSV audit exports</span></div>
                </div>
              </div>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="mt-8 w-full py-2 bg-brand-surface border border-brand-border text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-brand-card transition-all"
                id="free-pricing-selector-btn"
              >
                Launch Account
              </button>
            </div>

            {/* Pro */}
            <div className="bg-brand-card rounded-2xl p-6 border border-brand-primary/30 glow-border flex flex-col justify-between relative hover:border-brand-accent/55 transition-all">
              <div className="absolute top-4 right-4 bg-brand-primary/10 border border-brand-primary/20 rounded px-2 py-0.5 text-[9px] font-mono text-brand-accent">
                POPULAR CHOICE
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-brand-accent uppercase tracking-wider">Continuous Growth</span>
                <h3 className="text-xl font-medium text-brand-accent">Pro Plan</h3>
                <div className="text-2xl font-bold font-display text-white">$49<span className="text-xs text-brand-muted font-normal"> / month</span></div>
                <p className="text-xs text-brand-muted">Perfect for established founders and growth teams seeking active bot sync updates.</p>
                <div className="pt-4 border-t border-brand-border/40 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent animate-pulse" /> <span>Unlimited audits and checks</span></div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Track up to 5 competitors</span></div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Weekly recursive scan alerts</span></div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-accent" /> <span>Exportable raw metrics sheets (CSV)</span></div>
                </div>
              </div>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="mt-8 w-full py-2 bg-brand-primary hover:bg-brand-accent text-brand-bg text-xs font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-[0_0_10px_rgba(42,161,152,0.2)]"
                id="pro-pricing-selector-btn"
              >
                Optimize to Pro
              </button>
            </div>

            {/* Agency */}
            <div className="bg-brand-card rounded-2xl p-6 border border-brand-border flex flex-col justify-between hover:border-brand-primary/25 transition-all">
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">Whitelabel Scale</span>
                <h3 className="text-xl font-medium text-white">Agency Plan</h3>
                <div className="text-2xl font-bold font-display text-white">$149<span className="text-xs text-brand-muted font-normal"> / month</span></div>
                <p className="text-xs text-brand-muted">Designed for marketing bureaus managing comprehensive client brand portfolios.</p>
                <div className="pt-4 border-t border-brand-border/40 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> <span>Up to 25 distinct brand profiles</span></div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> <span>Whitelabel customizable reports</span></div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> <span>Daily model presence scrapes</span></div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> <span>Custom API endpoint integrations</span></div>
                </div>
              </div>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="mt-8 w-full py-2 bg-brand-surface border border-brand-border text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-brand-card transition-all"
                id="agency-pricing-selector-btn"
              >
                Scale with Agency
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA SECTION */}
      <section className="relative z-20 py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-mt-20">
        <div className="bg-gradient-to-r from-brand-surface to-brand-card rounded-3xl p-8 md:p-14 border border-brand-primary/20 glow-border relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 w-36 h-36 bg-radial-gradient opacity-10 pointer-events-none" />
          
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center border border-brand-primary/20 text-brand-accent mb-6">
            <Signal className="w-5 h-5 animate-ping" />
          </div>

          <h2 className="text-3xl md:text-5xl font-display font-medium text-white max-w-2xl leading-[1.2]">
            "If AI doesn't know you,<br />your customers won't either."
          </h2>
          
          <p className="text-xs md:text-sm text-brand-muted max-w-lg mt-4 leading-relaxed font-light">
            Claim your persistent presence core inside Language Recommender Systems. Launch a fully audited trace of your business metrics in 15 seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a 
              href="#live-demo"
              className="bg-brand-primary hover:bg-brand-accent text-brand-bg text-xs font-bold py-3 px-6 rounded-xl cursor-pointer select-none transition-all hover:shadow-[0_0_15px_rgba(42,161,152,0.3)] uppercase tracking-wider"
              id="final-cta-primary-btn"
            >
              Run Free Recommendation Audit
            </a>
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="bg-brand-bg hover:bg-brand-card text-brand-text border border-brand-border text-xs font-medium py-3 px-6 rounded-xl cursor-pointer select-none transition-all"
              id="final-cta-secondary-btn"
            >
              Authenticate Securely
            </button>
          </div>

          {/* Core system indicator */}
          <div className="mt-8 flex items-center gap-2 text-[10px] font-mono text-brand-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            <span>Telemetry online: 4 active networks connected</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-brand-border/40 py-10 bg-brand-bg text-brand-muted text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-brand-primary" />
            <span className="text-brand-text font-medium">Dhwani Corp. © 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="#problem" className="hover:text-brand-text transition-colors">Documentation</a>
            <a href="#how-it-works" className="hover:text-brand-text transition-colors">Privacy</a>
            <a href="#features" className="hover:text-brand-text transition-colors">API Endpoint</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
