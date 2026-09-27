import re
import random
from decimal import Decimal
from typing import Optional, Tuple
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.user import User
from app.models.account import BankAccount
from app.models.transaction import Transaction

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_\.-]{3,32}$")


class AuthService:
    """Service handling authentication, password hashing, and user registration."""

    @classmethod
    def register_user(
        cls, username: str, email: str, password: str, full_name: str, role: str = "CLIENT"
    ) -> Tuple[User, str]:
        """Registers a new user and automatically establishes an initial checking account."""
        username = (username or "").strip().lower()
        email = (email or "").strip().lower()
        full_name = (full_name or "").strip()

        if not USERNAME_REGEX.match(username):
            raise ValueError("Username must be between 3 and 32 characters (letters, numbers, underscores).")

        if not EMAIL_REGEX.match(email):
            raise ValueError("Please provide a valid email address.")

        if not full_name or len(full_name) < 2:
            raise ValueError("Full name must be at least 2 characters.")

        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")

        # Check uniqueness
        if User.query.filter((User.username == username) | (User.email == email)).first():
            raise ValueError("An account with that username or email address already exists.")

        user = User(
            username=username,
            email=email,
            full_name=full_name,
            role=role if role in ("CLIENT", "AUDITOR", "ADMIN") else "CLIENT",
        )
        user.set_password(password)

        db.session.add(user)
        db.session.flush()  # Obtain user.id

        # Provision default primary Checking Account
        random_digits = "".join(random.choices("0123456789", k=8))
        account_number = f"SB-10{random_digits}"
        initial_balance = Decimal("1000.00")

        account = BankAccount(
            user_id=user.id,
            account_number=account_number,
            account_type="Checking",
            currency="USD",
            balance=initial_balance,
            is_active=True,
        )
        db.session.add(account)
        db.session.flush()

        # Record welcome deposit
        welcome_txn = Transaction(
            account_id=account.id,
            transaction_type="DEPOSIT",
            amount=initial_balance,
            description="Welcome Bonus Deposit (Simulated)",
            status="COMPLETED",
            reference_number=Transaction.generate_reference(),
        )
        db.session.add(welcome_txn)
        db.session.commit()

        token = create_access_token(identity=str(user.id))
        return user, token

    @classmethod
    def authenticate_user(cls, login_identifier: str, password: str) -> Tuple[User, str]:
        """Authenticates user via email or username and issues JWT access token."""
        identifier = (login_identifier or "").strip().lower()
        if not identifier or not password:
            raise ValueError("Email/username and password are required.")

        user = User.query.filter(
            (User.email == identifier) | (User.username == identifier)
        ).first()

        if not user or not user.check_password(password):
            raise ValueError("Invalid email/username or password.")

        token = create_access_token(identity=str(user.id))
        return user, token
