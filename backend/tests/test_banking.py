from decimal import Decimal
from app.models.transaction import Transaction


def test_list_transactions(client, init_database, alice_auth_headers):
    """Test retrieving transactions for authenticated user."""
    response = client.get("/api/transactions", headers=alice_auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "transactions" in data
    assert len(data["transactions"]) >= 1
    assert data["transactions"][0]["transaction_type"] == "DEPOSIT"
    assert "disclaimer" in data


def test_simulated_deposit(client, init_database, alice_auth_headers):
    """Test simulated deposit increases account balance."""
    acc_id = init_database["acc_a_checking"].id

    response = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "deposit",
        "account_id": acc_id,
        "amount": "250.75",
        "description": "Simulated Payroll Bonus"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["is_simulated"] is True
    # 1500.00 + 250.75 = 1750.75
    assert data["updated_balance"] == "1750.75"


def test_simulated_withdrawal_success(client, init_database, alice_auth_headers):
    """Test simulated withdrawal with sufficient funds."""
    acc_id = init_database["acc_a_checking"].id

    response = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "withdrawal",
        "account_id": acc_id,
        "amount": "300.00",
        "description": "Simulated Cash Withdrawal"
    })
    assert response.status_code == 201
    data = response.get_json()
    # 1500.00 - 300.00 = 1200.00
    assert data["updated_balance"] == "1200.00"


def test_simulated_withdrawal_overdraft_prevention(client, init_database, alice_auth_headers):
    """Test that withdrawal exceeding available balance is strictly rejected."""
    acc_id = init_database["acc_a_checking"].id

    response = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "withdrawal",
        "account_id": acc_id,
        "amount": "99999.00",  # Far exceeds 1500.00
        "description": "Excessive withdrawal"
    })
    assert response.status_code == 400
    assert "Insufficient funds" in response.get_json()["error"]


def test_simulated_internal_transfer(client, init_database, alice_auth_headers):
    """Test atomic transfer between two of Alice's accounts."""
    src_id = init_database["acc_a_checking"].id
    tgt_id = init_database["acc_a_savings"].id

    response = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "transfer",
        "account_id": src_id,
        "target_account_id": tgt_id,
        "amount": "400.00",
        "description": "Monthly Savings Allocation"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["is_simulated"] is True
    # Source checking: 1500.00 - 400.00 = 1100.00
    assert data["updated_source_balance"] == "1100.00"

    # Verify target savings updated: 5000.00 + 400.00 = 5400.00
    acc_resp = client.get(f"/api/accounts/{tgt_id}", headers=alice_auth_headers)
    assert acc_resp.get_json()["account"]["balance"] == "5400.00"


def test_insufficient_transfer_is_rejected_without_ledger_changes(client, init_database, alice_auth_headers):
    """Insufficient funds cannot partially update either account or the ledger."""
    source = init_database["acc_a_checking"]
    target = init_database["acc_a_savings"]
    transaction_count = Transaction.query.count()

    response = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "transfer",
        "account_id": source.id,
        "target_account_id": target.id,
        "amount": "2000.00",
    })

    assert response.status_code == 400
    assert "Insufficient funds" in response.get_json()["error"]
    assert source.balance == Decimal("1500.00")
    assert target.balance == Decimal("5000.00")
    assert Transaction.query.count() == transaction_count


def test_invalid_negative_or_zero_amount(client, init_database, alice_auth_headers):
    """Test that zero or negative transaction amounts are rejected."""
    acc_id = init_database["acc_a_checking"].id

    for invalid_amt in ["0.00", "-50.00", "0"]:
        response = client.post("/api/transactions", headers=alice_auth_headers, json={
            "action": "deposit",
            "account_id": acc_id,
            "amount": invalid_amt,
            "description": "Invalid test"
        })
        assert response.status_code == 400
        assert "greater than zero" in response.get_json()["error"]


def test_subcent_and_nonfinite_amounts_are_rejected(client, init_database, alice_auth_headers):
    """Reject amounts that would round or cannot be represented as money."""
    acc_id = init_database["acc_a_checking"].id

    for invalid_amt in ["1.239", "NaN", "Infinity"]:
        response = client.post("/api/transactions", headers=alice_auth_headers, json={
            "action": "deposit",
            "account_id": acc_id,
            "amount": invalid_amt,
        })
        assert response.status_code == 400

    assert init_database["acc_a_checking"].balance == Decimal("1500.00")


def test_account_opening_deposit_preserves_decimal_amount(client, init_database, alice_auth_headers):
    response = client.post("/api/accounts", headers=alice_auth_headers, json={
        "account_type": "Savings",
        "initial_deposit": "0.30",
    })

    assert response.status_code == 201
    assert response.get_json()["account"]["balance"] == "0.30"


def test_account_opening_rejects_invalid_deposit(client, init_database, alice_auth_headers):
    for amount in ["NaN", "-1.00", "1.239"]:
        response = client.post("/api/accounts", headers=alice_auth_headers, json={
            "account_type": "Savings",
            "initial_deposit": amount,
        })
        assert response.status_code == 400


def test_decimal_precision_preservation(client, init_database, alice_auth_headers):
    """Test that financial decimal calculations do not suffer binary floating point distortion."""
    acc_id = init_database["acc_a_checking"].id

    # 1500.00 + 0.10 + 0.20 must equal exactly 1500.30 (not 1500.3000000000002)
    client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "deposit",
        "account_id": acc_id,
        "amount": "0.10",
        "description": "Decimal precision test part 1"
    })
    resp = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "deposit",
        "account_id": acc_id,
        "amount": "0.20",
        "description": "Decimal precision test part 2"
    })
    assert resp.status_code == 201
    assert resp.get_json()["updated_balance"] == "1500.30"
