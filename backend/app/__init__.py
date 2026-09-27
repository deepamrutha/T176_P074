import os
import logging
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, jwt, cors
from app.routes import auth_bp, accounts_bp, transactions_bp, security_bp


def create_app(config_name=None) -> Flask:
    """Application factory for SecureBank backend."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development").lower()

    if config_name == "production":
        required_secrets = ("SECRET_KEY", "JWT_SECRET_KEY")
        missing_or_weak = [
            name for name in required_secrets
            if len(os.getenv(name, "")) < 32
        ]
        if missing_or_weak:
            raise RuntimeError(
                "Production requires SECRET_KEY and JWT_SECRET_KEY values of at least 32 characters."
            )

    app = Flask(__name__)
    config_class = config_by_name.get(config_name, config_by_name["development"])
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO if not app.config.get("DEBUG") else logging.DEBUG,
        format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
    )

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # CORS configuration
    cors.init_app(
        app,
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173"]),
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Register API blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(accounts_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(security_bp)

    @app.route("/", methods=["GET"])
    def api_root():
        return jsonify({
            "service": "SecureBank REST API Server",
            "status": "online",
            "web_frontend": "http://localhost:5173",
            "message": "This is the backend REST API server. For the banking web UI, visit http://localhost:5173",
            "endpoints": {
                "health": "/api/health",
                "security_study": "/api/security",
                "auth_login": "/api/auth/login",
                "accounts": "/api/accounts",
                "transactions": "/api/transactions",
            }
        }), 200

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({
            "error": "Missing or invalid authorization token. Please log in.",
            "code": "AUTHORIZATION_REQUIRED"
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "Session token has expired. Please log in again.",
            "code": "TOKEN_EXPIRED"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({
            "error": "Token signature or structure is invalid.",
            "code": "INVALID_TOKEN"
        }), 401

    # Safe table creation
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("Database schema validated and initialized.")
        except Exception:
            app.logger.warning(
                "Database initialization failed. Ensure PostgreSQL is available "
                "and DATABASE_URL is configured."
            )

    return app
