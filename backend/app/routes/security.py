from datetime import datetime, timezone
from flask import Blueprint, jsonify
from sqlalchemy import text
from app.extensions import db
from app.services.compute_service import ComputeAssessmentService

security_bp = Blueprint("security", __name__, url_prefix="/api")


@security_bp.route("/health", methods=["GET"])
def health():
    """Health check endpoint evaluating application and database connectivity."""
    db_status = "connected"
    db_engine = "unknown"

    try:
        db.session.execute(text("SELECT 1"))
        db_engine = db.engine.name  # 'postgresql' or 'sqlite'
    except Exception as e:
        db_status = f"error: {str(e)}"

    assessment = ComputeAssessmentService.assess_environment()

    return jsonify({
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "SecureBank Azure Compute Study API",
        "version": "1.0.0",
        "database": {
            "status": db_status,
            "engine": db_engine,
        },
        "compute_tier": assessment["tier"],
        "is_confidential_verified": assessment["is_confidential_verified"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200


@security_bp.route("/security", methods=["GET"])
def security_info():
    """Detailed compute environment assessment and Azure compute comparison study."""
    assessment = ComputeAssessmentService.assess_environment()
    matrix = ComputeAssessmentService.get_compute_comparison_matrix()

    threat_model = [
        {
            "threat_actor": "Host or hypervisor access",
            "standard_vm": "Host and hypervisor remain in the workload trust boundary.",
            "trusted_launch_vm": "Boot protections do not remove the host or hypervisor from the trust boundary.",
            "isolated_vm": "Dedicated tenancy changes co-residency; the host and hypervisor remain trusted.",
            "confidential_vm": "TEE protections restrict host access to protected guest memory and processor state; guest compromise remains in scope.",
        },
        {
            "threat_actor": "Unauthorized or modified boot components",
            "standard_vm": "Protection depends on selected security type and configuration.",
            "trusted_launch_vm": "Secure Boot and measured boot help detect or block unauthorized boot components when configured.",
            "isolated_vm": "Boot protection depends on selected size, image, and security configuration.",
            "confidential_vm": "Confidential VM boot protections are platform-configured; validate their status using supported evidence.",
        },
        {
            "threat_actor": "Data-in-use exposure to the host",
            "standard_vm": "No confidential-VM guest-memory protection is provided by this tier alone.",
            "trusted_launch_vm": "Secure Boot and vTPM do not add confidential-VM guest-memory protection.",
            "isolated_vm": "Dedicated host isolation alone does not add confidential-VM guest-memory protection.",
            "confidential_vm": "Hardware-backed memory protection is designed to restrict host access to guest data in use; it does not mitigate every attack or replace application security.",
        },
    ]

    return jsonify({
        "current_assessment": assessment,
        "comparison_matrix": matrix,
        "threat_model": threat_model,
        "cryptographic_standards": {
            "password_hashing": "Implemented: PBKDF2-SHA256 with 600,000 iterations and per-password salt",
            "session_tokens": "Implemented: signed JWT bearer tokens; configured expiration; development secret defaults must be replaced before deployment",
            "data_at_rest": "Not configured by this prototype; PostgreSQL storage encryption depends on the database host and settings",
            "data_in_transit": "Local development uses HTTP; production TLS termination is not implemented here",
            "data_in_use": "Not implemented or verified locally; confidential VM deployment is a study target",
        },
        "disclaimer": (
            "Azure compute comparisons are conceptual. This application does not provision Azure resources "
            "or validate an Azure Attestation report. Environment labels and guest device indicators are not proof. "
            "No Azure deployment or confidential VM attestation is verified by this prototype."
        ),
    }), 200
