import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Cpu } from 'lucide-react';
import { api } from '../services/api';

export default function ComputeBadge() {
  const [computeData, setComputeData] = useState({
    tier: 'Local Workstation (Unverified)',
    isConfidential: false,
    status: 'LOCAL_DEVELOPMENT_UNVERIFIED',
  });

  useEffect(() => {
    let isMounted = true;
    api.getHealth()
      .then((data) => {
        if (isMounted) {
          setComputeData({
            tier: data.compute_tier || 'Local Workstation',
            isConfidential: data.is_confidential_verified || false,
            status: data.is_confidential_verified ? 'VERIFIED' : 'UNVERIFIED',
          });
        }
      })
      .catch(() => {
        // Fallback state
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div
      className={`compute-tag ${
        computeData.isConfidential ? 'compute-tag-confidential' : 'compute-tag-unverified'
      }`}
      title={
        computeData.isConfidential
          ? 'Hardware Attestation Active: AMD SEV-SNP Memory Encryption'
          : 'Local Development: Memory is unencrypted in host RAM. Hardware attestation unverified.'
      }
    >
      {computeData.isConfidential ? (
        <>
          <ShieldCheck size={14} />
          <span>Azure CVM (Verified)</span>
        </>
      ) : (
        <>
          <ShieldAlert size={14} />
          <span>Compute: Unverified (Local)</span>
        </>
      )}
    </div>
  );
}
