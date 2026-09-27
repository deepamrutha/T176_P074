from app.models.transaction import Transaction


def test_unauthenticated_requests_rejected(client, init_database):
    """Test that protected endpoints reject requests without a JWT token."""
    assert client.get("/api/accounts").status_code == 401
    assert client.get("/api/transactions").status_code == 401
    assert client.post("/api/transactions", json={}).status_code == 401


def test_user_can_only_see_own_accounts(client, init_database, alice_auth_headers, bob_auth_headers):
    """Test that Alice only sees Alice's accounts and Bob only sees Bob's accounts."""
    # Alice requests her accounts
    resp_alice = client.get("/api/accounts", headers=alice_auth_headers)
    assert resp_alice.status_code == 200
    alice_accounts = resp_alice.get_json()["accounts"]
    assert len(alice_accounts) == 2  # Checking and Savings
    for acc in alice_accounts:
        assert acc["user_id"] == init_database["user_a"].id

    # Bob requests his accounts
    resp_bob = client.get("/api/accounts", headers=bob_auth_headers)
    assert resp_bob.status_code == 200
    bob_accounts = resp_bob.get_json()["accounts"]
    assert len(bob_accounts) == 1
    assert bob_accounts[0]["user_id"] == init_database["user_b"].id


def test_cross_tenant_account_access_forbidden(client, init_database, alice_auth_headers):
    """Test that Alice cannot retrieve Bob's account details by ID."""
    bob_acc_id = init_database["acc_b_checking"].id

    # Alice attempts to access Bob's account
    response = client.get(f"/api/accounts/{bob_acc_id}", headers=alice_auth_headers)
    assert response.status_code == 403
    assert "Access forbidden" in response.get_json()["error"]


def test_cross_tenant_transaction_access_forbidden(client, init_database, alice_auth_headers):
    """Test that Alice cannot view transactions for Bob's account."""
    bob_acc_id = init_database["acc_b_checking"].id

    response = client.get(f"/api/transactions?account_id={bob_acc_id}", headers=alice_auth_headers)
    assert response.status_code == 403


def test_cross_tenant_transfer_manipulation_blocked(client, init_database, alice_auth_headers):
    """Test that Alice cannot withdraw from Bob's account even if she knows the ID."""
    bob_acc_id = init_database["acc_b_checking"].id

    response = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "withdrawal",
        "account_id": bob_acc_id,
        "amount": 50.00,
        "description": "Unauthorized withdrawal attempt"
    })
    assert response.status_code == 404
    assert "Access denied" in response.get_json()["error"] or "not found" in response.get_json()["error"].lower()


def test_cross_tenant_transfer_destination_blocked(client, init_database, alice_auth_headers, app):
    """A client cannot transfer their funds into another user's account."""
    source = init_database["acc_a_checking"]
    destination = init_database["acc_b_checking"]
    source_balance = source.balance
    destination_balance = destination.balance
    transaction_count = Transaction.query.count()

    response = client.post("/api/transactions", headers=alice_auth_headers, json={
        "action": "transfer",
        "account_id": source.id,
        "target_account_id": destination.id,
        "amount": "50.00",
        "description": "Cross-tenant transfer attempt",
    })

    assert response.status_code == 404
    assert source.balance == source_balance
    assert destination.balance == destination_balance
    assert Transaction.query.count() == transaction_count
