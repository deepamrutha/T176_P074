import pytest
from decimal import Decimal
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.account import BankAccount
from app.models.transaction import Transaction


@pytest.fixture(scope="session")
def app():
    """Create and configure a testing Flask application with an in-memory SQLite database."""
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Test client for issuing requests."""
    return app.test_client()


@pytest.fixture(scope="function")
def init_database(app):
    """Provides a fresh database state for each test function."""
    with app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()

        # Seed standard test users
        user_a = User(
            username="alice",
            email="alice@test.com",
            full_name="Alice Test",
            role="CLIENT",
        )
        user_a.set_password("Password123!")

        user_b = User(
            username="bob",
            email="bob@test.com",
            full_name="Bob Test",
            role="CLIENT",
        )
        user_b.set_password("Password123!")

        db.session.add(user_a)
        db.session.add(user_b)
        db.session.flush()

        # Alice's accounts
        acc_a_checking = BankAccount(
            user_id=user_a.id,
            account_number="SB-1011111111",
            account_type="Checking",
            currency="USD",
            balance=Decimal("1500.00"),
            is_active=True,
        )
        acc_a_savings = BankAccount(
            user_id=user_a.id,
            account_number="SB-2011111111",
            account_type="Savings",
            currency="USD",
            balance=Decimal("5000.00"),
            is_active=True,
        )

        # Bob's account
        acc_b_checking = BankAccount(
            user_id=user_b.id,
            account_number="SB-1022222222",
            account_type="Checking",
            currency="USD",
            balance=Decimal("800.00"),
            is_active=True,
        )

        db.session.add_all([acc_a_checking, acc_a_savings, acc_b_checking])
        db.session.flush()

        # Alice's initial transaction
        txn = Transaction(
            account_id=acc_a_checking.id,
            transaction_type="DEPOSIT",
            amount=Decimal("1500.00"),
            description="Initial Test Deposit",
            status="COMPLETED",
            reference_number=Transaction.generate_reference(),
        )
        db.session.add(txn)
        db.session.commit()

        yield {
            "user_a": user_a,
            "user_b": user_b,
            "acc_a_checking": acc_a_checking,
            "acc_a_savings": acc_a_savings,
            "acc_b_checking": acc_b_checking,
        }

        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def alice_auth_headers(client, init_database):
    """Logs in as Alice and returns authorization headers."""
    resp = client.post("/api/auth/login", json={
        "identifier": "alice@test.com",
        "password": "Password123!"
    })
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def bob_auth_headers(client, init_database):
    """Logs in as Bob and returns authorization headers."""
    resp = client.post("/api/auth/login", json={
        "identifier": "bob@test.com",
        "password": "Password123!"
    })
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
