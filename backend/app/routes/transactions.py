from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.account import BankAccount
from app.models.transaction import Transaction
from app.services.banking_service import BankingService

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


@transactions_bp.route("", methods=["GET"])
@jwt_required()
def list_transactions():
    """Retrieve transaction history belonging strictly to authenticated user's accounts."""
    user_id = int(get_jwt_identity())

    # Get all account IDs owned by user
    user_account_ids = [acc.id for acc in BankAccount.query.filter_by(user_id=user_id).all()]
    if not user_account_ids:
        return jsonify({"transactions": [], "total": 0}), 200

    query = Transaction.query.filter(Transaction.account_id.in_(user_account_ids))

    # Optional account_id filter
    filter_account_id = request.args.get("account_id", type=int)
    if filter_account_id:
        if filter_account_id not in user_account_ids:
            return jsonify({"error": "Unauthorized access to specified account."}), 403
        query = query.filter(Transaction.account_id == filter_account_id)

    # Optional type filter
    filter_type = request.args.get("type")
    if filter_type:
        query = query.filter(Transaction.transaction_type == filter_type.upper())

    # Order and limit
    limit = min(request.args.get("limit", default=50, type=int), 100)
    transactions = query.order_by(Transaction.created_at.desc()).limit(limit).all()

    return jsonify({
        "transactions": [txn.to_dict() for txn in transactions],
        "total": len(transactions),
        "disclaimer": "All transactions are simulated for the Azure Confidential Compute design demonstration.",
    }), 200


@transactions_bp.route("", methods=["POST"])
@jwt_required()
def create_transaction():
    """
    Execute a simulated banking transaction (deposit, withdrawal, or internal transfer).
    Strictly verifies account ownership and rejects real banking or payment integrations.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    action = (data.get("action") or "").lower()
    source_account_id = data.get("account_id")
    target_account_id = data.get("target_account_id")
    amount = data.get("amount")
    description = (data.get("description") or "").strip()

    if not source_account_id:
        return jsonify({"error": "account_id is required."}), 400

    # Ensure source account belongs to the authenticated user
    source_account = db.session.get(BankAccount, source_account_id)
    if not source_account or source_account.user_id != user_id:
        return jsonify({"error": "Account not found or access denied."}), 404

    try:
        if action == "deposit":
            desc = description or "Simulated Mobile Check / Cash Deposit"
            txn = BankingService.execute_deposit(source_account, amount, desc)
            return jsonify({
                "message": "Deposit processed successfully (simulated).",
                "is_simulated": True,
                "transaction": txn.to_dict(),
                "updated_balance": f"{source_account.balance:.2f}",
            }), 201

        elif action == "withdrawal":
            desc = description or "Simulated ATM / Wire Withdrawal"
            txn = BankingService.execute_withdrawal(source_account, amount, desc)
            return jsonify({
                "message": "Withdrawal processed successfully (simulated).",
                "is_simulated": True,
                "transaction": txn.to_dict(),
                "updated_balance": f"{source_account.balance:.2f}",
            }), 201

        elif action == "transfer":
            if not target_account_id:
                return jsonify({"error": "target_account_id is required for transfers."}), 400

            target_account = db.session.get(BankAccount, target_account_id)
            if not target_account or target_account.user_id != user_id:
                return jsonify({"error": "Destination account not found or access denied."}), 404

            desc = description or f"Transfer to {target_account.masked_account_number}"
            txn_out, txn_in = BankingService.execute_transfer(
                source_account, target_account, amount, desc
            )
            return jsonify({
                "message": "Transfer completed successfully (simulated).",
                "is_simulated": True,
                "transaction_out": txn_out.to_dict(),
                "transaction_in": txn_in.to_dict(),
                "updated_source_balance": f"{source_account.balance:.2f}",
            }), 201

        else:
            return jsonify({
                "error": f"Invalid action '{action}'. Supported actions are 'deposit', 'withdrawal', or 'transfer'."
            }), 400

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Transaction execution failed."}), 500
