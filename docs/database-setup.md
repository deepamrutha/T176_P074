# PostgreSQL 17 & pgAdmin 4 Configuration Guide for SecureBank

This guide provides exact instructions for configuring PostgreSQL 17 and inspecting the SecureBank database using pgAdmin 4.

---

## 1. Prerequisites
- **PostgreSQL 17** installed and running on `localhost:5432`.
- **pgAdmin 4** installed for graphical database inspection.

---

## 2. Creating the `securebank` Database in pgAdmin 4

1. **Open pgAdmin 4**:
   Launch pgAdmin 4 from your Applications folder or system tray.
2. **Connect to PostgreSQL Server**:
   In the left-hand browser panel, expand **Servers** > **PostgreSQL 17** (or your local server instance). Enter your `postgres` superuser password if prompted.
3. **Create Database**:
   - Right-click on **Databases** > Select **Create** > **Database...**
   - In the **Database** field, enter: `securebank`
   - In the **Owner** field, keep `postgres` (or select a dedicated user).
   - Click **Save**.

Alternatively, if you prefer the pgAdmin Query Tool or terminal:
```sql
CREATE DATABASE securebank WITH ENCODING 'UTF8';
```

---

## 3. Configuring Backend Environment (`backend/.env`)

1. Configure the ignored `backend/.env` file. Do not overwrite an existing `.env` file. The example file is a reference only.

2. Set `DATABASE_URL` to your local PostgreSQL connection string:
   ```ini
   DATABASE_URL=postgresql+psycopg://<db-user>:<url-encoded-password>@localhost:5432/securebank
   ```

If the password contains reserved URI characters, URL-encode them before using the connection string. Do not print or commit the connection string.

---

## 4. Initializing Schema & Seeding Demo Records

With PostgreSQL running and the existing `.env` configured, verify the engine and seed only if needed:
```bash
cd ~/Downloads/Azure/az/backend
source venv/bin/activate
python run.py --check-db
python run.py --seed-only
```

Seeding adds missing demo records and does not reset the database. If a demo user is missing, the corresponding demo password must be set in the ignored `.env`; existing user hashes are not changed.

You should see:
```text
[Seed] Initializing database schema...
[Seed] Creating primary demo client (Sarah Chen)...
[Seed] Creating secondary demo client for isolation testing (Marcus Vance)...
[Seed] Creating compliance & security auditor account...
[Seed] Demo database seeding completed successfully!
```

---

## 5. Inspecting Tables & Rows in pgAdmin 4

After running the seed script:
1. In pgAdmin 4, navigate through the tree:
   `Servers` > `PostgreSQL 17` > `Databases` > `securebank` > `Schemas` > `public` > `Tables`.
2. You will observe three tables:
   - **`users`**: Contains salted password hashes (PBKDF2-SHA256), email addresses, and roles (`CLIENT`, `AUDITOR`). Notice that plaintext passwords are never stored.
   - **`bank_accounts`**: Contains account numbers and balances stored as `numeric(14,2)` to guarantee exact financial precision without IEEE-754 floating-point rounding errors.
   - **`transactions`**: Contains immutable historical records for deposits, withdrawals, and transfers with unique reference numbers (`TXN-...`).
3. To view data:
   - Right-click on any table (e.g., `bank_accounts`) > **View/Edit Data** > **All Rows**.
   - Or open the **Query Tool** (Alt+Shift+Q or lightning icon) and run:
     ```sql
     SELECT u.full_name, u.email, b.account_number, b.account_type, b.balance
     FROM users u
     JOIN bank_accounts b ON u.id = b.user_id
     ORDER BY u.id;
     ```

---

## 6. Test Database

The application uses PostgreSQL and does not silently switch to SQLite. The automated test fixture explicitly uses an in-memory SQLite database so tests do not touch the configured PostgreSQL data.
