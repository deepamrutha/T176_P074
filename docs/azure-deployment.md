# Azure Portal Verification Checklist

## Current Status

No Azure subscription, resource group, VM, confidential VM configuration, deployment, or attestation result has been inspected or verified for this project. No resources have been created by this workflow. The Azure architecture is planned only. Do not proceed to resource creation unless the subscription owner approves the scope, budget, region, and expected charges.

## Manual Checks Before Any Future Deployment

- Confirm the intended subscription is active and inspect its remaining credits/budget.
- In the portal, verify the desired region offers a VM size with the required security type, image, disk options, and capacity.
- Check applicable family quota separately from regional capacity.
- Use the Azure Pricing Calculator for VM runtime and add disk, IP, networking, monitoring, and other resource costs. Prices and availability change; this project makes no fixed estimate.
- Review inbound networking and avoid exposing the Flask development port directly to the public internet. A future deployment needs an approved ingress, TLS, firewall/NSG policy, and private database connectivity.
- Confirm how PostgreSQL will be hosted and secured. The local PostgreSQL instance in this project is not an Azure database.
- Review secrets management, least privilege, backup, logging, recovery, and teardown before creating anything.

## Evidence to Capture if Deployment Is Separately Approved

Capture actual portal evidence for subscription and budget, resource group, VM security type and size, image, Secure Boot/vTPM settings where applicable, disk encryption configuration, network exposure, deployed VM state, and application health. Do not create evidence from a template or expected output.

For attestation, use supported Azure documentation and tooling for the exact VM technology. Distinguish platform boot attestation from any customer-initiated guest verification. Save the actual report and validation result only if generated and independently checked. The SecureBank API's environment label and guest device indicators are not attestation.

## Official References

- [Trusted Launch for Azure virtual machines](https://learn.microsoft.com/azure/virtual-machines/trusted-launch)
- [Azure confidential VM overview](https://learn.microsoft.com/azure/confidential-computing/confidential-vm-overview)
- [Microsoft Azure Attestation overview](https://learn.microsoft.com/azure/attestation/overview)
- [Azure VM sizes and region availability](https://learn.microsoft.com/azure/virtual-machines/sizes/overview)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
