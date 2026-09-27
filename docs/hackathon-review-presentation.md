# SecureBank: Hackathon Review Presentation Outline

> **Project Title:** SecureBank — Azure Confidential or Isolated Compute Design Study  
> **Presentation Duration:** 5–7 Minutes (8–10 Slide Formal Outline)  
> **Target Audience:** Hackathon Judges, Faculty Evaluators & Cloud Architecture Reviewers

---

## Slide 1: Title & Project Objective

### Title:
**SecureBank: Azure Confidential or Isolated Compute Design Study**
*Evaluating Hardware-Enforced Memory Encryption for Mission-Critical Financial Workloads*

### Presenter Notes / Speaking Points:
- "Welcome judges. Our project investigates the ultimate frontier in cloud cybersecurity: **Confidential Computing**."
- "The objective of our work is twofold:
  1. To deliver a working, production-grade financial web application (**SecureBank**) featuring strict decimal precision, multi-tenant isolation, and auditable ledger persistence.
  2. To conduct a rigorous architectural evaluation of Microsoft Azure compute options (Standard, Trusted Launch, Isolated, and Confidential VMs) using genuine Azure Cloud Shell telemetry."

---

## Slide 2: Problem Statement — The Data-in-Use Vulnerability

### Key Points:
- **The Triad of Data Protection:**
  - *Data-at-Rest:* Solved via AES-256 storage encryption.
  - *Data-in-Transit:* Solved via TLS 1.3 protocol encryption.
  - *Data-in-Use (RAM):* **The Critical Vulnerability in Modern Cloud Computing.**
- **The Threat Reality:**
  - Standard virtual machines process plaintext bank account numbers, balances, and encryption keys in physical RAM.
  - A compromised hypervisor, rogue datacenter technician, or memory bus snooper can dump memory and compromise customer financial data.
  - In standard cloud models, customers must place unconditional trust in the hypervisor and cloud operator.

---

## Slide 3: SecureBank Application Architecture

### Key Points:
- **Decoupled 3-Tier Enterprise Architecture:**
  - **Presentation Tier:** React 19 + Vite with an academic, high-contrast white theme and client-side transfer validation.
  - **Application Tier:** Python 3.10+ Flask REST API running on Gunicorn WSGI with stateless JWT authentication and strict arbitrary-precision `decimal.Decimal` arithmetic.
  - **Data Tier:** PostgreSQL 17 relational database enforcing strict foreign-key constraints, row-level locking (`SELECT FOR UPDATE`), and immutable transaction journals.
- **Reference Diagram:** See [`docs/securebank-azure-architecture.svg`](securebank-azure-architecture.svg).

---

## Slide 4: Confidential Computing Overview (AMD SEV-SNP)

### Key Points:
- **Silicon Root of Trust:**
  - Hardware-enforced encryption driven by the on-die **AMD Secure Processor (ASP)**.
  - Ephemeral AES-128/256 memory encryption keys are generated directly inside the CPU memory controller at VM boot; keys never leave the silicon die.
- **Secure Nested Paging (SNP):**
  - Prevents hypervisors from tampering with or replaying memory pages.
- **Zero-Trust Hypervisor:**
  - The hypervisor is **formally excluded from the Trusted Computing Base (TCB)**.
  - Even with administrative root access on the physical host, memory dumps yield only undecryptable ciphertext.

---

## Slide 5: Azure VM Options Comparison

| Feature Dimension | Standard VM | Trusted Launch VM | Isolated VM | Confidential VM (DC2as_v6) |
| :--- | :---: | :---: | :---: | :---: |
| **Boot Integrity (Secure Boot + vTPM)**| ❌ Optional | ✅ **Included** | ❌ Optional | ✅ **Included** |
| **Data-in-Use (RAM Encryption)** | ❌ Plaintext | ❌ **Plaintext** | ❌ Plaintext | ✅ **Hardware AES-128/256** |
| **Hypervisor Trust Assumption** | In TCB | In TCB | In TCB | 🛡️ **Zero Trust (Excluded)** |
| **Operator Memory Dump Defense** | ❌ Vulnerable | ❌ Vulnerable | ❌ Vulnerable | ✅ **Hardware Mitigated** |
| **Monthly Sizing Economics** | Baseline ($) | Baseline ($) | Prohibitive ($$$$) | Modest (~15–22% premium) |

