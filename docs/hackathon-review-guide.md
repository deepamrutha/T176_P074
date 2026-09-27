# SecureBank Hackathon Review Guide

## Project Objective

Demonstrate a fictional banking workload and compare how Azure Standard VMs, Trusted Launch VMs, isolated VM sizes, and confidential VMs address different security goals. The app is a local prototype; the Azure compute portion is an architecture study, not a deployment claim.

## Architecture

React/Vite on port 5173 calls Flask on port 5001 through the Vite `/api` proxy. Flask issues and validates JWT bearer tokens, enforces user/account ownership, and stores simulated balances and ledger entries in local PostgreSQL 17 through Psycopg 3. See [architecture](architecture.md).

## Implemented Features

- Login, registration, logout, JWT-protected routes, and safe profile responses.
- User-scoped account and transaction listing, account detail ownership checks, and same-user transfers.
- Simulated deposits, withdrawals, and transfers with cent-precision `Decimal`, PostgreSQL `numeric(14,2)`, overdraft validation, row locks, and rollback.
- Health endpoint and qualitative compute-study endpoint.
- Four-tier compute comparison and an explicit unverified local/runtime status.

## Evidence and Limitations

Backend test and frontend build results are recorded in [testing](testing.md) after local validation. PostgreSQL connectivity is checked using `python run.py --check-db`; do not include database credentials in screenshots. There is no Azure deployment, MAA quote validation, confidential VM proof, Key Vault integration, or live Azure health evidence. No compliance certification is claimed.

## Azure Compute Comparison

Trusted Launch protects boot integrity with Secure Boot and vTPM measured boot when configured; it is not confidential memory encryption. Isolated VM sizes provide dedicated physical host tenancy, which is a different property from protecting guest memory from the host. Confidential VMs use a supported hardware TEE to protect guest memory and processor state, but do not remove the need to secure the guest, app, data, identity, and operations. Verify current VM sizes, regions, quota, capacity, and cost in the portal; do not quote unverified prices.

## Demonstration Order

1. Open the login page and use a local demo account shortcut; enter the locally configured password.
2. Sign in and show the dashboard's fictional balances and local/unverified compute notice.
3. Open Accounts and show account ownership and masked account numbers.
4. Show the Transactions list and perform a small same-user transfer.
5. Attempt an amount greater than the available source balance and show rejection without balance or ledger changes.
6. Sign out, sign in as a second demo user, and show that the first user's accounts and transactions are not visible.
7. Open the Azure Compute Study and explain the four trust models, planned-only attestation flow, and local test/build evidence.
8. Show PostgreSQL tables and actual test output. Present Azure portal evidence only if you personally captured it from a real deployment.

## Possible Viva Questions

**Does Trusted Launch encrypt VM memory from the hypervisor?** No. It strengthens the boot chain; it is not equivalent to confidential VM memory protection.

**Does an isolated VM provide confidential computing?** Not by itself. Dedicated physical tenancy and hardware-backed guest-memory protection address different threat models.

**Has SecureBank been deployed to a confidential VM or attested?** No. The current app runs locally and does not validate Azure Attestation evidence.

**Does a confidential VM make an application secure or compliant?** No. It can reduce host access to protected guest state, but application and operational controls and formal assessments are still required.

**Is this a real bank or payment demo?** No. It is a fictional application with simulated balances and no payment gateway.
