from decimal import Decimal
from datetime import datetime, timezone, timedelta
import os
from app.extensions import db
from app.models.user import User
from app.models.account import BankAccount
from app.models.transaction import Transaction


def _required_demo_password(name):
    password = os.getenv(name)
    if not password or len(password) < 12:
        raise RuntimeError(f"Set {name} to a local password of at least 12 characters before creating demo users.")
    return password


def seed_demo_data():
    """
    Populates the database with realistic, clearly fictional banking records
    for demonstration and evaluation purposes.
    Idempotent: Checks existence per-record and never creates duplicate users,
    accounts, or transaction references.
    """
    print("[Seed] Initializing database schema...")
    db.create_all()

    now = datetime.now(timezone.utc)

    # 1. Primary Demo Client: Dr. Sarah Chen
    sarah = User.query.filter_by(email="sarah.chen@example.com").first()
    if not sarah:
        print("[Seed] Creating primary demo client (Dr. Sarah Chen)...")
        sarah = User(
            username="sarah.chen",
            email="sarah.chen@example.com",
            full_name="Dr. Sarah Chen",
            role="CLIENT",
        )
        sarah.set_password(_required_demo_password("DEMO_CLIENT_PASSWORD"))
        db.session.add(sarah)
        db.session.flush()
    else:
        print("[Seed] User Dr. Sarah Chen exists.")

    # Sarah's Checking Account
    sarah_checking = BankAccount.query.filter_by(account_number="SB-1002938471").first()
    if not sarah_checking:
        print("[Seed] Creating Checking Account for Dr. Sarah Chen...")
        sarah_checking = BankAccount(
            user_id=sarah.id,
            account_number="SB-1002938471",
            account_type="Checking",
            currency="USD",
            balance=Decimal("12450.50"),
            is_active=True,
        )
        db.session.add(sarah_checking)
        db.session.flush()

    # Sarah's Savings Account
    sarah_savings = BankAccount.query.filter_by(account_number="SB-2009841203").first()
    if not sarah_savings:
        print("[Seed] Creating High-Yield Savings Account for Dr. Sarah Chen...")
        sarah_savings = BankAccount(
            user_id=sarah.id,
            account_number="SB-2009841203",
            account_type="Savings",
            currency="USD",
            balance=Decimal("45800.00"),
            is_active=True,
        )
        db.session.add(sarah_savings)
        db.session.flush()

    # Sarah's Transactions
    sarah_txns_specs = [
        ("TXN-20250915-P88102", sarah_checking.id, "DEPOSIT", Decimal("6500.00"), "Employer Monthly Payroll Direct Deposit", 12),
        ("TXN-20250916-T40192", sarah_checking.id, "TRANSFER_OUT", Decimal("1500.00"), "Automated Recurring Transfer to High-Yield Savings", 11),
        ("TXN-20250916-T40193", sarah_savings.id, "TRANSFER_IN", Decimal("1500.00"), "Automated Recurring Transfer from Checking", 11),
        ("TXN-20250918-A77201", sarah_checking.id, "WITHDRAWAL", Decimal("185.40"), "Azure Cloud Infrastructure Services Subscription", 9),
        ("TXN-20250920-U31092", sarah_checking.id, "WITHDRAWAL", Decimal("74.25"), "Metropolitan Electric & Utility Bill", 7),
        ("TXN-20250923-C99812", sarah_checking.id, "WITHDRAWAL", Decimal("16.80"), "Artisan Coffee & Roastery", 4),
        ("TXN-20250925-I10049", sarah_savings.id, "DEPOSIT", Decimal("128.50"), "Monthly Accrued Interest Credit (4.5% APY)", 2),
    ]

    for ref, acc_id, txn_type, amt, desc, days_ago in sarah_txns_specs:
        if not Transaction.query.filter_by(reference_number=ref).first():
            txn = Transaction(
                account_id=acc_id,
                transaction_type=txn_type,
                amount=amt,
                description=desc,
                status="COMPLETED",
                reference_number=ref,
                created_at=now - timedelta(days=days_ago),
            )
            db.session.add(txn)

    # 2. Secondary Demo Client: Marcus Vance (for multi-tenancy isolation testing)
    marcus = User.query.filter_by(email="marcus.vance@example.com").first()
    if not marcus:
        print("[Seed] Creating secondary demo client (Marcus Vance)...")
        marcus = User(
            username="marcus.vance",
            email="marcus.vance@example.com",
            full_name="Marcus Vance",
            role="CLIENT",
        )
        marcus.set_password(_required_demo_password("DEMO_CLIENT_PASSWORD"))
        db.session.add(marcus)
        db.session.flush()
    else:
        print("[Seed] User Marcus Vance exists.")

    marcus_checking = BankAccount.query.filter_by(account_number="SB-1008392019").first()
    if not marcus_checking:
        print("[Seed] Creating Checking Account for Marcus Vance...")
        marcus_checking = BankAccount(
            user_id=marcus.id,
            account_number="SB-1008392019",
            account_type="Checking",
            currency="USD",
            balance=Decimal("5230.15"),
            is_active=True,
        )
        db.session.add(marcus_checking)
        db.session.flush()

    marcus_txns_specs = [
        ("TXN-20250912-M11094", marcus_checking.id, "DEPOSIT", Decimal("4200.00"), "Consulting Services Monthly Retainer", 15),
        ("TXN-20250918-G20914", marcus_checking.id, "WITHDRAWAL", Decimal("142.60"), "Whole Foods Organic Market", 9),
    ]

    for ref, acc_id, txn_type, amt, desc, days_ago in marcus_txns_specs:
        if not Transaction.query.filter_by(reference_number=ref).first():
            txn = Transaction(
                account_id=acc_id,
                transaction_type=txn_type,
                amount=amt,
                description=desc,
                status="COMPLETED",
                reference_number=ref,
                created_at=now - timedelta(days=days_ago),
            )
            db.session.add(txn)

    # 3. Compliance Auditor Account
    auditor = User.query.filter_by(email="auditor@securebank.internal").first()
    if not auditor:
        print("[Seed] Creating compliance & security auditor account...")
        auditor = User(
            username="auditor",
            email="auditor@securebank.internal",
            full_name="Chief Compliance Auditor",
            role="AUDITOR",
        )
        auditor.set_password(_required_demo_password("DEMO_AUDITOR_PASSWORD"))
        db.session.add(auditor)
    else:
        print("[Seed] User Chief Compliance Auditor exists.")

    db.session.commit()
    print("[Seed] Demo database seeding completed successfully!")
