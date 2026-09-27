from decimal import Decimal
from app.models.user import User
from app.models.account import BankAccount
from app.models.transaction import Transaction


def test_user_password_hashing():
    """Verify passwords are salted and hashed, never stored plaintext."""
    user = User(username="charlie", email="charlie@test.com", full_name="Charlie")
    user.set_password("SecurePassword2025!")

    assert user.password_hash != "SecurePassword2025!"
    assert user.password_hash.startswith("pbkdf2:sha256")
    assert user.check_password("SecurePassword2025!") is True
    assert user.check_password("WrongPassword") is False


def test_bank_account_masking():
    """Verify bank account masking hides leading digits for privacy."""
    acc = BankAccount(
        user_id=1,
        account_number="SB-1002938471",
        account_type="Checking",
        balance=Decimal("1234.56"),
    )
    assert acc.masked_account_number == "SB-****-****-8471"
    dict_repr = acc.to_dict(mask=True)
    assert dict_repr["account_number"] == "SB-****-****-8471"
    assert dict_repr["balance"] == "1234.56"


def test_transaction_reference_generation():
    """Verify unique reference formatting on transactions."""
    ref1 = Transaction.generate_reference()
    ref2 = Transaction.generate_reference()

    assert ref1.startswith("TXN-")
    assert ref2.startswith("TXN-")
    assert ref1 != ref2
