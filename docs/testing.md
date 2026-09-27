# Local Verification Record

Results below are from the current local workspace. They do not verify Azure deployment, confidential VM hardware, attestation, or compliance.

## Backend Tests

Command:

```bash
cd ~/Downloads/Azure/az/backend
source venv/bin/activate
python -m pytest tests/ -v
```

Result: **32 passed in 5.08s** using Python 3.14.6 and pytest 8.4.2. Test fixtures use an isolated in-memory SQLite database; application PostgreSQL connectivity was checked separately. Coverage includes successful/invalid login, auth-required routes, account/transaction isolation, cross-user transfer destination rejection, insufficient funds without balance/ledger changes, account-opening deposit validation, finite cent-precision amounts, decimal calculations, health/security endpoints, false-attestation prevention, and production signing-secret requirements.

## Frontend Build

Command:

```bash
cd ~/Downloads/Azure/az/frontend
npm run build
```

Result: **Succeeded** with Vite 6.4.3; 1,920 modules transformed; build completed in 1.02s.

## PostgreSQL Connectivity

Command:

```bash
cd ~/Downloads/Azure/az/backend
source venv/bin/activate
python run.py --check-db
```

Observed during this review: connection succeeded and the active engine reported PostgreSQL through Psycopg 3. The diagnostic masks the connection URL password. No seed or reset command was run during verification. `db.create_all()` runs at app startup as existing behavior; it creates missing tables but does not migrate or delete existing data.

A temporary server bound to `127.0.0.1:5001` returned HTTP 200 from `/api/health` with status `healthy`, database engine `postgresql`, and compute tier `Local Workstation (Unverified)`. The temporary server was stopped after the check.

## Not Verified

- No Azure resource or subscription state was inspected.
- No Azure VM, Trusted Launch setting, isolated VM, confidential VM, guest attestation, or key release was deployed or verified.
- No browser automation or manual responsive-device test was run.
- The test suite uses SQLite and does not exercise concurrent requests against PostgreSQL; PostgreSQL row locking is implemented but not load-tested.
