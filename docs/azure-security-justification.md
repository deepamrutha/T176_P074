# Azure Security & Compliance Justification

> **Project Title:** Azure Confidential or Isolated Compute Design Study  
> **Application:** SecureBank Cloud Banking Workload  
> **Target Frameworks:** PCI-DSS 4.0, GDPR Article 32, NIST SP 800-53, Zero-Trust Architecture

---

## 1. Regulatory Drivers for Confidential Computing in Banking

Banking and financial payment workloads are governed by strict international cybersecurity and privacy mandates. The transition from on-premises hardware security modules (HSMs) to public multi-tenant clouds creates compliance gaps that only **Confidential Computing** can bridge.

### 1.1 PCI-DSS 4.0 (Payment Card Industry Data Security Standard)
- **Requirement 3 (Protect Stored Account Data):**
  - Traditional compliance relied on encrypting primary account numbers (PAN) and authentication data at rest.
  - **PCI-DSS 4.0 Requirement 3.4 & 3.5:** Mandates strong cryptographic protection whenever cardholder data is handled. In standard cloud VMs, card numbers and CVV codes are decrypted into plaintext RAM during transaction processing.
  - **Confidential Computing Justification:** AMD SEV-SNP hardware memory encryption guarantees that memory pages containing PANs and transaction payloads are encrypted with silicon-level AES-256 keys, protecting data even if the host hypervisor is compromised.
- **Requirement 6 (Develop and Maintain Secure Systems):**
  - Requires mitigation of known vulnerabilities in system software.
  - **Confidential Computing Justification:** Virtual TPM 2.0 with Measured Boot ensures that only cryptographically verified, untampered kernel binaries and drivers can boot the banking application.

### 1.2 GDPR (General Data Protection Regulation) Article 32
- **Security of Processing:** Mandates the implementation of technical and organizational measures to ensure a level of security appropriate to the risk, including the pseudonymization and encryption of personal data.
- **Cross-Border & Operator Access Restrictions:** Under standard cloud infrastructure, cloud provider personnel with physical datacenter access or elevated hypervisor debugging rights could theoretically access customer records.
- **Confidential Computing Justification:** Because memory encryption keys are maintained exclusively inside the AMD Secure Processor on the CPU die, **Microsoft operators, datacenter engineers, and third-party sub-processors cannot view customer financial records**.

---

## 2. Technical Justification for Security Boundaries

### 2.1 The Zero-Trust Hypervisor Principle
In traditional cloud virtualization (Azure Standard VMs), the hypervisor (`Microsoft Hyper-V`) is inside the **Trusted Computing Base (TCB)**:

```
+-------------------------------------------------------------------------------+
| TRADITIONAL COMPUTE (Hypervisor in TCB)                                       |
|                                                                               |
| [ Customer Banking App ] ──> Plaintext Memory (RAM)                           |
|            ▲                                                                  |
|            │ (Full Memory Read/Write Access)                                  |
| [ Host Hypervisor / Cloud Operators ]  <-- SINGLE POINT OF FAILURE            |
+-------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
| CONFIDENTIAL COMPUTE (Zero-Trust Hypervisor via AMD SEV-SNP)                 |
|                                                                               |
| [ Customer Banking App ] ──> AES-128/256 Encrypted Memory (Hardware Keys)     |
|            ▲                                                                  |
|            │ (BLOCKED by AMD Silicon Memory Controller & RMP)                |
| [ Host Hypervisor / Cloud Operators ]  <-- EXCLUDED FROM TRUST BASE           |
+-------------------------------------------------------------------------------+
```

By excluding the hypervisor from the TCB, SecureBank eliminates entire classes of catastrophic vulnerabilities:
- **Hypervisor Breakout Exploits:** Co-located malicious tenants cannot read adjacent memory pages.
- **Cold-Boot & Physical RAM Probes:** Physical memory bus snooping on DDR DIMMs reveals only encrypted ciphertext.
- **Memory Injection & State Corruption:** Secure Nested Paging (SNP) prevents the host from altering guest memory or replaying historical memory states.

---

## 3. Network Access & Defense-in-Depth Justification

Every network security rule in the SecureBank architecture serves a specific, documented security function:

| Rule Identifier | Target Port | Traffic Scope | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **`Allow-SSH-Admin`** | TCP 22 | Administrator IP Only (`/32`) | **Eliminates Brute-Force Surface:** Disallowing 0.0.0.0/0 on SSH prevents automated scanning and credential stuffing attacks from the public internet. |
| **`Allow-HTTP-API`** | TCP 5001 / 443 | Public Internet | **Legitimate Client Ingress:** Required for end-users and reviewers to access the SecureBank REST API and web application. |
| **`Allow-App-PostgreSQL`**| TCP 5432 | Application Subnet Only (`10.1.1.0/24`) | **Database Isolation:** Guarantees that PostgreSQL can only accept connections originating from inside the private application enclave. |
| **`Deny-DB-Internet`** | Any | Public Internet | **Zero Database Exposure:** Prevents direct internet queries, port scanning, and SQL injection probes from reaching the database listener directly. |

---

## 4. Attestation & Cryptographic Root of Trust

### Why Hardware Attestation Matters
In high-assurance banking environments, an application must cryptographically prove its identity and integrity before sensitive master keys are released:
1. **Measured Boot:** As the virtual machine initializes, the vTPM measures the hash of each boot component (UEFI firmware, GRUB bootloader, Linux kernel, and initrd) into Platform Configuration Registers (PCRs).
2. **Silicon Signature:** The AMD Secure Processor generates an attestation quote containing these PCR measurements and signs it using the AMD Versioned Chip Endorsement Key (VCEK), which is cryptographically rooted in AMD's hardware certificate authority.
3. **Microsoft Azure Attestation (MAA):** Validates the quote against an administrator-defined attestation policy.
4. **Secure Key Release (SKR):** Azure Key Vault Managed HSM releases database credentials and TLS keys *only* after MAA validates that the VM is running an untampered build in a genuine confidential enclave.

---

## 5. Scientific Rigor: Local Prototype vs Cloud Silicon

> [!IMPORTANT]
> **Honest Engineering Notice**:
> Software-level controls (such as JWT tokens, bcrypt/PBKDF2 hashing, and SQL row-level isolation) are fully operational and verified in the local SecureBank application. However, **hardware memory encryption and remote attestation can only be verified on physical AMD SEV-SNP silicon in Azure**. This study provides the comprehensive architecture and security design while awaiting regional quota allocation.
