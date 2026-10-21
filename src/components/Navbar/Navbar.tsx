import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, ROUTES } from '../../router';
import './Navbar.css';

interface Props {
  onCommandCenter: () => void;
}

export const Navbar: React.FC<Props> = ({ onCommandCenter }) => {
  const { currentPath, navigate } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const progressFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const isScrolled = scrollY > 40;
      if (isScrolled !== scrolledRef.current) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }
      if (progressFillRef.current) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const pct = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
        progressFillRef.current.style.width = `${pct}%`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBrandClick = useCallback(() => {
    if (currentPath === '/') {
      const hero = document.getElementById('hero');
      if (hero) hero.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  }, [currentPath, navigate]);

  const handleNavClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <nav className={`aurum-navbar ${scrolled ? 'aurum-navbar--scrolled' : ''}`}>
      <div className="aurum-navbar-inner">
        {/* Brand */}
        <div className="aurum-navbar-brand" onClick={handleBrandClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212, 175, 55, 0.1)"/>
            <circle cx="12" cy="12" r="3" fill="#EBD17C"/>
            <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div className="aurum-brand-text">
            <span className="aurum-brand-name">KERNELVIZ</span>
            <span className="aurum-brand-badge">LAB</span>
          </div>
        </div>

        {/* Links */}
        <div className="aurum-navbar-links">
          {ROUTES.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                className={`aurum-navbar-link ${isActive ? 'aurum-navbar-link--active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                title={item.title}
              >
                <span className="aurum-link-id font-mono">{item.id}</span>
                <span className="aurum-link-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* CMD Prompt Button */}
        <button className="aurum-navbar-cmd" onClick={onCommandCenter}>
          <span className="aurum-cmd-key font-mono">⌘K</span>
          <span className="aurum-cmd-label font-mono">COMMAND</span>
        </button>
      </div>

      {/* Thin Gold Reading Progress */}
      <div className="aurum-navbar-progress">
        <div ref={progressFillRef} className="aurum-navbar-progress-fill" style={{ width: '0%' }} />
      </div>
    </nav>
  );
};
