# SecureBank: Azure Confidential or Isolated Compute Design Study

> **A College Hackathon & Academic Cloud Security Architecture Project**  
> **Repository:** `~/Downloads/Azure/az`  
> **Status:** Architecture Design Study with Working Local Application Prototype

---

## 🏛️ Project Overview

SecureBank is a financial ledger demonstration application and cloud cybersecurity architecture study. The project investigates how sensitive financial workloads can be protected in Microsoft Azure using **Confidential Virtual Machines** backed by **AMD SEV-SNP (Secure Encrypted Virtualization-Secure Nested Paging)** and virtual Trusted Platform Module (**vTPM 2.0**) hardware attestation.

### Core Objectives
1. **Working Banking Demonstration:** A robust full-stack web application (React 19 + Python Flask + PostgreSQL 17) implementing strict decimal-precision banking math, multi-tenant ownership boundaries, salted password hashing, and double-entry transaction ledgers.
2. **Azure Confidential Compute Study:** An evidence-based architectural design evaluating **Standard VMs**, **Trusted Launch VMs**, **Isolated VMs**, and **Confidential VMs** for protecting sensitive data-in-use.
3. **Truthful Infrastructure Auditing:** Documenting actual Azure subscription findings from Azure Cloud Shell in South India (`southindia`), identifying AMD SEV-SNP SKUs, and analyzing regional quota limits.

---

## ☁️ Azure Cloud Study Findings & Status

The cloud research component of this project was conducted using **Azure Cloud Shell** under an **Azure for Students** subscription:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               AZURE FEASIBILITY SUMMARY                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Subscription: Azure for Students (Status: Enabled)                                  │
│ • Region Checked: South India (southindia)                                             │
│ • Discovered SKUs: Standard_DC2as_v6 (2 vCPU, 8 GB) & Standard_EC2as_v6 (2 vCPU, 16 GB)│
│ • Hardware Feature: Both SKUs list "ConfidentialComputingType: SNP" (AMD SEV-SNP)      │
│ • Regional Quota: Current limit for DCasv6 & ECasv6 families is 0 vCPUs                │
│ • Deployment Outcome: No cloud VM was provisioned or billed                            │
│ • Attestation Outcome: No Azure hardware attestation was performed                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
*For complete Cloud Shell telemetry and technical explanations of why SKU availability $\ne$ quota, see [`docs/azure-quota-limitation.md`](docs/azure-quota-limitation.md).*

---

## 🚀 Local Setup & Quick Start

The entire application runs locally using your choice of PostgreSQL 17 or local development configuration.

### Prerequisites
- **Python 3.10+** (Python 3.14 verified)
- **Node.js 18+** & **npm 9+**
- **PostgreSQL 17** (with database `securebank` configured in pgAdmin 4)

### 1. Backend Setup & Run

```bash
# Navigate to the backend directory
cd ~/Downloads/Azure/az/backend

# Activate the virtual environment
source venv/bin/activate

# (Optional) Verify PostgreSQL connectivity
python run.py --check-db

# Seed demo personas idempotently (skips existing records)
python run.py --seed-only

# Start the Flask API server on port 5001
python run.py --port 5001
```
*Backend API runs at:* `http://127.0.0.1:5001`  
*API Health Endpoint:* `http://127.0.0.1:5001/api/health`

### 2. Frontend Setup & Run

```bash
# In a separate terminal, navigate to the frontend directory
cd ~/Downloads/Azure/az/frontend

# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```
*Frontend Web UI runs at:* `http://localhost:5173`

---

## 🔑 Demo Personas for Evaluation

The database seeder populates fictional banking profiles for immediate review:

| Persona | Email / Username | Password | Configured Balances | Demonstration Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Retail Client 1** | `sarah.chen@example.com` | Configured locally | Checking: **$12,450.50**<br/>Savings: **$45,800.00** | Demonstrating transfers, deposits, withdrawals, ledger |
| **Retail Client 2** | `marcus.vance@example.com` | Configured locally | Checking: **$5,230.15** | Verifying multi-tenant account isolation |
| **Auditor** | `auditor@securebank.internal` | Configured locally | Auditor role | Regulatory review and threat model inspection |

Keep demo passwords only in your ignored local environment/database. The login page does not prefill passwords. Do not publish or reuse demo credentials.

---

## 🧪 Automated Testing & Verification

The project includes automated verification across all security boundaries, multi-tenancy controls, and monetary arithmetic:

```bash
# Run the complete backend test suite (32 unit & integration tests)
cd ~/Downloads/Azure/az
PYTHONPATH=backend backend/venv/bin/python -m pytest backend/tests/ -v

# Run the frontend production build check
cd ~/Downloads/Azure/az/frontend
npm run build
```

**Verified Test Results:**
- **Backend Tests:** **32 passed in 4.95s (100% pass rate)**.
- **Frontend Build:** **Vite build completed in 1.06s with 0 errors**.

*Detailed test logs and verification evidence can be found in [`docs/local-demo-and-test-evidence.md`](docs/local-demo-and-test-evidence.md).*

---

## 📚 Hackathon Review & Architecture Documentation

All project documentation is located in the [`docs/`](docs/) directory:

| Document | Purpose & Core Content |
| :--- | :--- |
| [**`securebank-azure-architecture.svg`**](docs/securebank-azure-architecture.svg) | **Official Architecture Diagram** (Crisp vector SVG suitable for presentations) |
| [**`azure-confidential-compute-study.md`**](docs/azure-confidential-compute-study.md) | Full architectural study: AMD SEV-SNP, vTPM attestation, network boundaries |
| [**`azure-quota-limitation.md`**](docs/azure-quota-limitation.md) | South India findings: `Standard_DC2as_v6`, family quota = 0, next steps |
| [**`securebank-architecture.md`**](docs/securebank-architecture.md) | Application specification: multi-tier data flow, PostgreSQL schema, security controls |
| [**`local-demo-and-test-evidence.md`**](docs/local-demo-and-test-evidence.md) | Complete demonstration script, input validation tests, and test execution logs |
| [**`hackathon-review-presentation.md`**](docs/hackathon-review-presentation.md) | **8–10 Slide Presentation Outline** with speaker notes for judges |
| [**`screenshots/README.md`**](docs/screenshots/README.md) | Checklist of 16 required local and cloud demonstration screenshots |

---

## ⚠️ Known Limitations & Scope Boundaries

1. **Hardware-Enforced Memory Encryption:** Real AMD SEV-SNP memory encryption requires genuine CPU hardware on an Azure DC-series host. Local execution simulates application security controls, but cannot enforce hardware-encrypted RAM.
2. **Quota Barrier:** The Azure for Students subscription quota for `Standard DCasv6 Family` is 0 vCPUs in South India, preventing live cloud provisioning without an enterprise quota increase.
3. **No Direct Azure Attestation:** Because no cloud VM was deployed, remote attestation via `/dev/sev-guest` and Microsoft Azure Attestation (MAA) could not be executed live.
4. **Simulated Financial Transactions:** All banking operations are simulated within the local database for educational and demonstration purposes. No real banking networks or payment rails are integrated.
