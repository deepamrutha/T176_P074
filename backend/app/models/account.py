from datetime import datetime, timezone
from decimal import Decimal
from app.extensions import db


class BankAccount(db.Model):
    """Bank account belonging to an authenticated user with strict decimal precision."""
    __tablename__ = "bank_accounts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_number = db.Column(db.String(32), unique=True, nullable=False, index=True)
    account_type = db.Column(db.String(32), nullable=False, default="Checking")  # Checking, Savings, Investment
    currency = db.Column(db.String(3), nullable=False, default="USD")
    balance = db.Column(db.Numeric(precision=14, scale=2), nullable=False, default=Decimal("0.00"))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = db.relationship("User", back_populates="accounts")
    transactions = db.relationship("Transaction", back_populates="account", cascade="all, delete-orphan", lazy="select", order_by="desc(Transaction.created_at)")

    @property
    def masked_account_number(self) -> str:
        """Returns masked account number displaying only the last 4 digits for privacy."""
        if not self.account_number:
            return "SB-****-****"
        digits = self.account_number.replace("-", "").replace(" ", "")
        last4 = digits[-4:] if len(digits) >= 4 else digits
        return f"SB-****-****-{last4}"

    def to_dict(self, mask: bool = True) -> dict:
        """Serializes bank account attributes safely."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "account_number": self.masked_account_number if mask else self.account_number,
            "raw_account_number": self.account_number,
            "account_type": self.account_type,
            "currency": self.currency,
            "balance": f"{Decimal(self.balance):.2f}",
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<BankAccount {self.account_number} ({self.account_type}): {self.balance}>"
