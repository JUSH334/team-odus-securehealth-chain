# Project Proposal

## 1. Title & One-Line Value Proposition
**SecureHealth Chain** — Privacy-preserving healthcare data sharing with custodian-managed access control for audit transparency.

## 2. Problem & Stakeholders
Healthcare data sharing today suffers from fragmented systems where patients lack control over their medical records, providers struggle with interoperability, and researchers cannot access aggregated data without compromising privacy. Patients need consent management, providers require secure data exchange, auditors need compliance verification, and researchers benefit from privacy-preserved analytics—all while maintaining HIPAA compliance and patient trust.

## 3. Research Alignment
Theme: Healthcare privacy + custodian repository.
This extends on privacy-preserving healthcare systems by implementing custodian-mediated access patterns with audit trails to protect individual patient data.

## 4. Platform & Rationale
Choice: Fabric/NeuroBlock
Hyperledger Fabric provides the ideal foundation for healthcare data sharing through its native support for organizational roles, private data collections for PHI isolation, fine-grained endorsement policies for consent management, and built-in audit capabilities—all essential for HIPAA compliance and multi-stakeholder healthcare environments.

## 5. MVP Features + Stretch
**MVP (Weeks 6-10):**
- Patient/Provider read/write access with role-based actions
- Custodian gateway that cryptographically signs and logs all access requests with chain audit events
- Basic consent management UI showing active permissions and access history

**Stretch (Weeks 11-13):**
- Private Data Collections for PHI storage with only hashes on-chain, supporting consent revocation workflows
- Analytics dashboard displaying differentially private population health metrics with configurable epsilon values

## 6. Architecture Sketch

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├──────────────┬────────────────┬──────────────┬─────────────┤
│Patient Portal│Provider Portal │Auditor View  │Analytics    │
└──────┬───────┴───────┬────────┴──────┬───────┴─────┬───────┘
       │               │               │             │
┌──────▼───────────────▼───────────────▼─────────────▼───────┐
│                  Custodian Gateway (Node.js)                │
│  • Identity verification (VCs)                              │
│  • Request signing & validation                             │
│  • LDP noise injection for aggregates                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Hyperledger Fabric / NeuroBlock                │
├──────────────────────────────────────────────────────────────┤
│  Chaincode Components:                                       │
│  • ConsentManager: Grant/revoke patient permissions          │
│  • EncounterRegistry: Provider data submissions              │
│  • AuditLogger: Immutable access event recording             │
│  • PrivateDataCollection: PHI storage (hash on-chain)        │
├──────────────────────────────────────────────────────────────┤
│  Organizations: Hospital_A | Hospital_B | Custodian | Auditor│
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Data Sources & External Systems                   │
│  • Synthetic EHR Generator (CSV/JSON)                        │
│  • Identity Provider (Mock VCs for providers/patients)       │
└──────────────────────────────────────────────────────────────┘

Data Flow: User Request → Gateway (VC check) → Sign → Chaincode → 
          Audit Event → Response (with DP noise if aggregate)
```

## 7. Security & Privacy Requirements
Our system implements defense-in-depth security through verifiable credential-based authentication, ensuring only authorized healthcare providers and registered patients can interact with the system. All write operations require cryptographic signatures verified by the custodian gateway before execution. We enforce strict endorsement policies requiring consensus for consent changes. Private Data Collections isolate PHI within authorized organizations while maintaining hash-based integrity on the public ledger. Input validation prevents injection attacks, rate limiting mitigates DoS attempts, and comprehensive audit logging provides forensic capabilities for compliance verification.

## 8. Milestones (Weeks 6-14)
- **W6:** Environment & Skeleton
- **W7:** Vertical Slice
- **W8:** Feature 1
- **W9:** Feature 2 + Basic Authorization
- **W10:** Security & Privacy Sprint
- **W11:** Testing & Metrics
- **W12:** LLM/Analytics Add-on
- **W13:** Freeze & Polish
- **W14:** Dryrun

## 9. Team & Roles + Logistics
**Team Odus Roles:**
- **PM/Scrum Lead:** Sprint planning, stakeholder demos, risk tracking
- **Chaincode Developer:** Fabric smart contracts, endorsement policies
- **Backend Developer:** Custodian gateway, VC integration, DP implementation  
- **Frontend Developer:** Patient/provider portals, analytics dashboard
- **DevOps/QA:** CI/CD pipeline, testing framework, performance monitoring

**Logistics:**
- Standup: Tuesdays/Thursdays 6PM via Discord
- Repo: https://github.com/JUSH334/team-odus-securehealth-chain.git

## 10. Top Risks & Mitigations
- **Risk 1: Realistic healthcare data complexity** → Use open synthetic EHR generator (Synthea) with simplified encounter types; focus on 3 data fields initially (diagnosis, medication, vitals)
- **Risk 2: Differential privacy parameter tuning** → Start with well-studied ε=1.0 for counting queries; consult DP literature for healthcare precedents; implement sensitivity analysis tool
- **Risk 3: Multi-org Fabric setup complexity** → Begin with 2-org minimum viable network; use existing Fabric samples as foundation; allocate extra week for environment debugging
