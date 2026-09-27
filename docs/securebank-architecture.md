# SecureBank System Architecture & Technical Specification

> **Project Title:** SecureBank — Azure Confidential or Isolated Compute Design Study  
> **Repository Root:** `~/Downloads/Azure/az`  
> **Architecture Diagram:** [`docs/securebank-azure-architecture.svg`](securebank-azure-architecture.svg)

---

## 1. System Overview

SecureBank is a cloud-native financial ledger and banking demonstration platform designed to evaluate security boundaries across modern public cloud computing tiers. It pairs a **production-grade local banking application** with an **evidence-based Azure Confidential Computing design study**.

### Key Architectural Pillars
1. **Zero Floating-Point Drift:** Every account balance, deposit, withdrawal, and transfer executes strictly through Python's `decimal.Decimal` and SQL `numeric(14,2)` types.
2. **Multi-Tenant Ownership Isolation:** Every database read and write is scoped strictly to the authenticated `user_id` extracted from the cryptographically verified JWT bearer token.
3. **Defense-in-Depth:** Password storage uses PBKDF2-SHA256 with 600,000 hash iterations and unique random salts; CORS headers restrict cross-origin requests; account numbers are masked (`SB-****-****-8471`) on presentation layers.
4. **Relational Ledger Integrity:** Financial transactions follow double-entry consistency principles with unique reference strings (`TXN-YYYYMMDD-...`), atomic row-locking (`SELECT FOR UPDATE`), and transactional rollback on failures.

---

## 2. Multi-Tier Architecture & Data Flow

```
┌─────────────────┐       HTTPS / TLS 1.3      ┌─────────────────────────┐
│   Web Browser   │ ─────────────────────────> │   React 19 Frontend     │
│  (Client Tier)  │ <───────────────────────── │      (Vite Dev)         │
└─────────────────┘                            └─────────────────────────┘
         │                                                  │
         │ REST API Calls                                   │
         │ Authorization: Bearer <JWT>                      │
         ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Flask Backend API Service (Port 5001)                │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Auth & JWT Layer    │  │        Banking Logic Service          │  │
│  │  • Login / Register   │  │  • Strict Decimal Arithmetic          │  │
│  │  • PBKDF2-SHA256 Hash │  │  • Overdraft & Inactive Protection    │  │
│  │  • Stateless Tokens   │  │  • Atomic Paired Ledger Transfers     │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                Compute & Attestation Diagnostic Engine           │  │
│  │  • Inspects /dev/sev-guest & Kernel CPU Flags                    │  │
│  │  • Emits Truthful Environment Status (LOCAL_UNVERIFIED)          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
         │
         │ PostgreSQL Native Driver (Psycopg 3)
         │ SSL Mode / Atomic Transactions
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│               PostgreSQL 17 Relational Database (Port 5432)            │
│                                                                        │
│   ┌─────────────────────┐   ┌────────────────────┐   ┌──────────────┐  │
│   │     users table     │   │ bank_accounts table│   │ transactions │  │
│   │ • id (PK)           │───│ • id (PK)          │───│ • id (PK)    │  │
│   │ • email (Unique)    │ 1 │ • user_id (FK)     │ 1 │ • account_id │  │
│   │ • password_hash     │   │ • balance numeric  │   │ • reference  │  │
│   │ • role (CLIENT/AUD) │   │ • account_number   │   │ • amount num │  │
│   └─────────────────────┘ N └────────────────────┘ N └──────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Software Modules & Implementation Details

### 3.1 Backend Application (`backend/app/`)
- **Application Factory (`backend/app/__init__.py`):** Configures Flask extensions, database initialization, CORS bindings, and registers blueprints (`auth`, `accounts`, `transactions`, `security`).
- **Data Models (`backend/app/models/`):**
  - `User`: Manages identity, email uniqueness, role assignment (`CLIENT` or `AUDITOR`), and secure hashing via `werkzeug.security`.
  - `BankAccount`: Enforces numeric balance tracking (`Numeric(14, 2)`), masked presentation strings, and ownership linkages.
  - `Transaction`: Immutable historical journal recording transfers, deposits, withdrawals, references, and timestamps.
- **Banking Service (`backend/app/services/banking_service.py`):**
  - Atomic transfer execution with row-level locks to prevent race conditions.
  - Validation rules: rejects non-positive values, sub-cent fractions, non-finite values (NaN/Infinity), and transfers between identical source and destination accounts.
  - Rollback safety: if any stage fails during an internal transfer, all ledger changes are reverted completely.
- **Compute Diagnostics (`backend/app/services/compute_service.py`):**
  - Dynamically inspects host hardware, operating system, and the presence of `/dev/sev-guest`.
  - Accurately declares the active environment as `LOCAL_UNVERIFIED` with truthful diagnostic messaging.

### 3.2 Frontend Application (`frontend/src/`)
- **State Management & Services (`frontend/src/services/api.js`):** Axios-based HTTP client managing JWT token injection, automated logout on HTTP 401, and standardized error parsing.
- **Views & Components:**
  - `Login.jsx`: Sign-in interface with 1-click evaluation shortcuts for fictional demo personas.
  - `Dashboard.jsx`: Metric summaries, balance cards, account cards, recent transaction list, and unverified runtime warning banner.
  - `Accounts.jsx`: Detailed account overview and single-click workflow for opening additional Checking or Savings accounts.
  - `Transactions.jsx`: Auditable transaction ledger with real-time filtering by transaction type.
  - `TransferModal.jsx`: Interactive modal for simulating deposits, withdrawals, and transfers with multi-account validation and clear user guidance.
  - `ComputeStudy.jsx`: Research report view containing the 4-tier compute comparison matrix, STRIDE threat model, vTPM attestation lifecycle, and PCI-DSS compliance mapping.

---

## 4. Database Schema Specification (PostgreSQL 17)

The application utilizes three relational tables in the `public` schema of database `securebank`:

```sql
-- 1. Users Table
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bank Accounts Table
CREATE TABLE public.bank_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_number VARCHAR(32) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL DEFAULT 'CHECKING',
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transactions Table (Immutable Ledger)
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    description VARCHAR(255),
    reference_number VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Security & Verification Attributes

| Control Area | Implementation Mechanism | Verified Proof Point |
| :--- | :--- | :--- |
| **Authentication** | Salted PBKDF2-SHA256 & JWT Bearer | `test_auth.py` (7 tests passing) |
| **Multi-Tenancy** | Ownership-filtered queries (`user_id`) | `test_access_control.py` (6 tests passing) |
| **Ledger Precision** | SQL `Numeric(14,2)` & Python `Decimal` | `test_banking.py` (12 tests passing) |
| **Attestation Truth** | Explicit local warning & status badge | `test_health.py` (4 tests passing) |
| **Model Integrity** | Masking logic & reference generator | `test_models.py` (3 tests passing) |
