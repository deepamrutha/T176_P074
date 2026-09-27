import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  Info,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import TransferModal from '../components/TransferModal';

export default function Transactions({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accRes, txnRes] = await Promise.all([
        api.getAccounts(),
        api.getTransactions({
          account_id: accountFilter || undefined,
          type: typeFilter || undefined,
          limit: 100,
        }),
      ]);
      setAccounts(accRes.accounts || []);
      setTransactions(txnRes.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Unable to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, accountFilter]);

  const filteredTransactions = transactions.filter((txn) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      txn.description?.toLowerCase().includes(term) ||
      txn.reference_number?.toLowerCase().includes(term) ||
      txn.amount?.includes(term)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Transaction History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Auditable, immutable ledger of all simulated banking operations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <ArrowLeftRight size={16} />
            <span>Simulate New Transaction</span>
          </button>
          <button onClick={fetchData} className="btn btn-outline" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-warning" role="alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {loading && transactions.length === 0 && (
        <div className="alert-banner alert-info" role="status" style={{ marginBottom: '1.5rem' }}>
          Loading transactions...
        </div>
      )}

      {/* Simulation Notice Banner */}
      <div className="alert-banner alert-info" style={{ marginBottom: '1.5rem' }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Academic Demonstration Mode:</strong> All transactions are executed within an atomic local database
          transaction and simulated banking ledger. No real payment gateways or credit rails are connected.
        </span>
      </div>

      {/* Filter and Search Controls */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by description or reference ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Transaction Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="TRANSFER_IN">Transfers Received</option>
              <option value="TRANSFER_OUT">Transfers Sent</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <select
              className="form-select"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
            >
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_type} ({acc.account_number})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Reference Number</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount ($ USD)</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  {searchTerm || typeFilter || accountFilter
                    ? 'No transactions matched your search criteria.'
                    : 'No transactions found. Click "Simulate New Transaction" above to test.'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => {
                const isPos = txn.transaction_type === 'DEPOSIT' || txn.transaction_type === 'TRANSFER_IN';
                return (
                  <tr key={txn.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {isPos ? (
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
                      {new Date(txn.created_at).toLocaleString()}
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
                      fontFamily: 'var(--font-mono)',
                      color: isPos ? 'var(--status-green)' : 'var(--status-red)',
                    }}>
                      {isPos ? '+' : '-'}${parseFloat(txn.amount).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        onSuccess={fetchData}
      />
    </div>
  );
}