### Key Judge Takeaway:
*"Trusted Launch protects the bootloader from rootkits, but leaves memory in plaintext. Isolated VMs offer physical single-tenancy at extreme cost, but the hypervisor still reads RAM. Only Confidential VMs provide memory encryption and Zero-Trust hypervisor protection at sustainable costs."*

---

## Slide 6: Security Design & Cryptographic Boundaries

### Key Points:
- **Network Segmentation:** Virtual Network (`10.1.0.0/16`) divided into Ingress (App Gateway WAF), Application Subnet (Confidential VM), and Data Subnet (PostgreSQL via Private Link). No public IP addresses on the backend or database.
- **Remote Attestation Flow:**
  1. Guest VM retrieves hardware measurement quote from AMD Secure Processor via `/dev/sev-guest`.
  2. Quote submitted to **Microsoft Azure Attestation (MAA)**.
  3. MAA validates silicon signature and issues an attestation token to **Azure Key Vault Managed HSM** for Secure Key Release (SKR).
- **Application Security Controls:** Salted PBKDF2-SHA256 password hashing (600,000 iterations), atomic database transaction rollbacks, masked account presentation (`SB-****-****-8471`).

---

## Slide 7: Azure Subscription & Quota Findings (South India)

### Key Points:
- **Verified via Azure Cloud Shell:**
  - Subscription: **Azure for Students (Enabled)**.
  - Region Inspected: **South India (`southindia`)**.
  - Hardware Discovery: `Standard_DC2as_v6` (2 vCPU, 8 GB) & `Standard_EC2as_v6` (2 vCPU, 16 GB) exist with AMD SEV-SNP support and zero SKU restrictions.
- **The Quota Reality:**
  - `az vm list-usage` confirmed **quota = 0 vCPUs** for `Standard DCasv6 Family` under student accounts.
- **Rigorous Academic Honesty:**
  - We do not claim a cloud VM was deployed or attested.
  - We clearly document why SKU availability $\ne$ subscription quota.
  - All application functionality is proven through our local implementation.

---

## 8. Local Application Demonstration

### Live Demo Actions:
1. **1-Click Login:** Authenticate as Dr. Sarah Chen (`sarah.chen@example.com`).
2. **Truthful Compute Badge:** Highlight the prominent dashboard badge declaring `LOCAL_UNVERIFIED` (showing that our software honestly reports local hardware limitations).
3. **Simulated Atomic Transfer:** Execute a `$500.00` transfer from Checking to Savings; show immediate balance reconciliation and paired ledger entries.
4. **Safety & Validation:** Attempt an overdraft of `$100,000.00`; show immediate HTTP 400 rejection and unchanged balances.
5. **Multi-Tenant Isolation:** Sign in as Marcus Vance; prove zero visibility into Sarah Chen's accounts.

---

## Slide 9: Testing & Database Verification Evidence

### Key Points:
- **Automated Test Suite:**
  - Executed via `pytest`: **32 / 32 tests passed (100% success rate) in 4.95 seconds**.
  - Covers authentication, multi-tenant access control, decimal precision, non-finite input rejection, and model logic.
- **Production Build:**
  - Vite production build compiles in **1.06 seconds with 0 errors**.
- **PostgreSQL 17 Relational Verification:**
  - Tables `users`, `bank_accounts`, `transactions` configured in pgAdmin 4.
  - All balances verified as `numeric(14,2)` avoiding IEEE-754 floating-point errors.

---

## Slide 10: Conclusion, Limitations & Future Roadmap

### Key Points:
- **Conclusion:** Confidential computing represents the necessary standard for banking workloads in public cloud, delivering Zero-Trust hypervisor isolation at minimal overhead (~2%).
- **Project Limitations:**
  - Local demonstration simulates application-tier access controls, but genuine hardware memory encryption requires an active AMD SEV-SNP host.
  - Azure for Students quota restrictions prevented live cloud provisioning.
- **Future Roadmap:**
  - Request enterprise quota for `Standard_DC2as_v6`.
  - Implement live in-guest attestation daemon communicating with Microsoft Azure Attestation and Azure Key Vault Managed HSM.
