# Azure Policy & Multi-Region Quota Investigation Report

> **Document Type:** Azure Subscription, Policy & Capacity Audit  
> **Investigation Date:** September 2026  
> **Target Subscription:** Azure for Students (`[subscription ID redacted]`)  
> **Subscription State:** Enabled ($100 student balance)  
> **Key Finding 1:** Azure Policy strictly restricts deployments to **5 allowed regions**.  
> **Key Finding 2:** Modern Confidential VM families have **0 vCPUs quota** across all 5 allowed student regions.  
> **Implemented Resolution:** Live deployment using **Trusted Launch Gen2 AMD EPYC VM (`Standard_B2as_v2`)** in `centralindia`.

---

## 1. Azure Policy Restriction: Allowed Resource Deployment Regions

When attempting infrastructure deployment, Azure Resource Manager evaluates subscription-level policies. The audit uncovered the following enforced policy:

* **Policy Definition:** `Allowed resource deployment regions`
* **Policy ID:** `/subscriptions/[subscription ID redacted]/providers/Microsoft.Authorization/policyAssignments/...`
* **Enforced Behavior:** Any deployment outside the allowed list is rejected immediately with error:
  ```json
  {
    "code": "RequestDisallowedByAzure",
    "target": "SecureBank-RG",
    "message": "Resource was disallowed by policy. Policy: Allowed resource deployment regions."
  }
  ```
* **Strictly Allowed Regions (5 datacenter locations):**
  1. `centralindia` (Central India - Pune)
  2. `koreacentral` (Korea Central - Seoul)
  3. `indonesiacentral` (Indonesia Central - Jakarta)
  4. `eastasia` (East Asia - Hong Kong)
  5. `malaysiawest` (Malaysia West)

---

## 2. Multi-Region Quota Audit Across All 5 Allowed Regions

A systematic automated scan was conducted across all 5 policy-permitted regions for Confidential VM families:

```bash
for reg in centralindia koreacentral indonesiacentral eastasia malaysiawest; do
  echo "=== Region: $reg ==="
  az vm list-usage --location $reg --output json | \
    jq -r '.[] | select(.name.value | test("dc|sgx|confidential"; "i")) | "\(.name.value) : \(.currentValue) / \(.limit)"'
done
```

### Empirical Audit Matrix:

| VM Family / SKU Family | Central India | Korea Central | Indonesia Central | East Asia | Malaysia West |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`standardDCasv6Family`** (AMD SEV-SNP v6) | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| **`standardECasv6Family`** (AMD SEV-SNP v6) | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| **`standardDCASv5Family`** (AMD SEV-SNP v5) | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| **`standardDCADSv5Family`** (AMD SEV-SNP v5) | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| **`standardDCSv3Family`** (Intel SGX / TDX) | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| **`standardDDCSv3Family`** (Intel SGX v3) | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| **`standardDCSv2Family`** (Intel SGX v2) | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| **`standardDCSFamily`** (Intel SGX Gen 1) | 0 / 2 | 0 / 2 | 0 / 2 | 0 / 2 | 0 / 2 |

### Hardware Allocation Attempt for `standardDCSFamily`:
Although `standardDCSFamily` lists a quota limit of 2, attempting to provision `Standard_DC2s` in `centralindia` resulted in an Azure Compute allocation error:
> `InvalidParameter: The requested VM size Standard_DC2s is not available in the current region.`

Modern Azure hypervisor clusters have phased out Gen1 SGX hardware in favor of Gen3/Gen4 clusters (`Standard_DC2s_v3`, `Standard_DC2as_v5`, `Standard_DC2as_v6`), which are locked at 0 vCPUs for student subscriptions.

---

## 3. General-Purpose & Trusted Launch Quotas in `centralindia`

By contrast, general-purpose compute families that support **Gen 2 Trusted Launch (Secure Boot + vTPM 2.0)** have active quota in `centralindia`:

| VM Family | Current Value | Regional Limit | Availability |
| :--- | :--- | :--- | :--- |
| **`Standard Basv2 Family vCPUs`** | 2 | **10** | **Available (AMD EPYC)** |
| **`Standard BS Family vCPUs`** | 0 | **4** | **Available** |
| **`Standard DSv4 Family vCPUs`** | 0 | **4** | **Available** |
| **`Standard DSv5 Family vCPUs`** | 0 | **4** | **Available** |
| **`Total Regional vCPUs`** | 2 | **6** | **2 used / 4 remaining** |

---

## 4. Live Deployment Strategy & Architectural Transparency

In accordance with strict academic and engineering standards:
1. **Never Falsify Attestation:** An ordinary or Trusted Launch VM is never represented as a true hardware Confidential VM.
2. **Demonstrate Deployed Architecture:** To satisfy the live cloud deployment requirement, we provisioned `Standard_B2as_v2` in `centralindia`:
   - Processor: **AMD EPYC 7763 64-Core Processor**
   - Security Type: **Trusted Launch**
   - Boot Protections: **UEFI Secure Boot enabled**
   - Hardware vTPM: **vTPM 2.0 active** (`/dev/tpm0` and `/dev/tpmrm0`)
   - Services Deployed: **PostgreSQL 14, Gunicorn Flask Backend, Nginx Web Server, React 19 Frontend**
3. **Document Confidential Compute as Target:** The target confidential architecture (`Standard_DC2as_v6` with AMD SEV-SNP memory encryption) is modeled in the application's threat analysis and security evaluation endpoints (`/api/security`).

---

## 5. Formal Quota Increase Request Procedure

To upgrade the live `SecureBank-VM` to a true `Standard_DC2as_v6` Confidential VM:

1. **Access Azure Portal Quota Blade:**
   `https://portal.azure.com/#blade/Microsoft_Azure_Capacity/UsageAndQuota`
2. **Parameters to Specify:**
   - **Subscription:** `Azure for Students` (`[subscription ID redacted]`)
   - **Provider:** `Microsoft.Compute`
   - **Location:** `Central India` (`centralindia`)
   - **Quota Name:** `Standard DCasv6 Family vCPUs`
   - **New Limit Requested:** `4`
3. **Business Justification:**
   > *"Academic research and hackathon demonstration on Azure Confidential Computing (AMD SEV-SNP hardware memory encryption) for sensitive banking workloads."*
4. **Post-Approval Action:**
   Once granted, execute:
   ```bash
   az vm stop --resource-group SecureBank-RG --name SecureBank-VM
   az vm update --resource-group SecureBank-RG --name SecureBank-VM --set hardwareProfile.vmSize=Standard_DC2as_v6
   az vm update --resource-group SecureBank-RG --name SecureBank-VM --set securityProfile.securityType=ConfidentialVM
   az vm start --resource-group SecureBank-RG --name SecureBank-VM
   ```
