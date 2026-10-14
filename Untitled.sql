SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT * FROM users;
SELECT * FROM bank_accounts;
SELECT * FROM transactions;