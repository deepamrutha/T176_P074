from datetime import datetime, timezone
from decimal import Decimal
import uuid
from app.extensions import db


class Transaction(db.Model):
    """Simulated banking transaction record with strict decimal precision."""
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = db.Column(db.String(32), nullable=False)  # DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT
    amount = db.Column(db.Numeric(precision=14, scale=2), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(32), nullable=False, default="COMPLETED")  # COMPLETED, PENDING, FAILED
    reference_number = db.Column(db.String(64), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    account = db.relationship("BankAccount", back_populates="transactions")

    @classmethod
    def generate_reference(cls) -> str:
        """Generates a standard banking reference code."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
        short_id = uuid.uuid4().hex[:6].upper()
        return f"TXN-{timestamp}-{short_id}"

    def to_dict(self) -> dict:
        """Serializes transaction details."""
        return {
            "id": self.id,
            "account_id": self.account_id,
            "transaction_type": self.transaction_type,
            "amount": f"{Decimal(self.amount):.2f}",
            "description": self.description,
            "status": self.status,
            "reference_number": self.reference_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<Transaction {self.reference_number}: {self.transaction_type} {self.amount}>"
