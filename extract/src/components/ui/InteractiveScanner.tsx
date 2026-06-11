import React, { useState, useRef, useEffect } from 'react';

export default function InteractiveScanner() {
  const [mousePos, setMousePos] = useState({ x: 250, y: 200 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);

  // Smooth animation ticking for floating waves
  useEffect(() => {
    let animationFrameId: number;
    const updateTime = () => {
      setTime((prev) => (prev + 0.05) % (Math.PI * 20));
      animationFrameId = requestAnimationFrame(updateTime);
    };
    animationFrameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  // Generate dynamic wave path based on current state & mouse position
  const getSineWavePath = (offset: number, amplitudeMultiplier: number, speedMultiplier: number) => {
    const points: string[] = [];
    const width = 500;
    const height = 400;
    const centerY = height / 2 + offset;
    
    // Mouse proximity influence
    const distToMouseY = Math.abs(mousePos.y - centerY);
    const mouseInfluence = isHovered ? Math.max(0, (200 - distToMouseY) / 200) : 0.2;
    const finalAmplitude = (20 + mouseInfluence * 45) * amplitudeMultiplier;

    for (let x = 0; x <= width; x += 10) {
      // Calculate sine curve combining time and mouseX proximity index
      const dx = Math.abs(x - mousePos.x);
      const px = isHovered ? Math.max(0, (150 - dx) / 150) : 0.1;
      const waveX = (x / 40) - (time * speedMultiplier);
      const y = centerY + Math.sin(waveX) * finalAmplitude * (1 + px * 1.5);
      points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return points.join(' ');
  };

  // Static/Animated Radar Nodes
  const nodes = [
    { id: 1, cx: 120, cy: 110, label: 'GPT-4o', rate: '92% sync' },
    { id: 2, cx: 380, cy: 130, label: 'Claude-3.5', rate: '88% resonance' },
    { id: 3, cx: 180, cy: 290, label: 'Gemini-Flash', rate: '61% reference' },
    { id: 4, cx: 350, cy: 280, label: 'Perplexity-Pro', rate: '94% citation' },
    { id: 5, cx: 250, cy: 200, label: 'Search-Grid', rate: 'Active audit sweep' },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full aspect-[5/4] max-w-lg mx-auto bg-brand-surface rounded-2xl border border-brand-border overflow-hidden glow-border group select-none flex items-center justify-center cursor-crosshair"
      id="signal-scanner-canvas"
    >
      {/* Background Matrix of Dots */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      
      {/* Glow Center Accent */}
      <div 
        className="absolute w-72 h-72 rounded-full pointer-events-none transition-all duration-300 bg-brand-primary/10 blur-[80px]"
        style={{
          left: `${mousePos.x - 144}px`,
          top: `${mousePos.y - 144}px`
        }}
      />

      <svg viewBox="0 0 500 400" className="absolute inset-0 w-full h-full z-10">
        <defs>
          <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2AA198" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#1F7A72" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#060B0D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1F7A72" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#2AA198" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8EE6DD" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Radar concentric circular rings */}
        <circle cx="250" cy="200" r="160" fill="none" stroke="rgba(42,161,152,0.12)" strokeWidth="1" strokeDasharray="4,4" />
        <circle cx="250" cy="200" r="110" fill="none" stroke="rgba(42,161,152,0.18)" strokeWidth="1" />
        <circle cx="250" cy="200" r="60" fill="none" stroke="rgba(42,161,152,0.22)" strokeWidth="1.5" />

        {/* Rotating sweep line */}
        <line 
          x1="250" 
          y1="200" 
          x2={250 + 175 * Math.cos(time * 0.4)} 
          y2={200 + 175 * Math.sin(time * 0.4)} 
          stroke="rgba(142,230,221,0.35)" 
          strokeWidth="1.5"
          className="transition-all duration-75"
        />

        {/* Crosshair indicators */}
        <line x1="250" y1="30" x2="250" y2="370" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="40" y1="200" x2="460" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* Fluid Resonance/Sound Waves */}
        <path d={getSineWavePath(-30, 0.6, 1.2)} fill="none" stroke="url(#waveGrad)" strokeWidth="1.5" className="opacity-40" />
        <path d={getSineWavePath(0, 1.0, 1.8)} fill="none" stroke="url(#waveGrad)" strokeWidth="3.0" />
        <path d={getSineWavePath(30, 0.7, 1.0)} fill="none" stroke="url(#waveGrad)" strokeWidth="2.0" className="opacity-50" />

        {/* Connecting signal trails to mouse */}
        {isHovered && (
          <>
            {nodes.map(node => {
              const dx = mousePos.x - node.cx;
              const dy = mousePos.y - node.cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 180) {
                return (
                  <line
                    key={`line-${node.id}`}
                    x1={node.cx}
                    y1={node.cy}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke={`rgba(142,230,221, ${0.4 * (1 - dist / 180)})`}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                );
              }
              return null;
            })}
          </>
        )}

        {/* Floating AI Nodes inside scanner */}
        {nodes.map((node) => {
          const dx = mousePos.x - node.cx;
          const dy = mousePos.y - node.cy;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const activeRadius = dist < 80 ? 6 : 4;
          const nodeIsNear = dist < 80;

          return (
            <g key={node.id} className="transition-all duration-300">
              {/* Halos */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={activeRadius + 10 + Math.sin(time * 3 + node.id) * 3}
                fill="none"
                stroke={nodeIsNear ? "rgba(142,230,221,0.3)" : "rgba(42,161,152,0.1)"}
                strokeWidth="1"
              />
              <circle
                cx={node.cx}
                cy={node.cy}
                r={activeRadius}
                fill={nodeIsNear ? "#8EE6DD" : "#2AA198"}
                className="transition-colors duration-200"
              />
              {/* Coordinates / Data Labels shown when close */}
              <text
                x={node.cx + 10}
                y={node.cy - 12}
                fill={nodeIsNear ? "#F5F7F7" : "#7E9393"}
                fontSize="10"
                fontFamily="var(--font-mono)"
                className="select-none transition-colors duration-200"
              >
                {node.label}
              </text>
              <text
                x={node.cx + 10}
                y={node.cy + 2}
                fill="#2AA198"
                fontSize="8"
                fontFamily="var(--font-mono)"
                opacity={nodeIsNear ? 1 : 0.4}
                className="select-none transition-all duration-200"
              >
                {node.rate}
              </text>
            </g>
          );
        })}

        {/* Active crosshair targeting pointer */}
        {isHovered && (
          <g>
            <circle cx={mousePos.x} cy={mousePos.y} r="18" fill="none" stroke="#8EE6DD" strokeWidth="1" strokeDasharray="3,1" />
            <circle cx={mousePos.x} cy={mousePos.y} r="2" fill="#8EE6DD" />
          </g>
        )}
      </svg>

      {/* Real-time Telemetry Overlay strictly for elegant user feedback */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[9px] text-brand-muted z-20 bg-brand-bg/80 backdrop-blur-md px-3 py-1.5 rounded border border-brand-border">
        <span>SWEEP: ACTIVE_3000Hz</span>
        <span className="text-brand-accent">RESONANCE STABLE</span>
        <span>X: {Math.floor(mousePos.x)} Y: {Math.floor(mousePos.y)}</span>
      </div>
    </div>
  );
}
