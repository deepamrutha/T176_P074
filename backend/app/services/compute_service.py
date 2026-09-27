import os
import platform
import socket
from datetime import datetime, timezone


class ComputeAssessmentService:
    """
    Reports local indicators and configured study profiles without claiming attestation.
    """

    @classmethod
    def get_hardware_evidence(cls) -> dict:
        """Inspects local hardware and OS indicators."""
        hostname = socket.gethostname()
        system = platform.system()
        release = platform.release()
        machine = platform.machine()
        processor = platform.processor()

        # Check for Linux confidential computing sysfs paths (if running on Linux)
        sev_guest_device = os.path.exists("/dev/sev-guest")
        sev_device = os.path.exists("/dev/sev")
        tdx_guest_device = os.path.exists("/dev/tdx-guest")

        return {
            "hostname": hostname,
            "os": f"{system} {release}",
            "architecture": machine,
            "processor": processor or "Unknown",
            "sev_guest_device_present": sev_guest_device,
            "sev_device_present": sev_device,
            "tdx_guest_device_present": tdx_guest_device,
        }

    @classmethod
    def assess_environment(cls) -> dict:
        """
        Reports whether confidential isolation has been verified by this application.
        """
        env_mode = os.getenv("COMPUTE_ENVIRONMENT", "LOCAL_UNVERIFIED").upper()
        evidence = cls.get_hardware_evidence()

        if env_mode == "AZURE_CONFIDENTIAL_VM":
            status = "CONFIDENTIAL_VM_UNVERIFIED"
            tier = "Azure Confidential VM profile (configured; unverified)"
            is_confidential = False
            is_isolated = False
            memory_encryption = "Not verified by this application"
            hypervisor_trust = "Not assessed; configuration is not proof of deployment"
            attestation_status = "Not verified; Azure Attestation quote validation is not implemented"
            warning = (
                "The environment label and guest device indicators are not cryptographic attestation. "
                "This prototype does not validate an Azure Attestation report, so confidential compute "
                "status remains unverified."
            )
        elif env_mode == "AZURE_ISOLATED_VM":
            status = "ISOLATED_VM_UNVERIFIED"
            tier = "Azure Isolated VM profile (configured; unverified)"
            is_confidential = False
            is_isolated = False
            memory_encryption = "Not provided by isolation alone; verify selected VM offering"
            hypervisor_trust = "Not assessed; configuration is not proof of deployment"
            attestation_status = "Not implemented or verified by this application"
            warning = "The configured label does not verify that this process runs on isolated Azure hardware."
        elif env_mode == "AZURE_STANDARD_VM":
            status = "STANDARD_VM_UNVERIFIED"
            tier = "Azure Standard VM profile (configured; unverified)"
            is_confidential = False
            is_isolated = False
            memory_encryption = "Not provided by standard VM selection alone"
            hypervisor_trust = "Not assessed; configuration is not proof of deployment"
            attestation_status = "Not implemented or verified by this application"
            warning = "The configured label does not verify that this process runs on Azure."
        else:
            status = "LOCAL_DEVELOPMENT_UNVERIFIED"
            tier = "Local Workstation (Unverified)"
            is_confidential = False
            is_isolated = False
            memory_encryption = "None (Local Host RAM)"
            hypervisor_trust = "Local Host Kernel Trusted"
            attestation_status = "Unverified (Development Environment)"
            warning = (
                "IMPORTANT: This application is running in a local development environment. "
                "A software demo running locally DOES NOT prove or confer confidential computing protection. "
                "A confidential VM deployment and supported attestation evidence would need to be verified separately."
            )

        return {
            "status": status,
            "tier": tier,
            "is_confidential_verified": is_confidential,
            "is_hardware_isolated": is_isolated,
            "memory_encryption": memory_encryption,
            "hypervisor_trust_assumption": hypervisor_trust,
            "attestation_status": attestation_status,
            "compliance_readiness": {
                "pci_dss_4_0_req_3": "Not assessed or certified; this prototype can only demonstrate selected technical controls",
                "soc_2_type_2": "Not assessed or certified; an audit requires organizational controls and independent examination",
                "gdpr_article_32": "Not a compliance determination; controllers must assess technical and organizational measures",
            },
            "system_evidence": evidence,
            "warning": warning,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @classmethod
    def get_compute_comparison_matrix(cls) -> list:
        """Returns a qualitative Azure compute comparison; prices and availability vary."""
        return [
            {
                "tier": "Standard VM",
                "category": "Standard",
                "hardware_tenancy": "Shared Azure infrastructure; verify the selected offering",
                "boot_integrity": "Depends on selected security type and configuration",
                "memory_encryption": "No confidential-VM guest-memory protection from this tier alone",
                "hypervisor_in_tcb": True,
                "cloud_operator_access": "The host and hypervisor remain in the workload trust boundary",
                "attestation": "No guest attestation implied by the VM tier",
                "cold_boot_protection": False,
                "relative_cost": "Check current SKU, region, and pricing",
                "recommended_workload": "General workloads whose threat model accepts the standard host trust boundary",
            },
            {
                "tier": "Trusted Launch VM",
                "category": "TrustedLaunch",
                "hardware_tenancy": "Standard VM infrastructure with additional boot protections",
                "boot_integrity": "Secure Boot and vTPM measured boot, when supported and enabled",
                "memory_encryption": "Does not add confidential-VM guest-memory protection",
                "hypervisor_in_tcb": True,
                "cloud_operator_access": "The host and hypervisor remain in the workload trust boundary",
                "attestation": "Boot measurements and integrity monitoring; not confidential-memory attestation",
                "cold_boot_protection": False,
                "relative_cost": "Check current SKU, region, and pricing",
                "recommended_workload": "Workloads needing boot-chain protection against bootkits and unauthorized boot components",
            },
            {
                "tier": "Isolated VM",
                "category": "Isolated",
                "hardware_tenancy": "Dedicated physical server for supported isolated VM sizes",
                "boot_integrity": "Depends on selected size, image, and security configuration",
                "memory_encryption": "Isolation alone does not provide confidential-VM guest-memory protection",
                "hypervisor_in_tcb": True,
                "cloud_operator_access": "Dedicated tenancy changes co-residency; the host and hypervisor remain trusted",
                "attestation": "Dedicated tenancy is not, by itself, in-guest attestation",
                "cold_boot_protection": False,
                "relative_cost": "Check current SKU, region, and pricing",
                "recommended_workload": "Workloads requiring dedicated physical host tenancy",
            },
            {
                "tier": "Confidential VM",
                "category": "Confidential",
                "hardware_tenancy": "Hardware-backed TEE using a supported technology such as AMD SEV-SNP or Intel TDX",
                "boot_integrity": "Confidential VM boot protections and vTPM features depend on platform configuration",
                "memory_encryption": "Hardware-backed protection for guest memory and processor state",
                "hypervisor_in_tcb": False,
                "cloud_operator_access": "TEE protections restrict host access to protected guest memory and state; they do not replace guest security",
                "attestation": "Platform attestation is part of supported boot flows; independent guest validation requires implementation",
                "cold_boot_protection": True,
                "relative_cost": "Check current SKU, region, and pricing",
                "recommended_workload": "Sensitive workloads whose threat model requires protection of data in use from the host",
            },
        ]
