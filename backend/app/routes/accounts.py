import random
from decimal import Decimal, InvalidOperation
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.account import BankAccount
from app.models.transaction import Transaction
from app.services.banking_service import BankingService

accounts_bp = Blueprint("accounts", __name__, url_prefix="/api/accounts")


@accounts_bp.route("", methods=["GET"])
@jwt_required()
def list_accounts():
    """List all accounts belonging strictly to the authenticated user."""
    user_id = int(get_jwt_identity())
    accounts = BankAccount.query.filter_by(user_id=user_id).order_by(BankAccount.id.asc()).all()

    total_balance = sum(Decimal(acc.balance) for acc in accounts)

    return jsonify({
        "accounts": [acc.to_dict(mask=True) for acc in accounts],
        "summary": {
            "total_accounts": len(accounts),
            "total_balance": f"{total_balance:.2f}",
            "currency": "USD",
        },
    }), 200


@accounts_bp.route("/<int:account_id>", methods=["GET"])
@jwt_required()
def get_account(account_id):
    """Retrieve specific account details, strictly enforcing ownership."""
    user_id = int(get_jwt_identity())
    account = db.session.get(BankAccount, account_id)

    if not account:
        return jsonify({"error": "Account not found."}), 404

    # Strict multi-tenancy access control
    if account.user_id != user_id:
        return jsonify({"error": "Access forbidden: you do not have permission to view this account."}), 403

    return jsonify({
        "account": account.to_dict(mask=False),
        "recent_transactions": [txn.to_dict() for txn in account.transactions[:10]],
    }), 200


@accounts_bp.route("", methods=["POST"])
@jwt_required()
def create_account():
    """Create a new secondary account (e.g., Savings or Investment) for authenticated user."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    account_type = data.get("account_type", "Savings")
    initial_deposit = data.get("initial_deposit", 0.00)

    if account_type not in ("Checking", "Savings", "Investment"):
        return jsonify({"error": "Invalid account type. Choose Checking, Savings, or Investment."}), 400

    random_suffix = "".join(random.choices("0123456789", k=8))
    account_number = f"SB-20{random_suffix}"

    try:
        initial_value = Decimal(str(initial_deposit).strip())
        if not initial_value.is_finite() or initial_value < Decimal("0.00"):
            raise ValueError("Initial deposit must be a finite, non-negative amount.")
        deposit_val = (
            Decimal("0.00")
            if initial_value == Decimal("0.00")
            else BankingService.parse_amount(initial_deposit)
        )
    except InvalidOperation:
        return jsonify({"error": "Invalid initial deposit amount."}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    new_account = BankAccount(
        user_id=user_id,
        account_number=account_number,
        account_type=account_type,
        currency="USD",
        balance=deposit_val,
        is_active=True,
    )
    try:
        db.session.add(new_account)
        db.session.flush()

        if deposit_val > Decimal("0.00"):
            init_txn = Transaction(
                account_id=new_account.id,
                transaction_type="DEPOSIT",
                amount=deposit_val,
                description="Initial Account Opening Deposit (Simulated)",
                status="COMPLETED",
                reference_number=Transaction.generate_reference(),
            )
            db.session.add(init_txn)

        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Account creation failed."}), 500

    return jsonify({
        "message": f"{account_type} account created successfully.",
        "account": new_account.to_dict(mask=True),
    }), 201
