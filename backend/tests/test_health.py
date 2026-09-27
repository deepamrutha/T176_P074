import pytest
from app import create_app
from app.services.compute_service import ComputeAssessmentService


def test_health_endpoint(client):
    """Test that /api/health returns HTTP 200 with service health and compute tier."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()

    assert data["status"] in ("healthy", "degraded")
    assert "SecureBank" in data["service"]
    assert "database" in data
    assert "compute_tier" in data
    assert data["is_confidential_verified"] is False  # Local environment must be unverified


def test_security_endpoint(client):
    """Test that /api/security returns assessment, comparison matrix, and threat model."""
    response = client.get("/api/security")
    assert response.status_code == 200
    data = response.get_json()

    assert "current_assessment" in data
    assert "comparison_matrix" in data
    assert "threat_model" in data
    assert "cryptographic_standards" in data

    # Verify comparison matrix covers each study tier.
    tiers = [item["category"] for item in data["comparison_matrix"]]
    assert "Standard" in tiers
    assert "TrustedLaunch" in tiers
    assert "Isolated" in tiers
    assert "Confidential" in tiers

    # Verify local warning is present
    assessment = data["current_assessment"]
    assert assessment["is_confidential_verified"] is False
    assert "warning" in assessment and assessment["warning"] is not None


def test_confidential_profile_is_not_attestation(monkeypatch):
    """A configured mode and device indicator cannot prove successful attestation."""
    monkeypatch.setenv("COMPUTE_ENVIRONMENT", "AZURE_CONFIDENTIAL_VM")
    monkeypatch.setattr(ComputeAssessmentService, "get_hardware_evidence", lambda: {
        "sev_guest_device_present": True,
        "sev_device_present": False,
        "tdx_guest_device_present": False,
    })

    assessment = ComputeAssessmentService.assess_environment()

    assert assessment["status"] == "CONFIDENTIAL_VM_UNVERIFIED"
    assert assessment["is_confidential_verified"] is False
    assert "not implemented" in assessment["attestation_status"]


def test_production_requires_explicit_signing_secrets(monkeypatch):
    """Production mode cannot use the built-in development signing-key defaults."""
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)

    with pytest.raises(RuntimeError, match="at least 32 characters"):
        create_app("production")
