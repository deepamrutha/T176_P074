import sys
import re
import argparse
from sqlalchemy import text
from app import create_app
from app.extensions import db
from app.seed import seed_demo_data
from app.models.user import User
from app.models.account import BankAccount
from app.models.transaction import Transaction

app = create_app()


def mask_url_password(url: str) -> str:
    """Masks database password in connection string for safe printing."""
    if not url:
        return ""
    return re.sub(r":([^:@/]+)@", ":****@", url)


def check_database_status():
    """Detailed diagnostic for PostgreSQL 17 and SQLite fallback connectivity."""
    db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    masked_uri = mask_url_password(db_uri)

    print("=================================================================")
    print(" SecureBank Database Connectivity Diagnostic")
    print(f" Target URI: {masked_uri}")
    print("=================================================================")

    try:
        db.session.execute(text("SELECT 1"))
        engine_name = db.engine.name

        print(f"✅ Connection Status: SUCCESS")
        print(f"📊 Active Database Engine: {engine_name.upper()}")

        if engine_name == "postgresql":
            print("🚀 Successfully connected to PostgreSQL 17 server via Psycopg 3!")
        else:
            print("ℹ️ Currently running on local SQLite fallback (securebank.db).")
            print("   To switch to PostgreSQL 17:")
            print("   1. Create database 'securebank' in pgAdmin 4.")
            print("   2. Update DATABASE_URL in backend/.env with your postgres password.")

        # Inspect table rows
        user_count = User.query.count()
        account_count = BankAccount.query.count()
        txn_count = Transaction.query.count()

        print("-----------------------------------------------------------------")
        print(f"👥 Users in Database:        {user_count}")
        print(f"💳 Bank Accounts:            {account_count}")
        print(f"📝 Transactions Recorded:    {txn_count}")
        print("=================================================================")

        if user_count == 0:
            print("Tip: Run `python run.py --seed-only` to populate demo accounts.")

        return True

    except Exception as e:
        print(f"❌ Connection Status: FAILED")
        print(f"Error Type: {type(e).__name__}")
        print("-----------------------------------------------------------------")
        print("Troubleshooting Steps for PostgreSQL 17:")
        print("1. Ensure PostgreSQL 17 server is started in pgAdmin 4.")
        print("2. In pgAdmin 4, verify that database 'securebank' exists under Servers > PostgreSQL 17.")
        print("3. Check your password in backend/.env (URL-encode special characters like @ or #).")
        print("=================================================================")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SecureBank Backend Application Runner")
    parser.add_argument("--seed", action="store_true", help="Seed the database with demo users, accounts, and transactions")
    parser.add_argument("--seed-only", action="store_true", help="Seed the database and exit immediately without starting the server")
    parser.add_argument("--check-db", action="store_true", help="Diagnose database connection and report engine status and row counts")
    parser.add_argument("--port", type=int, default=None, help="Port to bind the server to (default from env or 5001)")
    parser.add_argument("--host", type=str, default=None, help="Host to bind the server to (default from env or 127.0.0.1)")

    args = parser.parse_args()

    with app.app_context():
        if args.check_db:
            success = check_database_status()
            sys.exit(0 if success else 1)

        if args.seed or args.seed_only:
            seed_demo_data()
            if args.seed_only:
                print("[Seed] Completed. Exiting.")
                sys.exit(0)

    # Determine host and port
    host = args.host or app.config.get("BACKEND_HOST", "127.0.0.1")
    port = args.port or app.config.get("BACKEND_PORT", 5001)

    print(f"=================================================================")
    print(f" SecureBank Backend API Server")
    print(f" Binding: http://{host}:{port}")
    print(f" Environment: {app.config.get('COMPUTE_ENVIRONMENT', 'LOCAL_UNVERIFIED')}")
    print(f" Database: {mask_url_password(app.config.get('SQLALCHEMY_DATABASE_URI'))}")
    print(f"=================================================================")

    app.run(host=host, port=port, debug=app.config.get("DEBUG", True))
