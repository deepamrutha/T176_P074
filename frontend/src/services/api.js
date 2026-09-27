const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Storage helpers for JWT and session management
 */
export const getToken = () => localStorage.getItem('securebank_token');
export const setToken = (token) => localStorage.setItem('securebank_token', token);
export const removeToken = () => {
  localStorage.removeItem('securebank_token');
  localStorage.removeItem('securebank_user');
};

export const getStoredUser = () => {
  const user = localStorage.getItem('securebank_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('securebank_user', JSON.stringify(user));
};

/**
 * Core authenticated fetch wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      // Token expired or invalid
      removeToken();
      window.dispatchEvent(new Event('auth-logout'));
    }
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Authentication
  async login(identifier, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (data.access_token) {
      setToken(data.access_token);
      setStoredUser(data.user);
    }
    return data;
  },

  async register(username, email, password, full_name) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, full_name }),
    });
    if (data.access_token) {
      setToken(data.access_token);
      setStoredUser(data.user);
    }
    return data;
  },

  async getMe() {
    return request('/auth/me');
  },

  logout() {
    removeToken();
    window.dispatchEvent(new Event('auth-logout'));
  },

  // Accounts
  async getAccounts() {
    return request('/accounts');
  },

  async getAccount(id) {
    return request(`/accounts/${id}`);
  },

  async createAccount(accountType, initialDeposit = 0) {
    return request('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        account_type: accountType,
        initial_deposit: initialDeposit,
      }),
    });
  },

  // Transactions (Simulated)
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.account_id) query.append('account_id', params.account_id);
    if (params.type) query.append('type', params.type);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/transactions${queryString}`);
  },

  async executeTransaction(payload) {
    return request('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Security & Health
  async getHealth() {
    return request('/health');
  },

  async getSecurityInfo() {
    return request('/security');
  },
};
