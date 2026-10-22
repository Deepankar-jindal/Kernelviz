import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BootState } from '../../types';
import './Bootloader.css';

const DIAGNOSTICS = [
  { label: 'CPU // CORE', val: 'INITIALIZED' },
  { label: 'MEMORY // MMU', val: 'PAGE TABLE MAPPED' },
  { label: 'CACHE // TLB', val: '4-WAY ASSOCIATIVE' },
  { label: 'SCHEDULER', val: 'DISPATCH READY' },
];

const BOOT_STAGES = [
  'INITIALIZING KERNEL...',
  'ALLOCATING VIRTUAL MEMORY FRAMES...',
  'CONFIGURING MULTI-CORE SCHEDULER...',
  'CALIBRATING TLB CACHE HIERARCHY...',
  'SYSTEM READY: ALL SUBSYSTEMS NOMINAL',
];

interface Props {
  onComplete: () => void;
}

export const Bootloader: React.FC<Props> = ({ onComplete }) => {
  const [state, setState] = useState<BootState>('BOOTING');
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setState('ENTERING');
    setTimeout(() => {
      setState('COMPLETE');
      onComplete();
    }, 400);
  }, [onComplete]);

  // Fast, cinematic progress counter (takes ~1.8s)
  useEffect(() => {
    let currentP = 0;
    const interval = setInterval(() => {
      currentP += Math.floor(Math.random() * 8) + 4;
      if (currentP >= 100) {
        currentP = 100;
        setProgress(100);
        setStageIdx(BOOT_STAGES.length - 1);
        clearInterval(interval);
        setTimeout(handleFinish, 300);
      } else {
        setProgress(currentP);
        const nextStage = Math.min(
          Math.floor((currentP / 100) * BOOT_STAGES.length),
          BOOT_STAGES.length - 1
        );
        setStageIdx(nextStage);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [handleFinish]);

  // Obsidian + Gold particles & subtle grid canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.5 + 0.5,
      speedY: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.035)';
      ctx.lineWidth = 1;
      const step = 50;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Gold particles floating up
      particles.forEach((p) => {
        p.y -= p.speedY;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <AnimatePresence>
      {state !== 'COMPLETE' && (
        <motion.div
          className="aurum-bootloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <canvas ref={canvasRef} className="aurum-boot-canvas" />

          {/* Minimal top status */}
          <div className="aurum-boot-top">
            <div className="aurum-boot-badge">
              <span className="aurum-boot-pulse" />
              <span>AURUM // COMMAND PROTOCOL</span>
            </div>
            <button className="aurum-boot-skip" onClick={handleFinish}>
              SKIP SEQUENCE ⟶
            </button>
          </div>

          {/* Center Cinematic Branding */}
          <div className="aurum-boot-center">
            <motion.div
              className="aurum-boot-crest"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="url(#goldGrad)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6"/>
                <rect x="14" y="14" width="20" height="20" rx="3" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212, 175, 55, 0.08)"/>
                <path d="M24 8V14M24 34V40M8 24H14M34 24H40" stroke="#EBD17C" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="24" cy="24" r="3" fill="#D4AF37"/>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#EBD17C" />
                    <stop offset="0.5" stopColor="#D4AF37" />
                    <stop offset="1" stopColor="#A67C1E" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            <motion.h1
              className="aurum-boot-title"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              KERNELVIZ
            </motion.h1>

            <motion.div
              className="aurum-boot-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              SYSTEM VISUALIZATION LABORATORY
            </motion.div>

            {/* Stage Status */}
            <div className="aurum-boot-status">
              <span className="aurum-boot-status-text">{BOOT_STAGES[stageIdx]}</span>
            </div>

            {/* Thin Gold Progress Bar */}
            <div className="aurum-boot-bar-track">
              <div
                className="aurum-boot-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="aurum-boot-pct-row">
              <span className="aurum-boot-pct font-mono">{progress}%</span>
              <span className="aurum-boot-ver font-mono">CORE v3.0 // 64-BIT</span>
            </div>

            {/* Subtle System Diagnostics */}
            <div className="aurum-boot-diags">
              {DIAGNOSTICS.map((d, i) => (
                <div key={i} className="aurum-boot-diag-item">
                  <span className="aurum-boot-diag-label">{d.label}</span>
                  <span className="aurum-boot-diag-val font-mono">{d.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="aurum-boot-footer">
            <span className="font-mono">OPERATING SYSTEM KERNEL RESEARCH &copy; 2026</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
