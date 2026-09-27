import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  PlusCircle,
  ShieldAlert,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import TransferModal from '../components/TransferModal';

export default function Dashboard({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_balance: '0.00', total_accounts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accRes, txnRes] = await Promise.all([
        api.getAccounts(),
        api.getTransactions({ limit: 6 }),
      ]);
      setAccounts(accRes.accounts || []);
      setSummary(accRes.summary || { total_balance: '0.00', total_accounts: 0 });
      setTransactions(txnRes.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to load account data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {/* Top Warning Banner */}
      <div className="alert-banner alert-warning">
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <strong>Azure Confidential Compute Notice:</strong> This session is running on an unverified local
          workstation. In-memory data is not protected by AMD SEV-SNP hardware memory encryption.
          Review our architectural evaluation in the{' '}
          <Link to="/compute-study" style={{ textDecoration: 'underline', fontWeight: 600 }}>
            Azure Compute Study Report &rarr;
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-warning" role="alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {loading && accounts.length === 0 && (
        <div className="alert-banner alert-info" role="status" style={{ marginBottom: '1.5rem' }}>
          Loading account data...
        </div>
      )}

      {/* Header and Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Welcome back, {user?.full_name || 'Client'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Account Portfolio & Simulated Financial Operations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            disabled={accounts.length === 0}
          >
            <ArrowLeftRight size={16} />
            <span>Simulate Operation</span>
          </button>
          <button onClick={loadData} className="btn btn-outline" title="Refresh portfolio">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Net Worth</span>
            <Wallet size={18} style={{ color: 'var(--status-green)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ${parseFloat(summary.total_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-caption)', marginTop: '0.25rem' }}>
            Across {summary.total_accounts} active deposit accounts
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Compute Isolation</span>
            <CreditCard size={18} style={{ color: 'var(--status-amber)' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-amber)', marginTop: '0.35rem' }}>
            Local (Unverified)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-caption)', marginTop: '0.35rem' }}>
            Target: Azure Confidential VM (Standard_DC2as_v5)
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Transaction Integrity</span>
            <PlusCircle size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '0.35rem' }}>
            Atomic Decimal (14, 2)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-caption)', marginTop: '0.35rem' }}>
            Strict precision; zero float distortion
          </div>
        </div>
      </div>

      {/* Accounts Breakdown */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Bank Accounts</h2>
          <Link to="/accounts" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>Manage Accounts</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid-cols-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: acc.account_type === 'Checking' ? 'var(--accent-blue)' : 'var(--status-green)',
                    background: acc.account_type === 'Checking' ? 'var(--accent-blue-subtle)' : 'var(--status-green-bg)',
                    border: acc.account_type === 'Checking' ? '1px solid var(--accent-blue-border)' : '1px solid var(--status-green-border)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {acc.account_type} Account
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-caption)', fontFamily: 'var(--font-mono)' }}>
                    {acc.account_number}
                  </span>
                </div>

                <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-caption)' }}>Status: Active (Simulated)</span>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-outline btn-sm"
                >
                  Quick Transact
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Recent Activity</h2>
          <Link to="/transactions" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>View Full History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount ($ USD)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No recent transactions found. Use "Simulate Operation" above to perform a transaction.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isPositive = txn.transaction_type === 'DEPOSIT' || txn.transaction_type === 'TRANSFER_IN';
                  return (
                    <tr key={txn.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isPositive ? (
                            <ArrowDownLeft size={14} style={{ color: 'var(--status-green)' }} />
                          ) : (
                            <ArrowUpRight size={14} style={{ color: 'var(--status-red)' }} />
                          )}
                          <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>
                            {txn.transaction_type}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{txn.description}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-caption)' }}>
                        {txn.reference_number}
                      </td>
                      <td style={{ color: 'var(--text-caption)', fontSize: '0.8rem' }}>
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--status-green-bg)',
                          border: '1px solid var(--status-green-border)',
                          color: 'var(--status-green)'
                        }}>
                          {txn.status}
                        </span>
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isPositive ? 'var(--status-green)' : 'var(--status-red)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {isPositive ? '+' : '-'}${parseFloat(txn.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Transfer Modal */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        onSuccess={loadData}
      />
    </div>
  );
}
