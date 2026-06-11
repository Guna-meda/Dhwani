'use client'

import { PlatformBreakdown } from '@/lib/types'

interface PlatformBarsProps {
  breakdown: PlatformBreakdown;
  interactive?: boolean;
}

export function PlatformBars({ breakdown }: PlatformBarsProps) {
  const platforms = [
    { name: 'ChatGPT / OpenAI', score: breakdown.chatgpt, color: '#2AA198', desc: 'Retrieved from Reddit, official document references, and web-indices' },
    { name: 'Claude / Anthropic', score: breakdown.claude, color: '#8EE6DD', desc: 'Precompiled technical benchmarks, research papers, and Wikipedia density' },
    { name: 'Gemini / Google Bot', score: breakdown.gemini, color: '#1F7A72', desc: 'Parsed from Google Maps APIs, schema markup, and structured local data' },
    { name: 'Perplexity / Search Sync', score: breakdown.perplexity, color: '#2AA198', desc: 'Drawn from high density blogs, real-time news syndicates, and online forum threads' },
  ];

  return (
    <div className="space-y-4" id="platform-bars-wrapper bg-brand-surface rounded-xl">
      {platforms.map((p) => (
        <div key={p.name} className="relative group p-3 bg-brand-bg rounded-lg border border-brand-border/40 hover:border-brand-primary/20 transition-all">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-brand-text font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="text-brand-accent text-glow font-bold">{p.score}% recommended</span>
          </div>
          
          {/* Progress Bar Track */}
          <div className="h-2 w-full bg-brand-card rounded-full overflow-hidden border border-white/[0.02]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${p.score}%`,
                backgroundColor: p.color,
                boxShadow: `0 0 10px ${p.color}50`
              }}
            />
          </div>
          
          <div className="text-[10px] text-brand-muted mt-1.5 leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-12 overflow-hidden transition-all duration-300">
            {p.desc}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ResonanceWaveChartProps {
  score: number;
}

export function ResonanceWaveChart({ score }: ResonanceWaveChartProps) {
  // SVG view coordinates showing a stylized timeline grid and score point lines.
  const points = [
    { x: 50, y: 150, val: 25 },
    { x: 100, y: 130, val: 32 },
    { x: 150, y: 145, val: 28 },
    { x: 200, y: 110, val: 40 },
    { x: 250, y: 160, val: 20 },
    { x: 300, y: 120, val: 38 },
    { x: 350, y: 100, val: 45 },
    { x: 400, y: 80, val: 56 },
    { x: 450, y: 60, val: score },
  ];

  // Convert points array to SVG Path string
  const getPathString = () => {
    return points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  // Convert points to SVG gradient cover path
  const getAreaPathString = () => {
    const path = getPathString();
    return `${path} L 450 200 L 50 200 Z`;
  };

  return (
    <div className="relative w-full bg-brand-bg rounded-xl border border-brand-border/60 p-4" id="resonance-wave-chart-wrapper">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono text-brand-accent uppercase tracking-wider">Dynamic Auditing Signal</span>
          <h4 className="text-sm font-medium text-brand-text">Historical Visibility Resonance</h4>
        </div>
        <div className="bg-brand-card px-2 py-0.5 rounded text-[10px] font-mono text-brand-muted border border-brand-border">
          INTERVAL: 30 DAYS
        </div>
      </div>

      <svg viewBox="0 0 500 220" className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="chartLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1F7A72" />
            <stop offset="70%" stopColor="#2AA198" />
            <stop offset="100%" stopColor="#8EE6DD" />
          </linearGradient>

          <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2AA198" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#060B0D" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1="50" y1="50" x2="450" y2="50" stroke="rgba(255,255,255,0.02)" />
        <line x1="50" y1="100" x2="450" y2="100" stroke="rgba(255,255,255,0.02)" />
        <line x1="50" y1="150" x2="450" y2="150" stroke="rgba(255,255,255,0.02)" />
        <line x1="50" y1="200" x2="450" y2="200" stroke="rgba(255,255,255,0.06)" />

        {/* Grid Verticals */}
        {points.map((p, i) => (
          <line
            key={`vert-grid-${i}`}
            x1={p.x}
            y1="50"
            x2={p.x}
            y2="200"
            stroke="rgba(255,255,255,0.015)"
            strokeDasharray="2,2"
          />
        ))}

        {/* Gradient fill beneath line */}
        <path d={getAreaPathString()} fill="url(#chartAreaGrad)" />

        {/* Main trend line */}
        <path
          d={getPathString()}
          fill="none"
          stroke="url(#chartLineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glowing plot circles */}
        {points.map((p, i) => {
          const isLatest = i === points.length - 1;
          return (
            <g key={`point-dot-${i}`} className="cursor-pointer group">
              <circle
                cx={p.x}
                cy={p.y}
                r={isLatest ? 8 : 4}
                className="transition-all duration-300"
                fill={isLatest ? '#8EE6DD' : '#2AA198'}
                stroke="#060B0D"
                strokeWidth={2}
              />
              {isLatest && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="none"
                  stroke="#8EE6DD"
                  strokeWidth={1}
                  className="animate-pulse"
                />
              )}
              {/* Value Popups on hover */}
              <text
                x={p.x}
                y={p.y - 12}
                fill="#8EE6DD"
                fontSize="9"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-brand-surface px-1 pointer-events-none"
              >
                {p.val}%
              </text>
            </g>
          );
        })}

        {/* Horizontal indicators */}
        <text x="40" y="55" fill="#7E9393" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">80%</text>
        <text x="40" y="105" fill="#7E9393" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">50%</text>
        <text x="40" y="155" fill="#7E9393" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">20%</text>
        
        {/* Date labels */}
        <text x="50" y="215" fill="#7E9393" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle">Day -24</text>
        <text x="150" y="215" fill="#7E9393" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle">Day -18</text>
        <text x="250" y="215" fill="#7E9393" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle">Day -12</text>
        <text x="350" y="215" fill="#7E9393" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle">Day -6</text>
        <text x="450" y="215" fill="#2AA198" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">Audit Peak</text>
      </svg>
    </div>
  );
}
