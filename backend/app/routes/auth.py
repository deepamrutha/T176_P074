from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.services.auth_service import AuthService
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user and return JWT access token."""
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")

    try:
        user, token = AuthService.register_user(
            username=username, email=email, password=password, full_name=full_name
        )
        return jsonify({
            "message": "User registered successfully.",
            "access_token": token,
            "user": user.to_dict(),
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred during registration."}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user with email or username and return JWT access token."""
    data = request.get_json() or {}
    identifier = data.get("identifier") or data.get("email") or data.get("username")
    password = data.get("password")

    try:
        user, token = AuthService.authenticate_user(identifier, password)
        return jsonify({
            "message": "Authentication successful.",
            "access_token": token,
            "user": user.to_dict(),
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "Authentication processing failed."}), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Retrieve profile of authenticated user."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({"error": "User profile not found."}), 404

    return jsonify({
        "user": user.to_dict(),
    }), 200
