# Azure Compute Comparison for SecureBank

This is a design study, not a deployment report. Compute security depends on the selected VM size, image, security profile, region, and configuration. The current prototype runs locally and has not verified any Azure option.

## Comparison

| Option | Main purpose | Boot protection | Data-in-use protection | Trust boundary and attestation | Sensitive workload fit |
| --- | --- | --- | --- | --- | --- |
| Standard VM | General virtualized compute | Depends on VM generation, security type, and settings | No confidential-VM guest-memory protection is provided by the Standard tier alone | The host and hypervisor remain in the workload trust boundary. The VM tier alone does not imply guest attestation. | Suitable when the standard host trust boundary is accepted and application controls meet the workload needs. |
| Trusted Launch VM | Reduce boot-chain attacks | Secure Boot validates signed boot components; vTPM supports measured boot and integrity monitoring when configured | Trusted Launch is not confidential memory encryption. It does not protect guest memory from a privileged host or hypervisor. | The host and hypervisor remain trusted. Boot measurements/attestation concern boot integrity, not confidential-memory protection. | Useful when boot integrity is the main additional requirement. It is not a substitute for a confidential VM when protection from host memory access is required. |
| Isolated VM size | Dedicated physical server tenancy for supported sizes | Depends on the size, image, and VM security configuration | Dedicated tenancy alone does not provide confidential-VM guest-memory protection | Isolation addresses co-residency on the physical server. The host and hypervisor remain part of the trust boundary; dedicated tenancy is not in-guest attestation. | Consider when single-customer physical server tenancy is required. It addresses a different threat model from confidential memory. |
| Confidential VM | Protect data in use using a hardware-backed TEE such as AMD SEV-SNP or Intel TDX, on supported offerings | Platform boot and vTPM features depend on the selected confidential VM configuration | Hardware-backed protection is designed to protect guest memory and processor state from the host | Azure documents platform attestation for supported boot flows. Separate guest verification and application key-release policies require implementation. | A candidate for sensitive processing when protection from the host is part of the threat model and the remaining guest/application controls are addressed. |

## Important Distinctions

- **Trusted Launch protects the boot process.** Secure Boot and measured boot help establish whether supported boot components match expectations. Trusted Launch is not equivalent to confidential memory encryption.
- **Isolated infrastructure and confidential memory address different risks.** An isolated VM size dedicates a physical server to one customer/VM; a confidential VM uses a hardware TEE to protect guest memory and processor state from the host. One should not be described as a replacement for the other.
- **Confidential computing is not a complete zero-trust system.** It reduces the host's ability to access protected guest state. The guest OS, application, dependencies, configuration, identity, network, data store, control plane, and policy remain important trust boundaries. It does not guarantee protection against a compromised guest or every side-channel, availability, or operational threat.
- **Attestation is evidence that must be interpreted.** Azure's platform boot attestation and optional customer-initiated guest attestation are not the same as this prototype's local device checks. SecureBank does not request or validate an Azure Attestation report and does not release keys based on claims.
- **Compliance is not inherited from a VM choice.** A compute security feature may support selected controls, but this project has not undergone a PCI DSS assessment, SOC 2 examination, or GDPR legal assessment.

## Cost, Region, Quota, and Capacity

No fixed price, VM size, or region is promised here. Before any future deployment, use the Azure portal to verify the current subscription, region, supported VM sizes and security type, quota, available capacity, image support, disks, and total expected charges in the Azure Pricing Calculator. Costs can include compute, disks, networking, monitoring, and other resources. Stop before creating resources unless the account owner has approved the scope and budget.

## Current Project Status

- Local application database: PostgreSQL 17 through Psycopg 3.
- Azure VM or resource group: not deployed or verified.
- Azure confidential VM configuration: not deployed or verified.
- Azure Attestation or in-guest quote validation: not implemented or verified.
- Key Vault / Managed HSM key release: not implemented.
- Compliance certification: not claimed.

## Microsoft References

- [Trusted Launch for Azure virtual machines](https://learn.microsoft.com/azure/virtual-machines/trusted-launch)
- [Virtual machine sizes that provide isolation in Azure](https://learn.microsoft.com/azure/virtual-machines/isolation)
- [Azure confidential VM overview](https://learn.microsoft.com/azure/confidential-computing/confidential-vm-overview)
- [Azure confidential VM FAQ and attestation](https://learn.microsoft.com/azure/confidential-computing/confidential-vm-faq)
- [Microsoft Azure Attestation overview](https://learn.microsoft.com/azure/attestation/overview)
- [Azure VM sizes overview](https://learn.microsoft.com/azure/virtual-machines/sizes/overview)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
