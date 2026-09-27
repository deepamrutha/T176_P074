import React from 'react';
import { ShieldCheck, Info, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-blue)' }} />
            <strong style={{ color: 'var(--text-main)' }}>Azure Confidential or Isolated Compute Design Study</strong>
          </div>
          <p style={{ maxWidth: '650px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Academic demonstration of simulated financial transactions and Azure compute trust boundaries.
            No Azure deployment or confidential VM attestation is verified.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link to="/compute-study" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
            <FileText size={15} />
            <span>Architecture Report</span>
          </Link>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-caption)' }}>
            College Project Edition (2025–2026)
          </span>
        </div>
      </div>
    </footer>
  );
}
