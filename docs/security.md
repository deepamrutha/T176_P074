# Security Controls and Limitations

## Implemented in the Prototype

- Passwords are stored as Werkzeug PBKDF2-SHA256 hashes with 600,000 iterations and per-password salts.
- JWT bearer tokens are signed by Flask-JWT-Extended and have a configurable expiration (24 hours by default).
- Account and transaction reads are scoped to the authenticated user. Transfer destinations must belong to the same user.
- Deposit, withdrawal, and transfer balance updates and ledger writes use database transactions. PostgreSQL balance reads are row-locked; transfer rows are locked in stable ID order. Failures roll back.
- Monetary input is parsed with `Decimal`; non-finite, sub-cent, non-positive, and out-of-range amounts are rejected. PostgreSQL columns use `numeric(14,2)`.
- ORM queries are parameterized. Unexpected transaction exceptions return a generic API error.
- The app uses the configured PostgreSQL URL with Psycopg 3. SQLite is selected explicitly only by the test configuration.
- New seeded demo users require passwords in ignored local environment variables. Existing user hashes are not reset by seeding.

## Limitations and Operational Risks

- This is a local demo, not a production banking system. Balances and transactions are fictional; no payment networks are connected.
- The frontend stores JWTs in browser local storage, which increases exposure if a cross-site scripting vulnerability is introduced.
- Local development uses HTTP. TLS termination, production ingress controls, rate limiting, monitoring, and a production database deployment are not configured here.
- The development configuration has fallback signing keys for convenience. Production mode now requires explicit `SECRET_KEY` and `JWT_SECRET_KEY` values of at least 32 characters. Use unique, randomly generated secrets from a secret manager; do not commit them.
- The app has a role field, but does not implement role-specific auditor/admin authorization policies.
- Tests use SQLite and do not stress-test concurrent PostgreSQL requests. PostgreSQL row locks are implemented, but concurrency behavior has not been load-tested.
- The runtime assessment does not verify Azure. An environment label or device-file indicator is not an attestation report.
- Azure Attestation, Key Vault, Managed HSM, confidential disk encryption, and Azure networking controls are not implemented.

## Compliance

This prototype has not been assessed or certified against PCI DSS, SOC 2, or GDPR. See [compliance notes](compliance-justification.md) for control relevance and boundaries.
