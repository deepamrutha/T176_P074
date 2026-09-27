# Hackathon Screenshot Checklist

Capture screenshots manually from the actual application, terminal, pgAdmin, or Azure portal. Do not create mock evidence. Do not include passwords, tokens, connection strings, private keys, or other secrets. Mark each item captured only after saving the genuine screenshot in this directory. No screenshots are claimed as captured by this checklist.

## Local Application and Test Evidence

- [ ] `01-login-screen.png` - login screen with demo account shortcuts; keep password field blank and do not show credentials.
- [ ] `02-dashboard.png` - dashboard with the local/unverified compute notice and fictional account balances.
- [ ] `03-accounts.png` - account list/details with ownership context and masked list values.
- [ ] `04-successful-transfer.png` - completed simulated transfer and resulting balances.
- [ ] `05-rejected-transfer.png` - insufficient-funds rejection; show unchanged balances/ledger.
- [ ] `06-user-isolation.png` - two separate demo-user sessions showing only each user's own accounts.
- [ ] `07-backend-tests.png` - actual complete backend test output from the final run.
- [ ] `08-frontend-build.png` - actual successful production build output.
- [ ] `09-pgadmin-tables.png` - local PostgreSQL `securebank` tables (`users`, `bank_accounts`, `transactions`); avoid exposing password hashes or personal data.

## Azure Evidence (Actual Cloud Shell Findings & Pending Deployment)

- [ ] `azure-00-cloud-shell-quota.png` - actual Azure Cloud Shell terminal showing `az vm list-usage --location southindia -o table` and `Standard DCasv6 Family vCPUs: 0` (genuine evidence of quota audit).
- [ ] `azure-01-subscription-budget.png` - active subscription and credits/budget in the portal.
- [ ] `azure-02-resource-group.png` - project resource group (`SecureBank-RG`), if created.
- [ ] `azure-03-confidential-vm-configuration.png` - VM creation wizard showing `Standard_DC2as_v6` and Confidential security type.
- [ ] `azure-04-disk-security.png` - OS disk security and Secure Boot/vTPM settings.
- [ ] `azure-05-deployed-vm-overview.png` - deployed VM state (pending quota approval).
- [ ] `azure-06-attestation-evidence.png` - guest attestation validation result (pending hardware deployment).
- [ ] `azure-07-live-application-health.png` - live cloud health check (pending hardware deployment).

At the time this checklist was prepared, Azure deployment and attestation evidence are unverified due to regional quota = 0. If no Azure VM is deployed, leave those items pending rather than substituting architecture diagrams or mock outputs.
