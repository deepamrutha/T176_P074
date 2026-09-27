# Compliance Control Relevance

SecureBank is a fictional local prototype. It does not process real payment card data or personal banking records and has not been assessed, certified, or audited. Nothing in this document asserts PCI DSS compliance, a SOC 2 report, or GDPR compliance.

## PCI DSS

Potentially relevant design topics include protecting stored account data, access control, secure software, and audit records. Confidential computing may contribute to protection of selected data-in-use risks, but a VM choice does not satisfy PCI DSS by itself. This prototype has no cardholder-data environment, production controls, independent assessment, or evidence package.

## SOC 2

A confidential VM may provide technical evidence relevant to selected confidentiality controls. It does not remove the cloud provider from the system or audit boundary and does not replace organizational policies, identity controls, change management, monitoring, incident response, or an independent examination. SecureBank has no SOC 2 report.

## GDPR

Article 32 calls for security measures appropriate to the processing risk. Encryption, access controls, and hardware-backed protection can be part of a broader assessment. A legal determination also depends on the actual processing, controller/processor responsibilities, data subjects, organizational measures, and applicable law. SecureBank makes no GDPR compliance determination.

## Shared Responsibility

Confidential VMs are designed to protect guest memory and processor state from the host using hardware-backed TEEs on supported offerings. This reduces one part of the infrastructure trust boundary; it does not prove the guest or application is secure, prevent all attacks, or remove responsibility for the Azure control plane, guest OS, app, database, keys, identity, networking, operations, and evidence.
