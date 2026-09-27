import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env if it exists
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class BaseConfig:
    """Base application configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "securebank-dev-secret-key-change-in-prod-xyz8923")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "securebank-jwt-dev-secret-key-change-in-prod-98314")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 24))
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Server Bindings
    BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
    BACKEND_PORT = int(os.getenv("BACKEND_PORT", 5001))

    # CORS
    raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

    # Compute & Attestation Environment
    COMPUTE_ENVIRONMENT = os.getenv("COMPUTE_ENVIRONMENT", "LOCAL_UNVERIFIED")

    @classmethod
    def get_database_uri(cls):
        """Use PostgreSQL for the application; tests select SQLite explicitly."""
        raw_db_url = os.getenv("DATABASE_URL")

        if not raw_db_url or "your_postgres_password_here" in raw_db_url:
            return "postgresql+psycopg://postgres@localhost:5432/securebank"

        # Ensure Psycopg 3 driver prefix
        db_url = raw_db_url
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

        if not db_url.startswith("postgresql+psycopg://"):
            raise ValueError("DATABASE_URL must use PostgreSQL with the Psycopg 3 driver.")

        return db_url


class DevelopmentConfig(BaseConfig):
    """Development configuration."""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = BaseConfig.get_database_uri()


class TestingConfig(BaseConfig):
    """Testing configuration."""
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    SECRET_KEY = "test-secret-key-at-least-32-bytes-long-for-hmac-sha256-compliance-12345"
    JWT_SECRET_KEY = "test-jwt-secret-key-at-least-32-bytes-long-for-hmac-sha256-compliance-67890"


class ProductionConfig(BaseConfig):
    """Production configuration for Azure deployment."""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = BaseConfig.get_database_uri()


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
