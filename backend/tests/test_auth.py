def test_register_success(client, init_database):
    """Test successful user registration creates user and initial checking account."""
    response = client.post("/api/auth/register", json={
        "username": "newclient",
        "email": "newclient@example.com",
        "password": "ValidPassword2025!",
        "full_name": "New Client User"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "access_token" in data
    assert data["user"]["username"] == "newclient"
    assert data["user"]["email"] == "newclient@example.com"
    assert "password_hash" not in data["user"]


def test_register_duplicate_email(client, init_database):
    """Test registering with an existing email returns 400 error."""
    response = client.post("/api/auth/register", json={
        "username": "unique_username",
        "email": "alice@test.com",  # Already in DB
        "password": "ValidPassword2025!",
        "full_name": "Alice Duplicate"
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "already exists" in data["error"]


def test_register_invalid_password(client, init_database):
    """Test registration rejects passwords under 8 characters."""
    response = client.post("/api/auth/register", json={
        "username": "shortpassuser",
        "email": "shortpass@example.com",
        "password": "short",
        "full_name": "Short Pass User"
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "at least 8 characters" in data["error"]


def test_login_success(client, init_database):
    """Test login with valid email and password."""
    response = client.post("/api/auth/login", json={
        "identifier": "alice@test.com",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@test.com"


def test_login_invalid_password(client, init_database):
    """Test login with incorrect password returns 401."""
    response = client.post("/api/auth/login", json={
        "identifier": "alice@test.com",
        "password": "WrongPassword999!"
    })
    assert response.status_code == 401
    data = response.get_json()
    assert "Invalid email/username or password" in data["error"]


def test_login_nonexistent_user(client, init_database):
    """Test login with non-existent user returns 401."""
    response = client.post("/api/auth/login", json={
        "identifier": "nonexistent@test.com",
        "password": "Password123!"
    })
    assert response.status_code == 401


def test_get_current_user_profile(client, init_database, alice_auth_headers):
    """Test /api/auth/me returns current user profile when authenticated."""
    response = client.get("/api/auth/me", headers=alice_auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["email"] == "alice@test.com"
    assert data["user"]["username"] == "alice"


def test_get_current_user_unauthorized(client, init_database):
    """Test /api/auth/me returns 401 without JWT token."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
