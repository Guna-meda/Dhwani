'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { ResonanceWaveChart, PlatformBars } from '@/components/charts/CustomBrandedCharts'
import { 
  Signal, 
  LayoutDashboard, 
  Search, 
  Users, 
  FileCheck, 
  CreditCard, 
  Settings, 
  Bell, 
  LogOut, 
  X, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle, 
  Play, 
  Share2, 
  Plus, 
  MapPin, 
  Sliders, 
  Briefcase, 
  AlertCircle, 
  Download, 
  Cpu, 
  RefreshCw 
} from 'lucide-react';

export default function DashboardLayout() {
  const { 
    user, 
    audits, 
    freeAuditsRemaining, 
    currentView, 
    setView, 
    logout, 
    triggerAudit, 
    setUpgradeModalOpen 
  } = useApp();

  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  
  // Local Audit Creator Form for Dashboard
  const [bizName, setBizName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Notifications drawer simulation
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotificationCount, setActiveNotificationCount] = useState(3);

  // Copied share state indicator
  const [isCopied, setIsCopied] = useState(false);

  // Menu items config
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'audits', name: 'Audits', icon: Search },
    { id: 'competitors', name: 'Competitors', icon: Users },
    { id: 'reports', name: 'Reports', icon: FileCheck },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'settings', name: 'Settings', icon: Settings },
  ] as const;

  // Retrieve selected audit
  const selectedAudit = audits.find(a => a.id === activeAuditId) || audits[0];

  const handleLaunchDashboardAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!bizName || !category || !city) {
      setErrorMsg('Please enter all parameters to spawn the query scanners');
      return;
    }

    setIsAuditing(true);

    try {
      const response = await triggerAudit(bizName, category, city);
      setIsAuditing(false);

      if (!response.success) {
        if (response.error === 'Paywall triggered') {
          setErrorMsg("You've used your free audit. Upgrade to Pro to unlock unlimited searches.");
        } else {
          setErrorMsg('An unexpected authentication error occurred.');
        }
        return;
      }

      setSuccessMsg('Audit completed successfully! View populated below.');
      setActiveAuditId(response.audit?.id || null);
      
      // Clear fields
      setBizName('');
      setCategory('');
      setCity('');

      // Redirect to detailed audits view
      setView('audits');
    } catch (err) {
      setIsAuditing(false);
      setErrorMsg('Failed to generate audit. Please try again.');
    }
  };

  const copyReportCardLink = () => {
    if (!selectedAudit) return;
    const shareText = `DHWANI AI VISIBILITY STATUS for ${selectedAudit.businessName}: ${selectedAudit.visibilityScore}% Visibility. Top competitor: ${selectedAudit.topCompetitor}.`;
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex overflow-hidden font-sans" id="dashboard-layout">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-brand-surface border-r border-brand-border shrink-0 z-20">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-brand-border cursor-pointer" onClick={() => setView('overview')} id="sidebar-logo-badge">
          <div className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Signal className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-display font-semibold text-sm tracking-tight text-brand-text block">Dhwani</span>
            <span className="text-[9px] font-mono text-brand-primary block leading-none">SIGNAL MONITOR</span>
          </div>
        </div>

        {/* User Workspace Info */}
        <div className="px-4 py-3.5 border-b border-brand-border bg-brand-bg/40">
          <span className="block text-[10px] font-mono text-brand-muted uppercase mb-1.5">Connected profile</span>
          <div className="flex items-center gap-3">
            <img 
              src={user?.avatarUrl || "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Explorer"} 
              alt="Profile avatar" 
              className="w-8 h-8 rounded-lg bg-brand-card border border-brand-border"
              referrerPolicy="no-referrer"
            />
            <div className="truncate">
              <span className="block text-xs font-semibold text-brand-text">{user?.firstName || 'Explorer'}</span>
              <span className="block text-[9px] font-mono text-brand-muted truncate">{user?.email || 'unassigned@domain.com'}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg text-left transition-all outline-none cursor-pointer ${
                  isActive 
                    ? 'bg-brand-primary/10 text-brand-accent font-semibold border-l-2 border-brand-primary pl-4' 
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-card/50'
                }`}
                id={`sidebar-link-${item.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-text'}`} />
                <span>{item.name}</span>
                {item.id === 'audits' && (
                  <span className="ml-auto bg-brand-primary/15 text-brand-accent text-[9px] font-mono px-1.5 py-0.2 rounded border border-brand-primary/20">
                    {freeAuditsRemaining} FREE
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar CTA paywall check */}
        <div className="p-4 border-t border-brand-border bg-brand-bg/40 space-y-2">
          <div className="bg-brand-card rounded-lg p-3 border border-brand-primary/10 text-center">
            <span className="block text-[9px] font-mono text-brand-accent mb-1 uppercase text-glow">Audit Capacity</span>
            <span className="text-sm font-semibold block text-brand-text mb-1">{freeAuditsRemaining} left</span>
            <div className="w-full bg-brand-bg h-1 rounded-full overflow-hidden">
              <div className="bg-brand-primary h-full" style={{ width: freeAuditsRemaining ? '100%' : '0%' }} />
            </div>
            {freeAuditsRemaining <= 0 && (
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="mt-2 text-[10px] text-brand-accent font-semibold flex items-center justify-center gap-1 mx-auto hover:underline cursor-pointer"
                id="sidebar-paywall-notice-btn"
              >
                <Sparkles className="w-3 h-3" />
                <span>Unlock Pro Limits</span>
              </button>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono text-brand-muted hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-900/40 cursor-pointer outline-none"
            id="sidebar-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Profile</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0" id="main-workspace-container">
        {/* TOP BAR */}
        <header className="h-16 border-b border-brand-border bg-brand-surface flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4 flex-1">
            {/* Quick Logo for mobile sizes */}
            <div className="lg:hidden flex items-center gap-2 cursor-pointer" onClick={() => setView('overview')} id="mobile-top-brand">
              <div className="w-7 h-7 rounded-md bg-brand-bg border border-brand-primary/25 flex items-center justify-center text-brand-primary">
                <Signal className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-medium text-sm tracking-tight text-brand-text">Dhwani</span>
            </div>

            {/* Simulated global search */}
            <div className="hidden sm:flex items-center gap-2 bg-brand-bg border border-brand-border px-3 py-1.5 rounded-lg max-w-sm w-full">
              <Search className="w-3.5 h-3.5 text-brand-muted" />
              <input
                type="text"
                readOnly
                placeholder="Search audit parameters, competitors..."
                className="text-[11px] bg-transparent text-brand-muted hover:text-brand-text w-full focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Menu Trigger */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setActiveNotificationCount(0);
                }}
                className="p-1.5 bg-brand-bg border border-brand-border hover:bg-brand-card rounded-lg text-brand-muted hover:text-brand-text cursor-pointer relative outline-none"
                aria-label="Toggle notifications menu"
                id="topbar-notifications-btn"
              >
                <Bell className="w-4 h-4" />
                {activeNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-primary rounded-full border border-brand-surface animate-bounce" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-brand-surface border border-brand-border rounded-xl shadow-xl p-4 z-50 text-left">
                  <div className="flex items-center justify-between border-b border-brand-border pb-2 mb-3">
                    <span className="text-xs font-semibold text-brand-text">System Alerts</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-brand-accent hover:underline">Dismiss</button>
                  </div>
                  <div className="space-y-3 max-h-52 overflow-y-auto">
                    <div className="p-2 rounded bg-brand-bg border border-brand-border/40 text-[11px] leading-relaxed">
                      <span className="font-semibold block text-brand-accent">ChatGPT Recommendation Audit completed</span>
                      <span>Your business reference is active in local indexes.</span>
                    </div>
                    <div className="p-2 rounded bg-brand-bg border border-brand-border/40 text-[11px] leading-relaxed">
                      <span className="font-semibold block text-brand-muted">Citation warning in Reddit /r/seo</span>
                      <span>Missing query density for keyword clusters.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Mobile logout link */}
            <button 
              onClick={logout} 
              className="lg:hidden p-1.5 bg-brand-bg border border-brand-border hover:bg-red-950/20 hover:border-red-900/40 rounded-lg text-brand-muted hover:text-red-400 transition-colors cursor-pointer outline-none"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Connected User Badge */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-brand-border">
              <div className="hidden md:block text-right">
                <span className="block text-xs font-semibold text-brand-text">{user?.firstName || 'Explorer'}</span>
                <span className="block text-[9px] font-mono text-brand-accent uppercase tracking-wider">Free Starter</span>
              </div>
              <img
                src={user?.avatarUrl || "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Explorer"}
                alt="Profile avatar badge"
                className="w-8 h-8 rounded-lg bg-brand-card border border-brand-border"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* DYNAMIC SCENE CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6" id="dashboard-content-frame">
          
          {/* A. OVERVIEW SUB-SCENE */}
          {currentView === 'overview' && (
            <div className="space-y-6 animate-fade-in" id="overview-scene">
              {/* Header block */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Main Diagnostics</span>
                  <h2 className="text-xl md:text-2xl font-display font-medium text-white">Dynamic Brand Resonance</h2>
                </div>
                {/* On demand checking banner */}
                <div className="flex items-center gap-3">
                  <div className="bg-brand-surface px-3 py-1.5 border border-brand-border rounded-lg text-xs font-mono text-brand-muted">
                    ACTIVE AUDITS: {audits.length}
                  </div>
                  <button
                    onClick={() => setView('audits')}
                    className="bg-brand-primary hover:bg-brand-accent text-brand-bg text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    id="trigger-new-audit-overview-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deploy Audit</span>
                  </button>
                </div>
              </div>

              {/* STATS BENTO MATRIX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Visual Score */}
                <div className="bg-brand-surface rounded-xl p-5 border border-brand-border flex flex-col justify-between hover:border-brand-primary/20 transition-all">
                  <div>
                    <span className="text-[10px] font-mono text-brand-muted uppercase">AI VISIBILITY INDEX</span>
                    <span className="block text-3xl font-bold text-brand-accent text-glow mt-2">{selectedAudit.visibilityScore}%</span>
                  </div>
                  <div className="text-[10px] text-brand-muted mt-3 font-mono">
                    Avg rating across Chatbots
                  </div>
                </div>

                {/* Top Competitor */}
                <div className="bg-brand-surface rounded-xl p-5 border border-brand-border flex flex-col justify-between hover:border-brand-primary/20 transition-all">
                  <div>
                    <span className="text-[10px] font-mono text-brand-muted uppercase">TOP COMPETITOR</span>
                    <span className="block text-base font-semibold text-white mt-2 truncate">{selectedAudit.topCompetitor}</span>
                  </div>
                  <div className="text-[10px] text-brand-accent mt-3 font-mono">
                    Appears {selectedAudit.competitorAdvantageFactor}x more often
                  </div>
                </div>

                {/* Citation Gap count */}
                <div className="bg-brand-surface rounded-xl p-5 border border-brand-border flex flex-col justify-between hover:border-brand-primary/20 transition-all">
                  <div>
                    <span className="text-[10px] font-mono text-brand-muted uppercase">CITATION GAPS</span>
                    <span className="block text-3xl font-semibold text-white mt-2">{selectedAudit.citationGapsCount}</span>
                  </div>
                  <div className="text-[10px] text-red-400 mt-3 font-mono">
                    Ref layers missing references
                  </div>
                </div>

                {/* Recent query parameters */}
                <div className="bg-brand-surface rounded-xl p-5 border border-brand-border flex flex-col justify-between hover:border-brand-primary/20 transition-all">
                  <div>
                    <span className="text-[10px] font-mono text-brand-muted uppercase">TARGET LOCATION</span>
                    <span className="block text-base font-semibold text-white mt-2 truncate">{selectedAudit.city || 'Chicago'}</span>
                  </div>
                  <div className="text-[10px] text-brand-muted mt-3 font-mono truncate">
                    Category: {selectedAudit.category}
                  </div>
                </div>
              </div>

              {/* CHART ANALYSIS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8">
                  <ResonanceWaveChart score={selectedAudit.visibilityScore} />
                </div>
                <div className="lg:col-span-4 bg-brand-surface rounded-xl border border-brand-border p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-brand-accent uppercase block">Resonance Rating</span>
                    <h4 className="text-sm font-medium text-white mt-1 mb-3">Model Recommendations</h4>
                    <PlatformBars breakdown={selectedAudit.platformBreakdown} />
                  </div>
                  <button
                    onClick={() => setView('audits')}
                    className="w-full mt-4 flex items-center justify-center gap-1 bg-brand-card hover:bg-brand-bg text-brand-accent border border-brand-border py-1.5 rounded text-[11px] transition-all cursor-pointer font-mono"
                    id="view-detailed-breakdowns-overview-btn"
                  >
                    <span>Inspect crawl sources</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AUDITS HISTORY LISTS */}
              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/40 mb-3">
                  <h3 className="text-sm font-medium text-white">Active Audit History ({audits.length})</h3>
                  <span className="text-[10px] font-mono text-brand-muted">SEEDED DIRECTIVES</span>
                </div>

                {audits.length === 0 ? (
                  <p className="text-xs text-brand-muted text-center py-6">No audits computed yet. Deploy one above!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-brand-border/40 font-mono text-brand-muted text-[9px] uppercase">
                          <th className="py-2.5">Business / Agency</th>
                          <th className="py-2.5">Sector</th>
                          <th className="py-2.5">Target City</th>
                          <th className="py-2.5">Visibility Index</th>
                          <th className="py-2.5">Top Opponent</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/20 text-brand-text/90">
                        {audits.map((item) => (
                          <tr key={item.id} className="hover:bg-brand-card/20 transition-all">
                            <td className="py-3 font-medium text-white">{item.businessName}</td>
                            <td className="py-3 font-mono text-[10px]">{item.category}</td>
                            <td className="py-3 font-mono text-[10px] text-brand-muted">{item.city}</td>
                            <td className="py-3">
                              <span className="font-semibold text-brand-accent">{item.visibilityScore}%</span>
                            </td>
                            <td className="py-3 text-brand-muted truncate max-w-[120px]">{item.topCompetitor}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveAuditId(item.id);
                                  setView('audits');
                                }}
                                className="text-brand-accent hover:underline text-[10px] font-mono cursor-pointer"
                                id={`select-audit-history-row-${item.id}`}
                              >
                                View Detailed Report →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* B. AUDIT RESULTS SUB-SCENE (MAIN ENGINE VIEW) */}
          {currentView === 'audits' && (
            <div className="space-y-6 animate-fade-in" id="audits-scene">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-brand-border/40">
                <div>
                  <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Active Audit Scan</span>
                  <h2 className="text-xl md:text-2xl font-display font-medium text-white">
                    {selectedAudit?.businessName || 'Entity Diagnostics'}
                  </h2>
                </div>
                {/* Audit selection dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-brand-muted">Selected Result:</span>
                  <select
                    value={selectedAudit?.id || ''}
                    onChange={(e) => setActiveAuditId(e.target.value)}
                    className="bg-brand-surface text-brand-text border border-brand-border text-xs px-2.5 py-1.5 rounded-lg max-w-[180px] focus:outline-none focus:border-brand-primary"
                    id="active-audit-selector-dropdown"
                  >
                    {audits.map(a => (
                      <option key={a.id} value={a.id}>{a.businessName} ({a.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LOCAL AUDIT GENERATION PANEL */}
              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <span className="block text-[10px] font-mono text-brand-accent uppercase mb-2">Run another recommendation scanner</span>
                <form onSubmit={handleLaunchDashboardAudit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-mono text-brand-muted uppercase mb-1">Company name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Legal"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full bg-brand-bg px-2.5 py-1.5 text-xs text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-mono text-brand-muted uppercase mb-1">Operating Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Attorney"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-brand-bg px-2.5 py-1.5 text-xs text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-mono text-brand-muted uppercase mb-1">Target Location City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Seattle"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-brand-bg px-2.5 py-1.5 text-xs text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={isAuditing}
                      className="w-full py-1.5 bg-brand-primary hover:bg-brand-accent disabled:opacity-50 text-brand-bg text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                      id="launch-sub-audit-form-btn"
                    >
                      {isAuditing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Auditing bots...</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Scan recommendation</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {errorMsg && (
                  <div className="mt-3 flex items-center gap-2 text-xs bg-red-950/20 text-red-300 p-2.5 rounded border border-red-900/40">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mt-3 flex items-center gap-2 text-xs bg-brand-primary/10 text-brand-accent p-2.5 rounded border border-brand-primary/20">
                    <CheckCircle className="w-4 h-4 text-brand-accent" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </div>

              {/* DETAILED DIAGNOSTICS FOR THE CURRENT ACTIVE AUDIT */}
              {selectedAudit ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Score, Recommendation Breakdown Card */}
                  <div className="lg:col-span-5 bg-brand-surface rounded-xl border border-brand-border p-5 space-y-6">
                    <div className="text-center space-y-2">
                      <span className="block text-[10px] font-mono text-brand-muted uppercase">Consolidated AI Visibility Rating</span>
                      
                      <div className="relative w-36 h-36 mx-auto flex items-center justify-center mt-3">
                        {/* Circular progress track SVG */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2AA198" strokeWidth="6" 
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - selectedAudit.visibilityScore / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                            style={{ filter: 'drop-shadow(0px 0px 4px rgba(42,161,152,0.6))' }}
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="block text-3xl font-extrabold font-display text-white">{selectedAudit.visibilityScore}%</span>
                          <span className="text-[8px] font-mono text-brand-muted block uppercase mt-0.5">RES LEVEL</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-brand-muted leading-relaxed font-light mt-2 max-w-xs mx-auto">
                        Your brand appeared in exactly {selectedAudit.visibilityScore} out of 100 tested client recommendation intents.
                      </p>
                    </div>

                    <div className="border-t border-brand-border/40 pt-4">
                      <span className="block text-[10px] font-mono text-brand-muted uppercase mb-3">Model Recommendations Breakdown</span>
                      <PlatformBars breakdown={selectedAudit.platformBreakdown} />
                    </div>
                  </div>

                  {/* Rest details in remaining area */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Missing queries & gap analysis */}
                    <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                      <h3 className="text-sm font-semibold text-white mb-2">Tested Missing Query Sequences</h3>
                      <p className="text-xs text-brand-muted mb-4">
                        We ran hundreds of recommendation prompts. These critical search patterns recommended your competitor (<span className="text-brand-accent">{selectedAudit.topCompetitor}</span>) instead of you:
                      </p>
                      
                      <div className="space-y-2.5">
                        {selectedAudit.missingQueriesList.map((q, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-2 bg-brand-bg rounded border border-brand-border/50 text-xs font-mono text-brand-text">
                            <span className="text-[10px] text-brand-accent mt-0.5">0{i+1}</span>
                            <span className="break-all">{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Citation source gaps list */}
                    <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                      <h3 className="text-sm font-semibold text-white mb-2">Crawl Reference Gaps Detected</h3>
                      <p className="text-xs text-brand-muted mb-4">
                        Top models ingest context from these platforms. Your coverage index fails minimum thresholds, resulting in exclusion.
                      </p>

                      <div className="space-y-2.5 text-xs">
                        {selectedAudit.citationGapsList.map((c, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-brand-bg rounded border border-brand-border/50">
                            <div>
                              <span className="block font-medium text-white">{c.source}</span>
                              <span className="text-[9px] font-mono text-brand-muted">{c.type}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] border ${
                              c.coverage === 'None' || c.coverage === 'No Mention'
                                ? 'bg-red-950/20 text-red-300 border-red-900/40 animate-pulse'
                                : 'bg-yellow-950/20 text-yellow-300 border-yellow-900/40'
                            }`}>
                              {c.coverage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actionable Content Suggestions and recommendation cards */}
                    <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                      <h4 className="text-sm font-semibold text-white mb-3">Actionable Content Suggestions</h4>
                      <div className="space-y-3 text-xs">
                        {selectedAudit.contentSuggestions.map((s, i) => (
                          <div key={i} className="p-3 bg-brand-bg rounded-lg border border-brand-border/40 hover:border-brand-primary/20 transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-white leading-relaxed">{s.title}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase border ${
                                s.priority === 'High' 
                                  ? 'bg-brand-accent/15 text-brand-accent border-brand-accent/20' 
                                  : 'bg-brand-muted/20 text-brand-muted border-white/5'
                              }`}>
                                {s.priority} PRIORITY
                              </span>
                            </div>
                            <span className="block text-[10px] font-mono text-brand-muted">Target integration: {s.platformHint}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Core System Recommendations */}
                    <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                      <h4 className="text-sm font-semibold text-white mb-3">Dhwani Strategy Manual</h4>
                      <ol className="space-y-3 text-xs text-brand-muted list-decimal pl-4 leading-relaxed font-light">
                        {selectedAudit.recommendations.map((rec, i) => (
                          <li key={i} className="pl-1">
                            <span className="text-brand-text font-medium">{rec}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* SHAREABLE REPORT CARDS */}
                    <div className="bg-gradient-to-r from-brand-card to-brand-surface rounded-xl border border-brand-primary/20 p-5 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-brand-border">
                        <div>
                          <span className="text-[10px] font-mono text-brand-accent uppercase block tracking-wider">Public Credentials</span>
                          <h4 className="text-sm font-semibold text-white">Trust Embed Certificate</h4>
                        </div>
                        <Share2 className="w-4 h-4 text-brand-accent" />
                      </div>

                      <div className="bg-brand-bg p-3.5 rounded border border-brand-border font-mono text-[10px] text-brand-muted leading-relaxed">
                        <span className="block text-brand-text font-semibold mb-1">// DHWANI VERIFIED EMBEDDABLE BADGE</span>
                        <span>{`<iframe src="https://dhwani.ai/embed/${selectedAudit.id}" width="280" height="150" frameborder="0"></iframe>`}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-[10px] text-brand-muted leading-relaxed">
                          Embed this live-sync seal on your landing grids to showcase verified AI visibility status to enterprise clients.
                        </p>
                        <button
                          onClick={copyReportCardLink}
                          className="bg-brand-primary hover:bg-brand-accent text-brand-bg text-[11px] font-semibold px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap"
                          id="copy-embed-code-btn"
                        >
                          {isCopied ? 'Copied seal status!' : 'Copy Embed Snippet'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-muted py-6">No audits populated. Enter search conditions in the scanner above.</p>
              )}
            </div>
          )}

          {/* C. COMPETITORS SUB-SCENE */}
          {currentView === 'competitors' && (
            <div className="space-y-6 animate-fade-in" id="competitors-scene">
              <div className="pb-3 border-b border-brand-border/40">
                <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Global Diagnostics</span>
                <h2 className="text-xl md:text-2xl font-display font-medium text-white">Competitor Authority Tracking</h2>
              </div>

              {/* Competitive Overview Alert */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/15 rounded-xl flex items-start gap-3.5">
                <AlertCircle className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-brand-muted">
                  <span className="font-semibold text-white block mb-0.5">Competitor Advantage Alert</span>
                  <span>Your competitor <strong>{selectedAudit.topCompetitor}</strong> maintains an average visibility footprint of {selectedAudit.competitorVisibilityScore}% within your target sector. That represents a {selectedAudit.competitorAdvantageFactor}x higher response density on local searches matching <strong>{selectedAudit.category} in {selectedAudit.city}</strong>.</span>
                </div>
              </div>

              {/* Competitors List Table */}
              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/40 mb-4">
                  <h3 className="text-sm font-medium text-white">Scanned Authority Competitors</h3>
                  <span className="text-[10px] font-mono text-brand-accent">COUNT: 3 IDENTIFIED</span>
                </div>

                <div className="space-y-4">
                  {/* Row 1 */}
                  <div className="p-4 bg-brand-bg rounded-lg border border-brand-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-sm font-semibold text-white">{selectedAudit.topCompetitor}</span>
                      <span className="block text-[10px] text-brand-muted font-mono">Category Leader • Local cluster dominant</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Chatbot Coverage</span>
                        <span className="font-semibold text-brand-accent">{selectedAudit.competitorVisibilityScore}%</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Citation Weight</span>
                        <span className="font-semibold text-white">High (92 points)</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Direct Loss Index</span>
                        <span className="font-semibold text-red-200">18x loss factor</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="p-4 bg-brand-bg rounded-lg border border-brand-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-sm font-semibold text-white">Zeta Solutions</span>
                      <span className="block text-[10px] text-brand-muted font-mono">Secondary Opponent • Up-and-coming citation seeker</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Chatbot Coverage</span>
                        <span className="font-semibold text-[#8EE6DD]">64%</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Citation Weight</span>
                        <span className="font-semibold text-white">Medium (58 points)</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Direct Loss Index</span>
                        <span className="font-semibold text-red-200">2x loss factor</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="p-4 bg-brand-bg rounded-lg border border-brand-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-sm font-semibold text-white">Omni-Local Sync</span>
                      <span className="block text-[10px] text-brand-muted font-mono">Direct Competitor • Wikipedia entity sync</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Chatbot Coverage</span>
                        <span className="font-semibold text-[#8EE6DD]">48%</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Citation Weight</span>
                        <span className="font-semibold text-white">Medium (45 points)</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono text-brand-muted uppercase">Direct Loss Index</span>
                        <span className="font-semibold text-red-200">1.2x loss factor</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* D. REPORTS EXPORT SUB-SCENE */}
          {currentView === 'reports' && (
            <div className="space-y-6 animate-fade-in" id="reports-scene">
              <div className="pb-3 border-b border-brand-border/40">
                <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Document Center</span>
                <h2 className="text-xl md:text-2xl font-display font-medium text-white">Downloadable Audits & Integrations</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDF Generation widget */}
                <div className="bg-brand-surface rounded-xl border border-brand-border p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-brand-accent uppercase block">Client Pitch Deck</span>
                    <h3 className="text-base font-medium text-white">PDF Executive Recommendation Report</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Download a fully white-labeled executive summary document detailing current citation blindspots and actionable priority milestones. Perfect for pitching growth packages to non-technical prospects.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      alert('PDF report compiled securely in buffer. Downloading file...');
                    }}
                    className="mt-6 w-full py-2 bg-brand-primary hover:bg-brand-accent text-brand-bg rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    id="export-pdf-report-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Verification PDF</span>
                  </button>
                </div>

                {/* CSV raw spreadsheet widget */}
                <div className="bg-brand-surface rounded-xl border border-brand-border p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-brand-muted uppercase block">Data Analyst Sync</span>
                    <h3 className="text-base font-medium text-white">Raw Citation CSV Spreadsheet</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Export raw unstructured query parameters, index matching percentages, and crawl sources for ChatGPT, Claude, Gemini, and Perplexity into a comma-separated values file for deep integration.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      alert('CSV file matching 22 gaps exported successfully.');
                    }}
                    className="mt-6 w-full py-2 bg-brand-card hover:bg-brand-bg text-brand-accent border border-brand-border rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    id="export-csv-spreadsheet-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Raw CSV Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* E. BILLING SUB-SCENE */}
          {currentView === 'billing' && (
            <div className="space-y-6 animate-fade-in" id="billing-scene">
              <div className="pb-3 border-b border-brand-border/40">
                <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Plan & Billing</span>
                <h2 className="text-xl md:text-2xl font-display font-medium text-white">Dhwani Subscription Tiers</h2>
              </div>

              {/* Active Plan Card */}
              <div className="bg-brand-surface border border-brand-primary/25 rounded-xl p-5 flex justify-between items-center bg-gradient-to-r from-brand-surface to-brand-card">
                <div>
                  <span className="text-[9px] font-mono text-brand-accent uppercase tracking-widest block">Active workspace plan</span>
                  <h3 className="text-base font-semibold text-white mt-1">Free Starter tier</h3>
                  <p className="text-xs text-brand-muted leading-relaxed mt-1">Exactly 1 free audit limit. Continuous crawler scans are currently suspended.</p>
                </div>
                <div className="bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-lg text-xs font-mono text-brand-accent">
                  {freeAuditsRemaining} audits left
                </div>
              </div>

              {/* Premium Plan Choices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pro */}
                <div className="bg-brand-surface rounded-xl p-6 border border-brand-border hover:border-brand-primary/25 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-accent uppercase">Professional Growth</span>
                      <span className="bg-brand-primary/10 text-brand-accent text-[9px] font-mono px-2 py-0.5 rounded border border-brand-primary/20">Recommended</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-display">$49<span className="text-xs text-brand-muted font-normal"> / month</span></div>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Continuous, unlimited recommendation audits + automatic competitor authority scraper triggers twice a week.
                    </p>
                    <ul className="space-y-2 text-xs text-brand-text/90 pt-3 border-t border-brand-border/40">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-accent" /> <span>Unlimited queries scans</span></li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-accent" /> <span>5 Active competitors historical trackers</span></li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-accent" /> <span>PDF & CSV export files enabled</span></li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      alert('Upgraded to Professional Growth Plan! Limits cleared.');
                    }}
                    className="mt-8 w-full py-2 bg-brand-primary hover:bg-brand-accent text-brand-bg rounded-lg text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
                    id="upgrade-to-pro-billing-btn"
                  >
                    Activate Pro limits
                  </button>
                </div>

                {/* Agency */}
                <div className="bg-brand-surface rounded-xl p-6 border border-brand-border hover:border-brand-primary/25 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white uppercase">Agency Scale Plan</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-display">$149<span className="text-xs text-brand-muted font-normal"> / month</span></div>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Manage up to 25 distinct brand profiles matching elite white-label presentation layouts for enterprise clients.
                    </p>
                    <ul className="space-y-2 text-xs text-brand-text/90 pt-3 border-t border-brand-border/40">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-accent" /> <span>25 distinct brand workspace layouts</span></li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-accent" /> <span>Customizable whitelabel documents</span></li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-accent" /> <span>24/7 dedicated API scrape channels</span></li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      alert('Upgraded to Agency Scale Plan! All professional features unlocked.');
                    }}
                    className="mt-8 w-full py-2 bg-brand-card hover:bg-brand-bg text-brand-accent border border-brand-border rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    id="upgrade-to-agency-billing-btn"
                  >
                    Deploy Agency tier
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* F. SETTINGS SUB-SCENE */}
          {currentView === 'settings' && (
            <div className="space-y-6 animate-fade-in" id="settings-scene">
              <div className="pb-3 border-b border-brand-border/40">
                <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Workspace Settings</span>
                <h2 className="text-xl md:text-2xl font-display font-medium text-white">Configure Auditing Priority</h2>
              </div>

              <div className="bg-brand-surface rounded-xl border border-brand-border p-5 space-y-4">
                <h3 className="text-sm font-medium text-white">Language Recommender Priority</h3>
                <p className="text-xs text-brand-muted">
                  Choose which model networks Dhwani crawler bots prioritize during recursive buyer-scenario simulations.
                </p>

                <div className="space-y-3 pt-3">
                  <div className="flex items-center justify-between p-3 bg-brand-bg/85 border border-brand-border rounded-lg">
                    <div>
                      <span className="text-xs font-semibold text-white block">ChatGPT-4o / GPT-4 (OpenAI)</span>
                      <span className="text-[10px] text-brand-muted">Direct intent responses crawl tracking</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-brand-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-muted peer-checked:after:bg-brand-accent after:border-brand-muted after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary/40" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-brand-bg/85 border border-brand-border rounded-lg">
                    <div>
                      <span className="text-xs font-semibold text-white block">Claude 3.5 Sonnet / Haiku (Anthropic)</span>
                      <span className="text-[10px] text-brand-muted">Technical and code references crawl tracking</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-brand-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-muted peer-checked:after:bg-brand-accent after:border-brand-muted after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary/40" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-brand-bg/85 border border-brand-border rounded-lg">
                    <div>
                      <span className="text-xs font-semibold text-white block">Gemini 1.5 Pro / Flash (Google)</span>
                      <span className="text-[10px] text-brand-muted">Maps and directory API references tracking</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-brand-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-muted peer-checked:after:bg-brand-accent after:border-brand-muted after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary/40" />
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      alert('Audit configuration parameters updated successfully.');
                    }}
                    className="bg-brand-primary hover:bg-brand-accent text-brand-bg text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer"
                    id="save-settings-btn"
                  >
                    Save crawler weights
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
