import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function TransferModal({ isOpen, onClose, accounts = [], onSuccess }) {
  const [action, setAction] = useState('deposit'); // 'deposit' | 'withdrawal' | 'transfer'
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Synchronize state whenever modal opens or accounts update
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      setError(null);
      setSuccessMsg(null);
      setAmount('');
      setDescription('');

      const firstId = String(accounts[0].id);
      setSourceAccountId(firstId);

      if (accounts.length > 1) {
        setTargetAccountId(String(accounts[1].id));
        setAction('transfer');
      } else {
        setTargetAccountId('');
        setAction('deposit'); // Default to deposit if user only has 1 account
      }
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleSourceChange = (newSourceId) => {
    setSourceAccountId(newSourceId);
    setError(null);
    if (action === 'transfer') {
      const remaining = accounts.filter((a) => String(a.id) !== String(newSourceId));
      if (remaining.length > 0) {
        setTargetAccountId(String(remaining[0].id));
      } else {
        setTargetAccountId('');
      }
    }
  };

  const handleActionChange = (newAction) => {
    setAction(newAction);
    setError(null);
    if (newAction === 'transfer') {
      const remaining = accounts.filter((a) => String(a.id) !== String(sourceAccountId));
      if (remaining.length > 0) {
        setTargetAccountId(String(remaining[0].id));
      } else {
        setTargetAccountId('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const srcId = parseInt(sourceAccountId, 10);
    if (!srcId || isNaN(srcId)) {
      setError('Please select a valid account.');
      return;
    }

    if (action === 'transfer') {
      if (accounts.length < 2) {
        setError('An internal transfer requires at least two accounts. Please use Deposit / Withdrawal, or open a Savings account.');
        return;
      }
      const tgtId = parseInt(targetAccountId, 10);
      if (!tgtId || isNaN(tgtId)) {
        setError('Please select a destination account.');
        return;
      }
      if (srcId === tgtId) {
        setError('Source and destination accounts cannot be identical.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        action,
        account_id: srcId,
        amount,
        description: description || undefined,
      };

      if (action === 'transfer') {
        payload.target_account_id = parseInt(targetAccountId, 10);
      }

      const res = await api.executeTransaction(payload);
      setSuccessMsg(res.message || 'Transaction executed successfully.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isTransferDisabled = action === 'transfer' && accounts.length < 2;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Simulate Banking Operation</h3>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.25rem 0.5rem', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', backgroundColor: 'var(--bg-muted)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={`btn btn-sm ${action === 'transfer' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, border: action === 'transfer' ? 'none' : '1px solid transparent', backgroundColor: action === 'transfer' ? 'var(--accent-blue)' : 'transparent' }}
            onClick={() => handleActionChange('transfer')}
          >
            Transfer
          </button>
          <button
            type="button"
            className={`btn btn-sm ${action === 'deposit' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, border: action === 'deposit' ? 'none' : '1px solid transparent', backgroundColor: action === 'deposit' ? 'var(--accent-blue)' : 'transparent' }}
            onClick={() => handleActionChange('deposit')}
          >
            Deposit
          </button>
          <button
            type="button"
            className={`btn btn-sm ${action === 'withdrawal' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, border: action === 'withdrawal' ? 'none' : '1px solid transparent', backgroundColor: action === 'withdrawal' ? 'var(--accent-blue)' : 'transparent' }}
            onClick={() => handleActionChange('withdrawal')}
          >
            Withdrawal
          </button>
        </div>

        {/* Warning if trying to transfer with only 1 account */}
        {isTransferDisabled && (
          <div className="alert-banner alert-warning" style={{ padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.825rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Multiple Accounts Required:</strong> You only have 1 active account. Internal transfer requires a second account. Use the <strong>Deposit</strong> or <strong>Withdrawal</strong> tab, or open an account in the <strong>Accounts</strong> section.
            </div>
          </div>
        )}

        {error && (
          <div className="alert-banner alert-warning" style={{ padding: '0.65rem 1rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner alert-success" style={{ padding: '0.65rem 1rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {action === 'deposit' ? (
            <div className="form-group">
              <label className="form-label">Destination Account</label>
              <select
                className="form-select"
                value={sourceAccountId}
                onChange={(e) => handleSourceChange(e.target.value)}
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type} ({acc.account_number}) - ${acc.balance}
                  </option>
                ))}
              </select>
            </div>
          ) : action === 'withdrawal' ? (
            <div className="form-group">
              <label className="form-label">Withdraw From Account</label>
              <select
                className="form-select"
                value={sourceAccountId}
                onChange={(e) => handleSourceChange(e.target.value)}
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type} ({acc.account_number}) - ${acc.balance}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">From Account (Source)</label>
                <select
                  className="form-select"
                  value={sourceAccountId}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type} ({acc.account_number}) - ${acc.balance}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">To Account (Destination)</label>
                <select
                  className="form-select"
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  required
                  disabled={isTransferDisabled}
                >
                  {accounts.length < 2 ? (
                    <option value="" disabled>No second account available</option>
                  ) : (
                    <>
                      <option value="" disabled>Select destination account</option>
                      {accounts
                        .filter((acc) => String(acc.id) !== String(sourceAccountId))
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_type} ({acc.account_number}) - ${acc.balance}
                          </option>
                        ))}
                    </>
                  )}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Amount ($ USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Memo</label>
            <input
              type="text"
              className="form-input"
              placeholder={action === 'transfer' ? 'Internal Savings Transfer' : 'Simulated transaction'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading || isTransferDisabled}
            >
              {loading ? 'Processing...' : 'Confirm Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
