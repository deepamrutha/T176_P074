import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';

export default function ComputeStudy() {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'threat-model' | 'attestation' | 'compliance'

  useEffect(() => {
    api.getSecurityInfo()
      .then((data) => {
        setSecurityData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading security study data:', err);
        setLoading(false);
      });
  }, []);

  const assessment = securityData?.current_assessment;

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
          <Cpu size={16} />
          <span>Cloud Security Research & College Project</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Azure Confidential or Isolated Compute Design Study
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '850px' }}>
          A design comparison of boot integrity, host isolation, and hardware-backed data-in-use protection.
          Azure deployment and attestation are not implemented in this prototype.
        </p>
      </div>

      {/* Prominent Truthful Attestation Status Card */}
      <div className="card" style={{
        marginBottom: '2rem',
        borderLeft: assessment?.is_confidential_verified ? '4px solid var(--status-green)' : '4px solid var(--status-amber)',
        backgroundColor: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className={`compute-tag ${assessment?.is_confidential_verified ? 'compute-tag-confidential' : 'compute-tag-unverified'}`}>
                {assessment?.is_confidential_verified ? 'HARDWARE ATTESTED' : 'UNVERIFIED ENVIRONMENT'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-caption)' }}>Status: {assessment?.status}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Active Runtime: {assessment?.tier || 'Local Workstation (Unverified)'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              {assessment?.warning || (
                'Hardware memory encryption is inactive. Data in physical RAM is readable by host hypervisors.'
              )}
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            minWidth: '240px'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-caption)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Host Evidence Metrics
            </div>
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-main)' }}>
              <div><strong>OS:</strong> {assessment?.system_evidence?.os}</div>
              <div><strong>Arch:</strong> {assessment?.system_evidence?.architecture}</div>
              <div><strong>SEV guest device indicator:</strong> {assessment?.system_evidence?.sev_guest_device_present ? 'Present (not attestation)' : 'Not detected'}</div>
              <div><strong>Attestation:</strong> {assessment?.attestation_status}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`btn btn-sm ${activeTab === 'comparison' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Layers size={14} />
          <span>Compute Tiers Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('threat-model')}
          className={`btn btn-sm ${activeTab === 'threat-model' ? 'btn-primary' : 'btn-outline'}`}
        >
          <ShieldAlert size={14} />
          <span>Threat Model (STRIDE)</span>
        </button>
        <button
          onClick={() => setActiveTab('attestation')}
          className={`btn btn-sm ${activeTab === 'attestation' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Lock size={14} />
          <span>vTPM & Attestation Flow</span>
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`btn btn-sm ${activeTab === 'compliance' ? 'btn-primary' : 'btn-outline'}`}
        >
          <FileCheck2 size={14} />
          <span>Regulatory Compliance (PCI-DSS)</span>
        </button>
      </div>

      {/* TAB 1: Compute Comparison Matrix */}
      {activeTab === 'comparison' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Architectural Comparison of Azure Compute Options</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Qualitative design comparison. Confirm security settings, regional availability, and current pricing for any selected offering in Azure.
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Feature Dimension</th>
                  <th>Standard VM (Ordinary)</th>
                  <th>Trusted Launch VM</th>
                  <th>Isolated VM (Dedicated)</th>
                  <th>Confidential VM (SEV-SNP)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Hardware Tenancy</strong></td>
                  <td>Shared Azure infrastructure; verify the selected offering</td>
                  <td>Standard VM infrastructure with additional boot protections</td>
                  <td>Dedicated physical server for supported isolated sizes</td>
                  <td>Hardware-backed TEE; not a tenancy model</td>
                </tr>
                <tr>
                  <td><strong>Boot Integrity</strong></td>
                  <td>Depends on security type and configuration</td>
                  <td><span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Secure Boot and vTPM measured boot when supported and enabled</span></td>
                  <td>Depends on size, image, and configuration</td>
                  <td>Platform boot protections and vTPM features depend on configuration</td>
                </tr>
                <tr>
                  <td><strong>Data-in-Use (RAM)</strong></td>
                  <td>No confidential-VM guest-memory protection from this tier alone</td>
                  <td><span style={{ color: 'var(--status-red)' }}>Boot protection does not add confidential-VM guest-memory protection</span></td>
                  <td>Dedicated tenancy alone does not add confidential-VM guest-memory protection</td>
                  <td><span style={{ color: 'var(--status-green)', fontWeight: 600 }}>Hardware-backed protection for guest memory and processor state</span></td>
                </tr>
                <tr>
                  <td><strong>Trust Boundary</strong></td>
                  <td>Host and hypervisor remain trusted</td>
                  <td>Host and hypervisor remain trusted</td>
                  <td>Dedicated tenancy; host and hypervisor remain trusted</td>
                  <td>TEE restricts host access to protected guest memory; guest and platform security still matter</td>
                </tr>
                <tr>
                  <td><strong>Attestation Scope</strong></td>
                  <td>No guest attestation implied by the VM tier</td>
                  <td>Boot measurements and integrity monitoring; not memory-encryption attestation</td>
                  <td>Dedicated tenancy is not in-guest attestation</td>
                  <td>Platform attestation is part of supported boot flows; guest verification is separate</td>
                </tr>
                <tr>
                  <td><strong>Cost and Availability</strong></td>
                  <td>Check current SKU and region</td>
                  <td>Check current SKU and region</td>
                  <td>Check current size, region, and capacity</td>
                  <td>Check current SKU, region, quota, and pricing</td>
                </tr>
                <tr>
                  <td><strong>Primary Focus</strong></td>
                  <td>General workloads accepting the standard host trust boundary</td>
                  <td>Boot-chain integrity</td>
                  <td>Dedicated physical host tenancy</td>
                  <td><span style={{ color: 'var(--status-green)', fontWeight: 700 }}>Protecting data in use from the host</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Threat Model */}
      {activeTab === 'threat-model' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Threat Model & Attack Vector Resistance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Qualitative boundaries: confidential computing reduces host access to protected guest state but does not replace guest security.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {securityData?.threat_model?.map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem 1.15rem',
                border: '1px solid var(--border-color)'
              }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                  <AlertTriangle size={15} style={{ color: 'var(--status-amber)' }} />
                  <span>Threat Actor: {item.threat_actor}</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.65rem', fontSize: '0.825rem' }}>
                  <div style={{ backgroundColor: 'var(--status-red-bg)', border: '1px solid var(--status-red-border)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--status-red)' }}>Standard VM:</strong> {item.standard_vm}
                  </div>
                  <div style={{ backgroundColor: 'var(--status-amber-bg)', border: '1px solid var(--status-amber-border)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--status-amber)' }}>Trusted Launch:</strong> {item.trusted_launch_vm}
                  </div>
                  <div style={{ backgroundColor: 'var(--status-amber-bg)', border: '1px solid var(--status-amber-border)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--status-amber)' }}>Isolated VM:</strong> {item.isolated_vm}
                  </div>
                  <div style={{ backgroundColor: 'var(--status-green-bg)', border: '1px solid var(--status-green-border)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--status-green)' }}>Confidential VM:</strong> {item.confidential_vm}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Attestation Sequence */}
      {activeTab === 'attestation' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Conceptual Attestation and Key-Release Flow</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            A possible Azure design for independent verification; this flow is not implemented by SecureBank.
          </p>

          <div className="alert-banner alert-warning" style={{ marginBottom: '1.25rem' }}>
            <AlertTriangle size={18} />
            <span>No Azure Attestation integration, key release, or confidential VM deployment has been verified for this prototype.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                1
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Platform boot and hardware measurements (planned)</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem', lineHeight: '1.5' }}>
                  A supported confidential VM platform performs documented boot and attestation processes. Available evidence depends on the selected hardware and Azure configuration.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                2
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>vTPM measured boot (configuration dependent)</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem', lineHeight: '1.5' }}>
                  A vTPM can record boot measurements. SecureBank does not read these measurements or seal database secrets to PCR values.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                3
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Optional guest attestation validation (not implemented)</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem', lineHeight: '1.5' }}>
                  Azure documents platform attestation in supported confidential VM boot flows. Separate customer-initiated guest verification can be added, but this application does not request or validate a quote.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--status-green)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                4
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Optional attestation-gated key release (not implemented)</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem', lineHeight: '1.5' }}>
                  A production design could gate secrets on validated claims using a supported Azure key-release pattern. SecureBank has no Key Vault or Managed HSM integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Compliance */}
      {activeTab === 'compliance' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Regulatory Compliance Justifications</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Potential control relevance only. SecureBank is not PCI DSS certified, SOC 2 audited, or GDPR compliant by virtue of this prototype.
          </p>

          <div className="grid-cols-2">
            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>PCI-DSS 4.0 Requirement 3</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Potential relevance:</strong> Hardware-backed protection for data in use may support a broader control design.
                This demo does not process payment card data and has not been assessed against PCI DSS requirements.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>SOC 2 Type II Confidentiality</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Potential relevance:</strong> Confidential computing can contribute technical evidence for selected controls.
                It does not remove the cloud provider from audit scope or establish a SOC 2 report; independent examination and organizational controls remain necessary.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>GDPR Article 32</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Potential relevance:</strong> Encryption and access safeguards, including protection of data in use, may inform
                a controller's risk-based technical and organizational measures. This is not a legal compliance determination.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>Shared Responsibility Shift</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Trust boundary:</strong> A confidential VM is designed to restrict host access to protected guest memory and state.
                The guest OS, application, configuration, platform, control plane, and attestation policy still require appropriate trust and verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
