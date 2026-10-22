import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Layers, 
  Network, 
  BarChart3, 
  ChevronRight, 
  ArrowDown, 
  Sparkles, 
  Compass,
  Boxes,
  Activity,
  Eye
} from 'lucide-react';
import { useRouter, ROUTES } from '../../router';
import heroLabImg from '../../assets/kernelviz-hero-lab.jpg';
import horizonFinalImg from '../../assets/kernelviz-horizon-final.jpg';
import './Hero.css';

interface FeatureCardItem {
  id: string;
  tag: string;
  number: string;
  status: string;
  statusColor: 'blue' | 'cyan' | 'copper';
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  actionText: string;
  route: string;
  renderIllustration: () => React.ReactNode;
}

interface TelemetryHotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  label: string;
  spec: string;
  route: string;
}

export const Hero: React.FC = () => {
  const { navigate } = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const boxesSectionRef = useRef<HTMLElement>(null);

  // Scroll animation state for the Hero image
  const [scrollY, setScrollY] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [boxesArrived, setBoxesArrived] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for the arrival of the 4 horizontal cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBoxesArrived(true);
        }
      },
      { threshold: 0.12 }
    );

    if (boxesSectionRef.current) {
      observer.observe(boxesSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Mouse tilt depth effect for 4K / HD realism
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 5, y: y * -5 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Normalized scroll ratio (0 -> 1 within the hero viewport)
  const heroHeight = typeof window !== 'undefined' ? window.innerHeight || 850 : 850;
  const scrollProgress = Math.min(1, Math.max(0, scrollY / heroHeight));

  // Interactive hotspots on the 4K processor lab image
  const HOTSPOTS: TelemetryHotspot[] = [
    {
      id: 'processor',
      x: 71,
      y: 63,
      title: 'TITANIUM OS CORE // RING 0',
      label: '64-BIT DUAL DISPATCH',
      spec: 'CYCLE-ACCURATE // 3.80 GHz NOMINAL',
      route: '/scheduler',
    },
    {
      id: 'bus',
      x: 82,
      y: 36,
      title: 'UNIFIED MEMORY FABRIC',
      label: '256-BIT INTERCONNECT',
      spec: 'DYNAMIC PARTITIONS // ZERO LATENCY',
      route: '/memory',
    },
    {
      id: 'spire',
      x: 61,
      y: 36,
      title: 'SIMULATION SPHERE // PIPELINE',
      label: '5-STAGE HAZARD INTERLOCK',
      spec: 'BRANCH PREDICTION ACTIVE',
      route: '/pipeline',
    },
  ];

  // Four signature feature cards displayed all horizontally in one row
  const FEATURE_CARDS: FeatureCardItem[] = [
    {
      id: 'cpu',
      tag: 'CORE ENGINE',
      number: '01',
      status: 'ACTIVE',
      statusColor: 'blue',
      icon: <Cpu className="w-4 h-4 text-electric" />,
      title: 'CPU SCHEDULING DISPATCH',
      description: 'Explore CPU scheduling algorithms and process execution with interactive Gantt dispatching and turnaround analysis.',
      features: ['FCFS', 'SJF', 'ROUND ROBIN', 'PRIORITY'],
      actionText: 'LAUNCH SCHEDULER LAB',
      route: '/scheduler',
      renderIllustration: () => (
        <svg className="card-illustration-svg" viewBox="0 0 280 110" fill="none">
          <line x1="20" y1="85" x2="260" y2="85" stroke="#293B51" strokeWidth="1" />
          <line x1="20" y1="45" x2="260" y2="45" stroke="#293B51" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Micro Processor Chip */}
          <rect x="22" y="22" width="46" height="46" rx="6" fill="#121F31" stroke="#4DA8FF" strokeWidth="1.5" />
          <rect x="30" y="30" width="30" height="30" rx="3" fill="#0D1625" stroke="#293B51" strokeWidth="1" />
          <circle cx="45" cy="45" r="4" fill="#4DA8FF" />
          <line x1="33" y1="18" x2="33" y2="22" stroke="#4DA8FF" strokeWidth="1.5" />
          <line x1="45" y1="18" x2="45" y2="22" stroke="#4DA8FF" strokeWidth="1.5" />
          <line x1="57" y1="18" x2="57" y2="22" stroke="#4DA8FF" strokeWidth="1.5" />
          <line x1="33" y1="68" x2="33" y2="72" stroke="#4DA8FF" strokeWidth="1.5" />
          <line x1="45" y1="68" x2="45" y2="72" stroke="#4DA8FF" strokeWidth="1.5" />
          <line x1="57" y1="68" x2="57" y2="72" stroke="#4DA8FF" strokeWidth="1.5" />

          {/* Miniature Scheduling Timeline with Illuminated Process Blocks */}
          <g transform="translate(80, 24)">
            <rect x="0" y="0" width="176" height="42" rx="4" fill="#0D1625" stroke="#293B51" strokeWidth="1" />
            <rect x="6" y="5" width="36" height="32" rx="3" fill="#4DA8FF" fillOpacity="0.85" />
            <text x="24" y="25" fill="#080D17" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">P1</text>
            
            <rect x="46" y="5" width="50" height="32" rx="3" fill="#83E7FF" fillOpacity="0.9" />
            <text x="71" y="25" fill="#080D17" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">P2 (RR)</text>

            <rect x="100" y="5" width="34" height="32" rx="3" fill="#18283C" stroke="#D6A66B" strokeWidth="1.2" />
            <text x="117" y="25" fill="#D6A66B" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">P3</text>

            <rect x="138" y="5" width="32" height="32" rx="3" fill="#293B51" />
            <text x="154" y="25" fill="#F0F5FC" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">P4</text>
          </g>

          <text x="86" y="80" fill="#7F90A7" fontSize="8" fontFamily="monospace">0ms</text>
          <text x="126" y="80" fill="#7F90A7" fontSize="8" fontFamily="monospace">4ms</text>
          <text x="180" y="80" fill="#7F90A7" fontSize="8" fontFamily="monospace">10ms</text>
          <text x="250" y="80" fill="#7F90A7" fontSize="8" fontFamily="monospace">16ms</text>
        </svg>
      ),
    },
    {
      id: 'memory',
      tag: 'ALLOCATION SYSTEM',
      number: '02',
      status: 'READY',
      statusColor: 'cyan',
      icon: <Layers className="w-4 h-4 text-cyan" />,
      title: 'MEMORY PARTITION ALLOCATION',
      description: 'Understand allocation strategies, contiguous memory blocks, coalescing, and dynamic fragmentation.',
      features: ['FIRST FIT', 'BEST FIT', 'WORST FIT'],
      actionText: 'LAUNCH MEMORY LAB',
      route: '/memory',
      renderIllustration: () => (
        <svg className="card-illustration-svg" viewBox="0 0 280 110" fill="none">
          <rect x="18" y="24" width="244" height="40" rx="6" fill="#0D1625" stroke="#293B51" strokeWidth="1.2" />
          
          <rect x="23" y="29" width="62" height="30" rx="4" fill="#121F31" stroke="#4DA8FF" strokeWidth="1.2" />
          <rect x="27" y="33" width="54" height="22" rx="2" fill="rgba(77, 168, 255, 0.2)" />
          <text x="54" y="48" fill="#F0F5FC" fontSize="8" fontWeight="700" fontFamily="monospace" textAnchor="middle">ALLOC 48K</text>
          
          <rect x="89" y="29" width="48" height="30" rx="4" fill="none" stroke="#3D5370" strokeWidth="1" strokeDasharray="3 3" />
          <text x="113" y="48" fill="#7F90A7" fontSize="8" fontWeight="600" fontFamily="monospace" textAnchor="middle">HOLE 32K</text>

          <rect x="141" y="29" width="70" height="30" rx="4" fill="#121F31" stroke="#83E7FF" strokeWidth="1.2" />
          <rect x="145" y="33" width="62" height="22" rx="2" fill="rgba(131, 231, 255, 0.2)" />
          <text x="176" y="48" fill="#83E7FF" fontSize="8" fontWeight="700" fontFamily="monospace" textAnchor="middle">ALLOC 64K</text>

          <rect x="215" y="29" width="42" height="30" rx="4" fill="#080D17" stroke="#293B51" strokeWidth="1" />
          <text x="236" y="48" fill="#7F90A7" fontSize="8" fontWeight="600" fontFamily="monospace" textAnchor="middle">FREE</text>

          <path d="M113 86 L113 68 M109 72 L113 67 L117 72" stroke="#D6A66B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="113" y="99" fill="#D6A66B" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">BEST FIT TARGET</text>
        </svg>
      ),
    },
    {
      id: 'process',
      tag: 'PIPELINE FLOW',
      number: '03',
      status: 'SYNCHRONIZED',
      statusColor: 'blue',
      icon: <Network className="w-4 h-4 text-cyan" />,
      title: 'PROCESS PIPELINE VISUALIZATION',
      description: 'Observe instruction movement through 5-stage RISC architecture with real-time hazard detection.',
      features: ['5-STAGE RISC', 'PCB STATES', 'HAZARDS'],
      actionText: 'EXPLORE PIPELINE LAB',
      route: '/pipeline',
      renderIllustration: () => (
        <svg className="card-illustration-svg" viewBox="0 0 280 110" fill="none">
          <path d="M25 46 L255 46" stroke="#293B51" strokeWidth="2" strokeDasharray="4 4" />

          {[
            { label: 'IF', name: 'FETCH', x: 38, col: '#4DA8FF' },
            { label: 'ID', name: 'DECODE', x: 88, col: '#83E7FF' },
            { label: 'EX', name: 'EXEC', x: 138, col: '#D6A66B' },
            { label: 'MEM', name: 'MEM', x: 188, col: '#4DA8FF' },
            { label: 'WB', name: 'WRITE', x: 238, col: '#83E7FF' },
          ].map((st) => (
            <g key={st.label} transform={`translate(${st.x}, 46)`}>
              <circle cx="0" cy="0" r="15" fill="#121F31" stroke={st.col} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="11" fill="#0D1625" />
              <text x="0" y="4" fill={st.col} fontSize="8" fontWeight="700" fontFamily="monospace" textAnchor="middle">{st.label}</text>
              <text x="0" y="26" fill="#A8B7CB" fontSize="7" fontWeight="600" fontFamily="monospace" textAnchor="middle">{st.name}</text>
            </g>
          ))}

          <circle cx="138" cy="46" r="20" stroke="#D6A66B" strokeWidth="1" strokeDasharray="3 3" opacity="0.8">
            <animate attributeName="r" values="17;22;17" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      ),
    },
    {
      id: 'scheduler',
      tag: 'BENCHMARK ARENA',
      number: '04',
      status: 'ANALYTICS',
      statusColor: 'copper',
      icon: <BarChart3 className="w-4 h-4 text-copper" />,
      title: 'ALGORITHM BENCHMARKING',
      description: 'Compare algorithm efficiency side-by-side across CPU throughput, turnaround duration, and response latency.',
      features: ['HEAD-TO-HEAD', 'METRICS HUD', 'CHARTS'],
      actionText: 'START BENCHMARK BATTLE',
      route: '/benchmark',
      renderIllustration: () => (
        <svg className="card-illustration-svg" viewBox="0 0 280 110" fill="none">
          <line x1="30" y1="88" x2="255" y2="88" stroke="#293B51" strokeWidth="1" />
          
          <rect x="45" y="48" width="28" height="40" rx="3" fill="#18283C" stroke="#4DA8FF" strokeWidth="1" />
          <text x="59" y="42" fill="#4DA8FF" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">24.2</text>
          <text x="59" y="100" fill="#7F90A7" fontSize="8" fontWeight="600" fontFamily="monospace" textAnchor="middle">FCFS</text>

          <rect x="95" y="28" width="28" height="60" rx="3" fill="linear-gradient(180deg, #F0D0A5, #D6A66B)" stroke="#D6A66B" strokeWidth="1" />
          <text x="109" y="22" fill="#D6A66B" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">13.0★</text>
          <text x="109" y="100" fill="#F0F5FC" fontSize="8" fontWeight="700" fontFamily="monospace" textAnchor="middle">SJF</text>

          <rect x="145" y="40" width="28" height="48" rx="3" fill="#121F31" stroke="#83E7FF" strokeWidth="1.2" />
          <text x="159" y="34" fill="#83E7FF" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">17.8</text>
          <text x="159" y="100" fill="#7F90A7" fontSize="8" fontWeight="600" fontFamily="monospace" textAnchor="middle">RR</text>

          <rect x="195" y="34" width="28" height="54" rx="3" fill="#0D1625" stroke="#3D5370" strokeWidth="1" />
          <text x="209" y="28" fill="#A8B7CB" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">14.6</text>
          <text x="209" y="100" fill="#7F90A7" fontSize="8" fontWeight="600" fontFamily="monospace" textAnchor="middle">SRTF</text>
        </svg>
      ),
    },
  ];

  const scrollToCards = () => {
    document.getElementById('feature-boxes-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHorizon = () => {
    document.getElementById('horizon-destination-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="hero" className="celestial-landing-root">
      {/* ════════════════════════════════════════════════════════
          1. COMPLETE SCREEN HERO SECTION (CELESTIAL TITANIUM × AURORA BLUE)
             Preserving the original 4K CPU-city artwork unobstructed
          ════════════════════════════════════════════════════════ */}
      <section 
        ref={heroRef}
        className="celestial-complete-hero-section"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="celestial-hero-fullscreen-frame"
          style={{
            transform: `perspective(1200px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Razor-Sharp 4K UHD Processor City Visual with Cinematic Scroll Push */}
          <div 
            className="celestial-hero-image-scaler"
            style={{
              transform: `scale(${1 + scrollProgress * 0.12}) translateY(${scrollProgress * 45}px)`,
              transition: 'transform 0.1s linear',
            }}
          >
            <img
              src={heroLabImg}
              alt="KERNELVIZ 4K UHD Titanium Processor Laboratory Architecture"
              className="celestial-fullscreen-hero-img"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Controlled Electric Blue & Aurora Light Sweep */}
          <div 
            className="celestial-processor-aurora-glow"
            style={{
              opacity: 0.4 + scrollProgress * 0.45,
              transform: `scale(${1 + scrollProgress * 0.2})`,
            }}
          />

          {/* Precision Light Sweep Beam */}
          <div className="celestial-circuit-light-sweep" />

          {/* Subtle Atmospheric Vignette & Deep Navy Grounding */}
          <div className="celestial-hero-optical-grade" />
          <div className="celestial-hero-bottom-blend" />

          {/* Precision Architectural Reticles in Titanium & Copper */}
          <div className="celestial-reticle reticle-tl" />
          <div className="celestial-reticle reticle-tr" />
          <div className="celestial-reticle reticle-bl" />
          <div className="celestial-reticle reticle-br" />

          {/* Vertical Left Telemetry Rail */}
          <aside className="celestial-hero-vtrack-left font-mono" aria-hidden="true">
            <span>SYSTEM // TITANIUM ARCHITECTURE // 64-BIT DUAL DISPATCH // CYCLES</span>
          </aside>

          {/* Vertical Right Stages Indicator */}
          <aside className="celestial-hero-stages-right font-mono" aria-hidden="true">
            <div className="stage-item active"><span className="stage-num">01</span> ARCHITECTURE</div>
            <div className="stage-item"><span className="stage-num">02</span> SCHEDULING</div>
            <div className="stage-item"><span className="stage-num">03</span> MEMORY</div>
            <div className="stage-item"><span className="stage-num">04</span> PIPELINE</div>
            <div className="stage-item"><span className="stage-num">05</span> BENCHMARK</div>
          </aside>

          {/* Left Half: KERNELVIZ Heading with Interactive Shimmer Effect */}
          <div 
            className="celestial-hero-brand-left"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 2.2),
              transform: `translateY(calc(-50% - ${scrollProgress * 30}px))`,
            }}
          >
            <h1 className="celestial-hero-heading" data-text="KERNELVIZ">
              <span className="heading-text">KERNELVIZ</span>
              <span className="heading-glow-layer" aria-hidden="true">KERNELVIZ</span>
            </h1>
          </div>

          {/* Interactive Telemetry Hotspots over the Silicon Architecture */}
          {HOTSPOTS.map((spot) => (
            <div
              key={spot.id}
              className={`celestial-hotspot hotspot-${spot.id} ${activeHotspot === spot.id ? 'active' : ''}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onMouseEnter={() => setActiveHotspot(spot.id)}
              onMouseLeave={() => setActiveHotspot(null)}
              onClick={() => navigate(spot.route)}
            >
              <div className="hotspot-pulse" />
              <div className="hotspot-dot" />
              <div className="hotspot-card">
                <div className="hotspot-title font-mono">{spot.title}</div>
                <div className="hotspot-label font-heading">{spot.label}</div>
                <div className="hotspot-spec font-mono">{spot.spec}</div>
                <div className="hotspot-action font-mono">INSPECT MODULE →</div>
              </div>
            </div>
          ))}

          {/* Bottom Floating Command Dock (Leaves Visual Completely Unobstructed) */}
          <div 
            className="celestial-hero-bottom-control-dock"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 1.8),
              transform: `translateX(-50%) translateY(${scrollProgress * 25}px)`,
            }}
          >
            <div className="celestial-dock-cta-row">
              <button
                className="btn btn-primary celestial-btn-primary"
                onClick={() => navigate('/scheduler')}
              >
                <span>Launch Operating System Lab →</span>
              </button>
              <button
                className="btn celestial-btn-explore"
                onClick={scrollToCards}
              >
                <Compass className="w-3.5 h-3.5 text-cyan" />
                <span>Explore 4 Core Subsystems</span>
                <ArrowDown className="w-3.5 h-3.5 text-cyan animate-bounce-subtle" />
              </button>
            </div>

            {/* 4 Signature Metrics Dock */}
            <div className="celestial-hero-metrics-bar font-mono">
              <div className="metric-pill" onClick={() => navigate('/scheduler')}>
                <Boxes className="w-3.5 h-3.5 metric-icon text-blue" />
                <div className="metric-content">
                  <span className="metric-title font-heading">9+ Modules</span>
                  <span className="metric-desc">Simulation Labs</span>
                </div>
              </div>

              <div className="metric-divider" />

              <div className="metric-pill" onClick={() => navigate('/benchmark')}>
                <Cpu className="w-3.5 h-3.5 metric-icon text-cyan" />
                <div className="metric-content">
                  <span className="metric-title font-heading">20+ Algorithms</span>
                  <span className="metric-desc">Live Execution</span>
                </div>
              </div>

              <div className="metric-divider" />

              <div className="metric-pill" onClick={() => navigate('/pipeline')}>
                <Eye className="w-3.5 h-3.5 metric-icon text-copper" />
                <div className="metric-content">
                  <span className="metric-title font-heading">Interactive</span>
                  <span className="metric-desc">Visual Architecture</span>
                </div>
              </div>

              <div className="metric-divider" />

              <div className="metric-pill" onClick={() => navigate('/memory')}>
                <Activity className="w-3.5 h-3.5 metric-icon text-blue" />
                <div className="metric-content">
                  <span className="metric-title font-heading">Cycle-Level</span>
                  <span className="metric-desc">Zero Latency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          2. FOUR BOX CONTAINER — ELEVATED TITANIUM SURFACES
             All horizontal in one row with arrival animation & hover expansion
          ════════════════════════════════════════════════════════ */}
      <section ref={boxesSectionRef} id="feature-boxes-section" className="celestial-horizontal-boxes-section">
        <div className="celestial-horizontal-container">
          {/* Section Header in Space Grotesk & IBM Plex Mono */}
          <header className={`celestial-section-header ${boxesArrived ? 'arrived' : ''}`}>
            <div className="celestial-section-badge">
              <Sparkles className="w-3 h-3 text-cyan" />
              <span className="font-mono">01 — 04 // CORE ARCHITECTURAL MODULES</span>
            </div>
            <h2 className="celestial-section-headline font-heading">
              PRIMARY OPERATING SYSTEM ENGINES
            </h2>
            <p className="celestial-section-sub font-mono">
              ELEVATED TITANIUM SURFACES // INTERACTIVE HARDWARE & SIMULATION KERNELS
            </p>
          </header>

          {/* All 4 Boxes in ONE Horizontal Row with Dynamic Arrival Animation */}
          <div className="celestial-all-horizontal-row">
            {FEATURE_CARDS.map((card, cIdx) => (
              <article
                key={card.id}
                className={`celestial-h-card ${boxesArrived ? 'arrived' : ''}`}
                style={{
                  transitionDelay: boxesArrived ? `${cIdx * 110}ms` : '0ms',
                }}
                onClick={() => navigate(card.route)}
              >
                {/* Micro Reticles */}
                <div className="c-reticle c-reticle-tl" />
                <div className="c-reticle c-reticle-tr" />
                <div className="c-reticle c-reticle-bl" />
                <div className="c-reticle c-reticle-br" />

                {/* Card Top Header */}
                <div className="celestial-card-top">
                  <div className="celestial-card-tag font-mono">
                    <span className="card-num">{card.number}</span>
                    <span className="card-tag-name">{card.tag}</span>
                  </div>
                  <div className="celestial-card-status font-mono">
                    <span className={`status-dot-sm status-${card.statusColor}`} />
                    <span>{card.status}</span>
                  </div>
                </div>

                {/* Custom Vector Technical Illustration */}
                <div className="celestial-card-illustration-wrap">
                  {card.renderIllustration()}
                </div>

                {/* Card Body */}
                <div className="celestial-card-body">
                  <h3 className="celestial-card-title font-heading">{card.title}</h3>
                  <p className="celestial-card-desc">{card.description}</p>

                  <div className="celestial-card-features font-mono">
                    {card.features.map((feat, fIdx) => (
                      <React.Fragment key={feat}>
                        <span className="feat-pill">{feat}</span>
                        {fIdx < card.features.length - 1 && <span className="feat-sep">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="celestial-card-footer">
                  <button
                    className="celestial-card-action-btn font-mono"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(card.route);
                    }}
                  >
                    <span>{card.actionText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Quick jump to horizon */}
          <button 
            type="button" 
            className="celestial-scroll-down-hint" 
            onClick={scrollToHorizon}
          >
            <span className="font-mono">CONTINUE TO THE HORIZON EXPEDITION</span>
            <ArrowDown className="w-3.5 h-3.5 text-cyan animate-bounce-subtle" />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          3. HORIZON DESTINATION SECTION AT THE END
             Edge-to-edge (100vw) with "The Great Line"
          ════════════════════════════════════════════════════════ */}
      <section id="horizon-destination-section" className="celestial-horizon-fullscreen-section">
        <div className="celestial-horizon-panoramic-wrap">
          <img
            src={horizonFinalImg}
            alt="KERNELVIZ 4K UHD Horizon Architecture Sunset Vista"
            className="celestial-horizon-panoramic-img"
            loading="lazy"
            decoding="async"
          />

          {/* Atmospheric Deep Titanium Lighting & Blends */}
          <div className="celestial-horizon-atmospheric-layer" />
          <div className="celestial-horizon-top-blend" />
          <div className="celestial-horizon-bottom-blend" />

          {/* The Great Line & Horizon Architectural Centerpiece */}
          <div className="celestial-horizon-editorial-stage">
            <div className="celestial-horizon-badge">
              <span className="status-dot active" />
              <span className="font-mono">THE KERNELVIZ HORIZON // CELESTIAL TITANIUM × AURORA BLUE</span>
            </div>

            {/* The Great Line */}
            <h2 className="celestial-great-line-title font-heading">
              WHERE SILICON ARCHITECTURE MEETS THE HORIZON OF INNOVATION
            </h2>

            <p className="celestial-great-line-quote font-serif">
              “A deeper understanding of systems. A brighter future for every builder.”
            </p>

            <p className="celestial-great-line-sub font-mono">
              From processes to memory, from scheduling to systems. A visual journey through the core of modern operating systems.
            </p>

            {/* Action Buttons */}
            <div className="celestial-horizon-action-buttons">
              <button
                className="btn btn-primary btn-lg celestial-btn-primary"
                onClick={() => navigate('/scheduler')}
              >
                <span>Launch KernelLab Simulation →</span>
              </button>
              <button
                className="btn btn-lg celestial-btn-secondary"
                onClick={() => navigate('/benchmark')}
              >
                <BarChart3 className="w-4 h-4 text-cyan" />
                <span>View Benchmark Arena</span>
              </button>
            </div>

            {/* 9 Modules Navigation Grid */}
            <nav className="celestial-horizon-module-pills font-mono" aria-label="Simulation Modules">
              {ROUTES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="module-pill"
                  onClick={() => navigate(r.path)}
                >
                  <span className="module-pill-id">{r.id}</span>
                  <span className="module-pill-label">{r.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>
    </div>
  );
};
