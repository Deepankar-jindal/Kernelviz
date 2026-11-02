import { useState, useEffect, useCallback } from 'react';
import { Bootloader } from './components/Bootloader/Bootloader';
import { KernelCursor } from './components/Cursor/KernelCursor';
import { Navbar } from './components/Navbar/Navbar';
import { Hero } from './components/Hero/Hero';
import { CommandCenter } from './components/CommandCenter/CommandCenter';
import { RouterProvider, useRouter } from './router';

// Dedicated Simulation Pages
import { CorePage } from './pages/CorePage';
import { PipelinePage } from './pages/PipelinePage';
import { SchedulerPage } from './pages/SchedulerPage';
import { MemoryPage } from './pages/MemoryPage';
import { TLBPage } from './pages/TLBPage';
import { PagingPage } from './pages/PagingPage';
import { ReplacementPage } from './pages/ReplacementPage';
import { FragmentationPage } from './pages/FragmentationPage';
import { BenchmarkPage } from './pages/BenchmarkPage';

import './styles/globals.css';
import './App.css';

function KernelVizContent() {
  const { currentPath, navigate } = useRouter();

  const [showBoot, setShowBoot] = useState(() => {
    try {
      // If directly accessing a dedicated simulation page, skip bootloader for fast access
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      if (path !== '/') return false;
      return sessionStorage.getItem('hasBootstrapped') !== 'true';
    } catch {
      return true;
    }
  });

  const [cmdOpen, setCmdOpen] = useState(false);
  const [rebootKey, setRebootKey] = useState(0);

  const handleBootComplete = useCallback(() => {
    sessionStorage.setItem('hasBootstrapped', 'true');
    setShowBoot(false);
    document.body.classList.remove('boot-active');
  }, []);

  // Ctrl+K handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (showBoot) document.body.classList.add('boot-active');
    else document.body.classList.remove('boot-active');
  }, [showBoot]);

  const handleAction = (action: string) => {
    if (action === 'reboot') {
      sessionStorage.removeItem('hasBootstrapped');
      setRebootKey(k => k + 1);
      setShowBoot(true);
      return;
    }
    if (action.startsWith('/')) {
      navigate(action);
      return;
    }
    if (action === 'hero') {
      if (currentPath === '/') {
        document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
      }
      return;
    }
    const el = document.getElementById(action);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Dedicated Route Views
  const renderCurrentView = () => {
    switch (currentPath) {
      case '/core':
        return <CorePage onCommandCenter={() => setCmdOpen(true)} />;
      case '/pipeline':
        return <PipelinePage onCommandCenter={() => setCmdOpen(true)} />;
      case '/scheduler':
        return <SchedulerPage onCommandCenter={() => setCmdOpen(true)} />;
      case '/memory':
        return <MemoryPage onCommandCenter={() => setCmdOpen(true)} />;
      case '/tlb':
        return <TLBPage onCommandCenter={() => setCmdOpen(true)} />;
      case '/paging':
        return <PagingPage onCommandCenter={() => setCmdOpen(true)} />;
      case '/replacement':
        return <ReplacementPage onCommandCenter={() => setCmdOpen(true)} />;
      case '/fragmentation':
        return <FragmentationPage onCommandCenter={() => setCmdOpen(true)} />;
      case '/benchmark':
        return <BenchmarkPage onCommandCenter={() => setCmdOpen(true)} />;
      case '/':
      default:
        // PRESERVED LANDING PAGE
        return (
          <div className="app">
            <Navbar onCommandCenter={() => setCmdOpen(true)} />

            <main>
              {/* Existing Cinematic Hero (Motherboard Animation & Four Feature Boxes) */}
              <Hero />

              {/* Final CTA */}
              <section className="final-cta">
                <div className="container">
                  <div className="final-cta-content">
                    <div className="final-badge">
                      <span className="status-dot active" />
                      <span>AURUM // KERNEL LAB</span>
                    </div>
                    <h2 className="final-headline">
                      STOP READING<br />
                      ABOUT THE KERNEL.
                    </h2>
                    <h2 className="final-headline final-headline-accent">RUN IT.</h2>
                    <p className="final-sub">
                      Interactive OS simulations // Engineered for deep architectural insight
                    </p>
                    <button
                      className="btn btn-lg btn-primary final-btn"
                      onClick={() => navigate('/scheduler')}
                    >
                      LAUNCH KERNELVIZ LAB →
                    </button>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <footer className="footer">
                <div className="container footer-inner">
                  <div className="footer-brand">
                    <div className="footer-brand-name">KERNELVIZ</div>
                    <div className="label footer-sub">OPERATING SYSTEMS VISUALIZATION LAB</div>
                  </div>
                  <div className="footer-links">
                    {['CPU // EXECUTION', 'MEMORY // ALLOCATION', 'CACHE // HIERARCHY', 'PAGING // TRANSLATION', 'SCHEDULER // DISPATCH', 'PROCESS // CONTROL'].map(l => (
                      <span key={l} className="label footer-link">{l}</span>
                    ))}
                  </div>
                  <div className="label footer-build font-mono">BUILD 2026.09 // 64-BIT CORE</div>
                </div>
              </footer>
            </main>
          </div>
        );
    }
  };

  return (
    <>
      <KernelCursor />

      {showBoot && (
        <Bootloader key={rebootKey} onComplete={handleBootComplete} />
      )}

      {!showBoot && renderCurrentView()}

      <CommandCenter
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAction={handleAction}
      />
    </>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <KernelVizContent />
    </RouterProvider>
  );
}
