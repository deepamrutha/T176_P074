# Azure Resource Inventory & Architecture Mapping

> **Project Title:** Azure Confidential or Isolated Compute Design Study  
> **Target Cloud Environment:** Microsoft Azure  
> **Reported Region:** `centralindia` (reported as allowed by Azure Policy; not independently verified during publishing)  
> **Resource Group:** `SecureBank-RG`  
> **Live VM Public IP:** [redacted in public copy]
> **Reported Deployment Status:** A prior project record describes a running Trusted Launch VM. Current Azure resources and status were not independently verified during this publishing task.

Public IP addresses and credentials are intentionally omitted. Verify resource state in the Azure portal before presenting these reported details as current evidence.

---

## 1. Live Deployed Resources vs Target Architecture

This inventory records cloud components previously reported for SecureBank. The resource names, configuration, and statuses below are not independently verified here. It distinguishes the reported demonstration architecture from the target confidential-compute design:

| Resource Name | Azure Resource Type | SKU / Sizing | Subnet / Placement | Purpose & Security Role | Reported Status (unverified) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`SecureBank-RG`** | Resource Group | N/A | Region: `centralindia` | Lifecycle boundary for all project assets | **Provisioned & Active** |
| **`SecureBank-VNet`** | `Microsoft.Network/virtualNetworks` | `10.1.0.0/16` | Region: `centralindia` | Private address space isolating all tiers | **Provisioned & Active** |
| **`AppSubnet`** | Subnet | `10.1.1.0/24` | `SecureBank-VNet` | Subnet hosting VM and application services | **Provisioned & Active** |
| **`DatabaseSubnet`** | Subnet | `10.1.2.0/24` | `SecureBank-VNet` | Reserved subnet for private managed database tier | **Provisioned & Active** |
| **`SecureBank-NSG`** | `Microsoft.Network/networkSecurityGroups`| Standard | Associated to `AppSubnet` | Restricts SSH to admin IP range; allows 80, 443, 5001 | **Provisioned & Active** |
| **`SecureBank-Confidential-VMPublicIP`** | `Microsoft.Network/publicIPAddresses`| Standard (Static) | Bound to VM NIC | External IP: **`[public IP redacted]`** | **Provisioned & Active** |
| **`SecureBank-Confidential-VMVMNic`** | `Microsoft.Network/networkInterfaces`| Standard | `AppSubnet` (IP: `10.1.1.4`) | Network interface bound to `SecureBank-VM` | **Provisioned & Active** |
| **`SecureBank-VM`** | `Microsoft.Compute/virtualMachines` | `Standard_B2as_v2` | `AppSubnet` (Private IP: `10.1.1.4`) | **AMD EPYC 7763, Trusted Launch (Secure Boot + vTPM 2.0)** | **LIVE & RUNNING** |
| **PostgreSQL 14** | Relational Database | Local on VM | Port `5432` (`localhost`) | Database engine for users, accounts, transactions | **Provisioned & Active** |
| **Gunicorn + Flask** | Application Server | 3 Sync Workers | Port `5001` (`127.0.0.1:5001`) | Backend API, JWT authentication, banking logic | **Provisioned & Active** |
| **Nginx** | Reverse Proxy & Web Server | Latest Ubuntu pkg | Port `80` (`[public IP redacted]:80`) | Serves React 19 frontend; proxies `/api/` to Flask | **Provisioned & Active** |
| **`Standard_DC2as_v6`** | `Microsoft.Compute/virtualMachines` | Target CVM (AMD SEV-SNP) | Architecture Target | Full hardware TEE memory encryption | **Gated by Quota (0 vCPUs)** |

---

## 2. Network Security Group Configuration (`SecureBank-NSG`)

Attached to `AppSubnet` (`10.1.1.0/24`):

| Priority | Rule Name | Port(s) | Protocol | Direction | Source | Action | Justification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **100** | `Allow-SSH-Admin` | `22` | TCP | Inbound | `[public IP redacted]/24` | **Allow** | Restricts SSH administrative management strictly to developer/evaluator IP range. |
| **110** | `Allow-HTTP-API` | `80`, `443`, `5001`| TCP | Inbound | `*` | **Allow** | Allows evaluators and reviewers to access web UI on port 80 and direct API on port 5001. |
| **65000** | `Deny-All-Inbound` | `*` | Any | Inbound | `*` | **Deny** | Azure default deny rule closing all unapproved inbound ports. |

---

## 3. Compute Tier Analysis: Deployed vs Confidential Target

| Capability / Attribute | Live Deployed: `Standard_B2as_v2` | Target Study SKU: `Standard_DC2as_v6` |
| :--- | :--- | :--- |
| **CPU Architecture** | AMD EPYC™ 7763 64-Core Processor | AMD EPYC™ 4th Gen (Genoa) |
| **vCPUs / Memory** | 2 vCPUs / 8 GiB RAM | 2 vCPUs / 8 GiB RAM |
| **Security Type** | **Trusted Launch** (Gen 2) | **Confidential VM (TEE)** |
| **Secure Boot** | **Enabled** (Verifies kernel/bootloader integrity) | **Enabled** |
| **Virtual TPM (vTPM 2.0)** | **Enabled** (`/dev/tpm0`, `/dev/tpmrm0` present) | **Enabled** |
| **Memory Encryption** | None (Physical RAM plaintext to host hypervisor) | **AMD SEV-SNP Hardware Memory Controller AES-128/256** |
| **Hypervisor in TCB** | **YES** (Azure host and hypervisor inside trust boundary) | **NO** (Hypervisor excluded from guest memory boundary) |
| **Remote Attestation** | Integrity measurements only (boot logs) | Cryptographic attestation quote signed by AMD PSP |
| **Quota Status** | Available (Basv2 limit = 10; Regional limit = 6) | Gated (limit = 0 across all 5 allowed student regions) |

---

## 4. Live Verification Endpoints

The deployed application is live and accessible at:

* **Web UI (React 19 + Tailwind):** `https://[deployment-url-not-published]/`
* **API Health Check:** `https://[deployment-url-not-published]/api/health`
* **API Security & Compute Assessment:** `https://[deployment-url-not-published]/api/security`
* **Direct Backend API Port:** `https://[deployment-url-not-published]/api/health`
* **Demo Client Credentials:** configured privately; not published.
* **Demo Auditor Credentials:** configured privately; not published.

---

## 5. Single-Command Cleanup

To destroy all Azure resources created for this demonstration:

```bash
az group delete --name SecureBank-RG --yes --no-wait
```
