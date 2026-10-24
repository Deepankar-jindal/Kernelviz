import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CommandCenter.css';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: string;
  category: string;
}

const COMMANDS: Command[] = [
  { id: 'core',          label: '01 Core: Process Lifecycle & States',  shortcut: '⌘1', action: '/core',          category: 'SIMULATIONS' },
  { id: 'pipeline',      label: '02 Pipeline: Execution & Hazards',     shortcut: '⌘2', action: '/pipeline',      category: 'SIMULATIONS' },
  { id: 'scheduler',     label: '03 Scheduler: CPU Scheduling Lab',     shortcut: '⌘3', action: '/scheduler',     category: 'SIMULATIONS' },
  { id: 'memory',        label: '04 Memory: Dynamic Allocation Fit',    shortcut: '⌘4', action: '/memory',        category: 'SIMULATIONS' },
  { id: 'tlb',           label: '05 TLB: Cache Translation & EAT',      shortcut: '⌘5', action: '/tlb',           category: 'SIMULATIONS' },
  { id: 'paging',        label: '06 Paging: Address Translation',       shortcut: '⌘6', action: '/paging',        category: 'SIMULATIONS' },
  { id: 'replacement',   label: '07 Replacement: Page Faults & LRU',   shortcut: '⌘7', action: '/replacement',   category: 'SIMULATIONS' },
  { id: 'fragmentation', label: '08 Fragmentation: Internal & External', shortcut: '⌘8', action: '/fragmentation', category: 'SIMULATIONS' },
  { id: 'benchmark',     label: '09 Benchmark: Algorithm Arena',       shortcut: '⌘9', action: '/benchmark',     category: 'SIMULATIONS' },
  { id: 'landing',       label: 'Return to Landing Page',               shortcut: '⌘0', action: '/',              category: 'NAV' },
  { id: 'boot',          label: 'Replay Boot Sequence',                                 action: 'reboot',         category: 'SYSTEM' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const CommandCenter: React.FC<Props> = ({ isOpen, onClose, onAction }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleClose = useCallback(() => {
    setQuery('');
    setSelected(0);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((action: string) => {
    onAction(action);
    handleClose();
  }, [onAction, handleClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && filtered[selected]) {
        handleSelect(filtered[selected].action);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, filtered, selected, handleClose, handleSelect]);

  const categories = [...new Set(filtered.map(c => c.category))];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="cmd-center panel"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cmd-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="1" stroke="#B58A3A" strokeWidth="1.5"/>
                <rect x="9" y="9" width="6" height="6" fill="#B58A3A" fillOpacity="0.3" stroke="#B58A3A" strokeWidth="1"/>
              </svg>
              <span className="label label-cyan">KERNELVIZ COMMAND CENTER</span>
              <kbd className="cmd-esc" onClick={handleClose}>ESC</kbd>
            </div>
            <div className="cmd-search-wrap">
              <span className="cmd-search-icon">⌘</span>
              <input
                ref={inputRef}
                className="cmd-search"
                placeholder="Search commands..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
              />
            </div>
            <div className="cmd-list">
              {categories.map(cat => (
                <div key={cat}>
                  <div className="cmd-category">{cat}</div>
                  {filtered.filter(c => c.category === cat).map(cmd => {
                    const globalIdx = filtered.indexOf(cmd);
                    return (
                      <motion.button
                        key={cmd.id}
                        className={`cmd-item ${globalIdx === selected ? 'cmd-item--selected' : ''}`}
                        onClick={() => handleSelect(cmd.action)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.1 }}
                      >
                        <span>{cmd.label}</span>
                        {cmd.shortcut && <kbd className="cmd-shortcut">{cmd.shortcut}</kbd>}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="label cmd-empty">NO COMMANDS MATCH "{query}"</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

