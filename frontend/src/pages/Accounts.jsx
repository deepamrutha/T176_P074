import React, { useEffect, useState } from 'react';
import { CreditCard, PlusCircle, ArrowLeftRight, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { api } from '../services/api';
import TransferModal from '../components/TransferModal';

export default function Accounts({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAccountType, setNewAccountType] = useState('Savings');
  const [initialDeposit, setInitialDeposit] = useState('500.00');
  const [createMsg, setCreateMsg] = useState(null);
  const [createErr, setCreateErr] = useState(null);
  const [pageError, setPageError] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await api.getAccounts();
      setAccounts(data.accounts || []);
      if (data.accounts?.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0].id);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setPageError(err.message || 'Unable to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      api.getAccount(selectedAccount)
        .then((res) => setAccountDetails(res))
        .catch((err) => {
          console.error('Error fetching account details:', err);
          setPageError(err.message || 'Unable to load account details.');
        });
    }
  }, [selectedAccount]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateErr(null);
    setCreateMsg(null);

    try {
      const res = await api.createAccount(newAccountType, initialDeposit || '0');
      setCreateMsg(res.message);
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateMsg(null);
        fetchAccounts();
      }, 1000);
    } catch (err) {
      setCreateErr(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Deposit Accounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Managed accounts, privacy masking, and account creation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Open New Account</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-outline">
            <ArrowLeftRight size={16} />
            <span>Transact</span>
          </button>
        </div>
      </div>

      {pageError && (
        <div className="alert-banner alert-warning" role="alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{pageError}</span>
        </div>
      )}
      {loading && accounts.length === 0 && (
        <div className="alert-banner alert-info" role="status" style={{ marginBottom: '1.5rem' }}>
          Loading accounts...
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        {accounts.map((acc) => {
          const isSelected = selectedAccount === acc.id;
          return (
            <div
              key={acc.id}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)',
                backgroundColor: isSelected ? 'var(--accent-blue-subtle)' : '#ffffff',
                boxShadow: isSelected ? '0 0 0 1px var(--accent-blue)' : 'none',
              }}
              onClick={() => setSelectedAccount(acc.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  color: acc.account_type === 'Checking' ? 'var(--accent-blue)' : acc.account_type === 'Savings' ? 'var(--status-green)' : 'var(--text-main)',
                  background: acc.account_type === 'Checking' ? 'var(--accent-blue-subtle)' : acc.account_type === 'Savings' ? 'var(--status-green-bg)' : 'var(--bg-muted)',
                  border: acc.account_type === 'Checking' ? '1px solid var(--accent-blue-border)' : acc.account_type === 'Savings' ? '1px solid var(--status-green-border)' : '1px solid var(--border-color)',
                }}>
                  {acc.account_type}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-caption)', fontFamily: 'var(--font-mono)' }}>
                  {acc.account_number}
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-caption)' }}>
                <span>Currency: {acc.currency}</span>
                <span style={{ color: isSelected ? 'var(--accent-blue)' : 'var(--text-caption)', fontWeight: 600 }}>
                  {isSelected ? '● Selected View' : 'Click to inspect'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Details & Associated Transactions */}
      {accountDetails && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.3rem' }}>{accountDetails.account.account_type} Account Details</h2>
                <span className="compute-tag compute-tag-confidential" style={{ fontSize: '0.7rem' }}>
                  Tenant Verified
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Internal Account Number: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{accountDetails.account.raw_account_number}</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-caption)' }}>Current Available Balance</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--status-green)', fontFamily: 'var(--font-mono)' }}>
                ${parseFloat(accountDetails.account.balance).toFixed(2)}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Account Activity</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount ($ USD)</th>
                </tr>
              </thead>
              <tbody>
                {accountDetails.recent_transactions?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                      No transactions recorded for this account.
                    </td>
                  </tr>
                ) : (
                  accountDetails.recent_transactions.map((txn) => {
                    const isPos = txn.transaction_type === 'DEPOSIT' || txn.transaction_type === 'TRANSFER_IN';
                    return (
                      <tr key={txn.id}>
                        <td style={{ fontWeight: 500 }}>{txn.transaction_type}</td>
                        <td>{txn.description}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-caption)' }}>
                          {txn.reference_number}
                        </td>
                        <td style={{ color: 'var(--text-caption)', fontSize: '0.8rem' }}>
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                        <td style={{
                          textAlign: 'right',
                          fontWeight: 600,
                          color: isPos ? 'var(--status-green)' : 'var(--status-red)',
                          fontFamily: 'var(--font-mono)',
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
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Open Additional Bank Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Create an additional simulated bank account for investment or high-yield savings.
            </p>

            {createErr && (
              <div className="alert-banner alert-warning" style={{ padding: '0.65rem 1rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{createErr}</span>
              </div>
            )}
            {createMsg && (
              <div className="alert-banner alert-success" style={{ padding: '0.65rem 1rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={16} />
                <span>{createMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select
                  className="form-select"
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                >
                  <option value="Savings">High-Yield Savings Account</option>
                  <option value="Investment">Investment Portfolio Account</option>
                  <option value="Checking">Secondary Checking Account</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Opening Deposit ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  className="form-input"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Establish Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Transfer Modal */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        onSuccess={() => {
          fetchAccounts();
          if (selectedAccount) {
            api.getAccount(selectedAccount).then(setAccountDetails);
          }
        }}
      />
    </div>
  );
}
