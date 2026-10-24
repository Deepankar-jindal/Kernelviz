import React from 'react';
import { Navbar } from '../Navbar/Navbar';
import { useRouter, ROUTES } from '../../router';
import { Zap } from 'lucide-react';
import './SimulationLayout.css';

interface SimulationLayoutProps {
  moduleNumber: string;
  moduleTag: string;
  title: string;
  description: string;
  children: React.ReactNode;
  onCommandCenter: () => void;
}

export const SimulationLayout: React.FC<SimulationLayoutProps> = ({
  moduleNumber,
  moduleTag,
  title,
  description,
  children,
  onCommandCenter,
}) => {
  const { currentPath, navigate } = useRouter();

  return (
    <div className="sim-page">
      {/* Universal Ambient Grid & Radial Glow */}
      <div className="sim-ambient-grid" />
      <div className="sim-glow-radial" />

      {/* Universal Navbar */}
      <Navbar onCommandCenter={onCommandCenter} />

      <main className="sim-container">
        {/* Hero Section Header for the Simulation */}
        <header className="sim-header">
          <div className="sim-header-top">
            <span className="sim-number-tag">{moduleNumber} // LABORATORY</span>
            <div className="sim-tag-line" />
            <div className="label label-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Zap className="w-3 h-3 text-cyan" />
              <span>INTERACTIVE SIMULATOR</span>
            </div>
          </div>
          <h1 className="sim-title">{title}</h1>
          <p className="sim-desc">{description}</p>
        </header>

        {/* Active Simulation Content */}
        <div className="sim-content">
          {children}
        </div>

        {/* Cohesive Simulation Footer */}
        <footer className="sim-footer">
          <div className="sim-footer-inner">
            <div className="sim-footer-brand">
              <span className="sim-footer-title">KERNELVIZ LAB // {moduleNumber} {moduleTag}</span>
              <span className="label font-mono text-muted">BUILD 2026.09</span>
            </div>
            <div className="sim-footer-nav">
              <span className="sim-footer-link" onClick={() => navigate('/')}>LANDING HERO</span>
              {ROUTES.map((r) => (
                <span
                  key={r.id}
                  className="sim-footer-link"
                  onClick={() => navigate(r.path)}
                  style={{ color: currentPath === r.path ? 'var(--gold-metallic)' : undefined }}
                >
                  {r.id} {r.label}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
