from decimal import Decimal, InvalidOperation
from typing import Tuple
from sqlalchemy import select
from app.extensions import db
from app.models.account import BankAccount
from app.models.transaction import Transaction


class BankingService:
    """Service implementing financial transactions with strict Decimal precision and atomicity."""

    @staticmethod
    def _lock_account(account_id: int) -> BankAccount:
        statement = (
            select(BankAccount)
            .where(BankAccount.id == account_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        account = db.session.execute(statement).scalar_one_or_none()
        if account is None:
            raise ValueError("Account not found.")
        return account

    @staticmethod
    def parse_amount(raw_amount) -> Decimal:
        """Parses and validates a monetary amount into a two-decimal-place Decimal."""
        try:
            val = Decimal(str(raw_amount).strip())
        except (InvalidOperation, ValueError, TypeError):
            raise ValueError("Invalid amount format. Must be a valid positive number.")

        if not val.is_finite():
            raise ValueError("Invalid amount format. Must be a finite number.")
        if val <= Decimal("0.00"):
            raise ValueError("Transaction amount must be strictly greater than zero.")

        try:
            quantized = val.quantize(Decimal("0.01"))
        except InvalidOperation:
            raise ValueError("Transaction amount exceeds the supported precision.")

        if quantized != val:
            raise ValueError("Transaction amount cannot include fractions of a cent.")
        if quantized > Decimal("999999999999.99"):
            raise ValueError("Transaction amount exceeds the supported maximum.")
        return quantized

    @classmethod
    def execute_deposit(
        cls, account: BankAccount, raw_amount, description: str = "Deposit"
    ) -> Transaction:
        """Executes a simulated cash or wire deposit into an account."""
        try:
            account = cls._lock_account(account.id)
            if not account.is_active:
                raise ValueError("Target account is inactive or frozen.")

            amount = cls.parse_amount(raw_amount)
            account.balance = Decimal(account.balance) + amount

            txn = Transaction(
                account_id=account.id,
                transaction_type="DEPOSIT",
                amount=amount,
                description=description or "Simulated Account Deposit",
                status="COMPLETED",
                reference_number=Transaction.generate_reference(),
            )
            db.session.add(txn)
            db.session.commit()
            return txn
        except Exception:
            db.session.rollback()
            raise

    @classmethod
    def execute_withdrawal(
        cls, account: BankAccount, raw_amount, description: str = "Withdrawal"
    ) -> Transaction:
        """Executes a simulated withdrawal with overdraft protection."""
        try:
            account = cls._lock_account(account.id)
            if not account.is_active:
                raise ValueError("Target account is inactive or frozen.")

            amount = cls.parse_amount(raw_amount)
            if Decimal(account.balance) < amount:
                raise ValueError(
                    f"Insufficient funds. Available balance is ${Decimal(account.balance):.2f}, "
                    f"requested ${amount:.2f}."
                )

            account.balance = Decimal(account.balance) - amount
            txn = Transaction(
                account_id=account.id,
                transaction_type="WITHDRAWAL",
                amount=amount,
                description=description or "Simulated Account Withdrawal",
                status="COMPLETED",
                reference_number=Transaction.generate_reference(),
            )
            db.session.add(txn)
            db.session.commit()
            return txn
        except Exception:
            db.session.rollback()
            raise

    @classmethod
    def execute_transfer(
        cls,
        source_account: BankAccount,
        target_account: BankAccount,
        raw_amount,
        description: str = "Account Transfer",
    ) -> Tuple[Transaction, Transaction]:
        """
        Executes an atomic transfer between two accounts.
        Creates paired TRANSFER_OUT and TRANSFER_IN records.
        """
        source_account_id = source_account.id
        target_account_id = target_account.id
        if source_account_id == target_account_id:
            raise ValueError("Source and destination accounts cannot be identical.")

        try:
            statement = (
                select(BankAccount)
                .where(BankAccount.id.in_((source_account_id, target_account_id)))
                .order_by(BankAccount.id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
            locked_accounts = {
                account.id: account for account in db.session.execute(statement).scalars()
            }
            if len(locked_accounts) != 2:
                raise ValueError("Source or destination account not found.")
            source_account = locked_accounts[source_account_id]
            target_account = locked_accounts[target_account_id]

            if not source_account.is_active:
                raise ValueError("Source account is inactive or frozen.")
            if not target_account.is_active:
                raise ValueError("Target account is inactive or frozen.")

            amount = cls.parse_amount(raw_amount)
            if Decimal(source_account.balance) < amount:
                raise ValueError(
                    f"Insufficient funds in source account. Available: ${Decimal(source_account.balance):.2f}, "
                    f"required: ${amount:.2f}."
                )

            # Debit source
            source_account.balance = Decimal(source_account.balance) - amount
            ref_out = Transaction.generate_reference()
            txn_out = Transaction(
                account_id=source_account.id,
                transaction_type="TRANSFER_OUT",
                amount=amount,
                description=f"Transfer to {target_account.masked_account_number}: {description}",
                status="COMPLETED",
                reference_number=ref_out,
            )

            # Credit destination
            target_account.balance = Decimal(target_account.balance) + amount
            ref_in = Transaction.generate_reference()
            txn_in = Transaction(
                account_id=target_account.id,
                transaction_type="TRANSFER_IN",
                amount=amount,
                description=f"Transfer from {source_account.masked_account_number}: {description}",
                status="COMPLETED",
                reference_number=ref_in,
            )

            db.session.add(txn_out)
            db.session.add(txn_in)
            db.session.commit()
            return txn_out, txn_in

        except Exception as e:
            db.session.rollback()
            raise e
