# Azure Cost Estimate & Budget Optimization Guide

> **Project Title:** Azure Confidential or Isolated Compute Design Study  
> **Subscription Scope:** Azure for Students ($100 Annual Credit Cap)  
> **Deployment Target:** Microsoft Azure (`southindia` region)  
> **Design Strategy:** Minimize unnecessary paid services; maximize evaluation per credit dollar.

---

## 1. Executive Cost Analysis

Financial and enterprise architectures must balance security guarantees with economic realities. This estimate details the costs associated with the SecureBank proposed infrastructure, demonstrating that **Confidential Computing provides enterprise-grade memory protection at a fraction of the cost of physical isolated hardware**.

---

## 2. Granular Resource Cost Breakdown (Estimated Pricing)

| Resource Component | Sizing / SKU | Hourly Rate (Approx.) | Monthly Rate (24/7) | 2-Hour Review Session | Cost Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Confidential Virtual Machine** | `Standard_DC2as_v6` (2 vCPU, 8 GB) | ~$0.118 / hr | ~$86.14 / month | **$0.24** | Billable when allocated |
| **OS Managed Disk** | 32 GiB Standard SSD (E4) | ~$0.003 / hr | ~$2.40 / month | **$0.01** | Billable until disk deleted |
| **Public IP Address** | Standard Static IPv4 | ~$0.005 / hr | ~$3.65 / month | **$0.01** | Billable until IP deleted |
| **PostgreSQL Flexible Server** | `Standard_B1ms` (1 vCPU, 2 GB) | ~$0.021 / hr | ~$15.33 / month | **$0.04** | Billable when active |
| **Virtual Network & Subnets** | `10.1.0.0/16` (Private) | **Free ($0.00)** | **Free ($0.00)** | **$0.00** | Free networking feature |
| **Network Security Groups** | 2 NSGs (`nsg-app`, `nsg-db`) | **Free ($0.00)** | **Free ($0.00)** | **$0.00** | Free security feature |
| **Inbound Data Transfer** | Incoming web traffic | **Free ($0.00)** | **Free ($0.00)** | **$0.00** | Free ingress bandwidth |
| **Total Estimated Demonstration Cost**| | | | **~$0.30** | **Safe for Student Budget** |

---

## 3. Compute Tier Economic Comparison

To satisfy the hackathon evaluation requirements, we evaluated the monthly cost of all four compute options:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MONTHLY COMPUTE PRICING COMPARISON                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Azure Standard VM (Standard_D2s_v5 - 2 vCPU, 8 GB):                                 │
│    • Cost: ~$70.08 / month                                                             │
│    • Assessment: Baseline virtualized compute; plaintext RAM; hypervisor in TCB.        │
│                                                                                        │
│ 2. Azure Trusted Launch VM (Standard_D2s_v5 Gen2 with Trusted Launch):                │
│    • Cost: ~$70.08 / month ($0.00 additional surcharge)                                │
│    • Assessment: Adds boot integrity; memory remains plaintext in RAM.                 │
│                                                                                        │
│ 3. Azure Confidential VM (Standard_DC2as_v6 - 2 vCPU, 8 GB AMD SEV-SNP):             │
│    • Cost: ~$86.14 / month (~22% premium over standard)                               │
│    • Assessment: Hardware-encrypted RAM; Zero-Trust hypervisor; affordable for bank.    │
│                                                                                        │
│ 4. Azure Isolated VM (Standard_E80ids_v4 - 80 vCPU, 504 GB):                           │
│    • Cost: ~$3,842.00 / month (Requires dedicated physical blade reservation)          │
│    • Assessment: Exceeds student budget 38x; memory still unencrypted; impractical.    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> **Hackathon Key Economic Finding:**  
> Moving from Standard VM to **Confidential VM** represents a modest **~22% cost premium** to gain hardware-enforced memory encryption and Zero-Trust hypervisor exclusion. By contrast, an **Isolated VM costs over 44 times more** while failing to protect memory from host hypervisors.

---

## 4. Critical Warning on Stopped vs Deleted Cloud Resources

> [!CAUTION]
> **Understanding Cloud Billing States**:
> Clicking **"Stop"** on a virtual machine in the Azure portal or issuing `az vm stop` transitions the VM to a stopped state, but **billing continues for attached disks, reserved public IP addresses, and database instances**.
>
> To stop **100% of charges**, you must delete the entire containing Resource Group:
> ```bash
> az group delete --name SecureBank-RG --yes --no-wait
> ```

---

## 5. Budget Safeguards for Students

1. **Spending Cap:** Azure for Students includes an automatic spending cap that suspends resources if the $100 credit is depleted, preventing unexpected out-of-pocket charges.
2. **Short-Lived Demonstrations:** If deployed for a 2-hour viva or hackathon presentation, the total cloud spend is less than **$0.35**.
3. **Automated Teardown Script:** Ensure the cleanup command is run immediately after screenshots and evaluation are complete.
