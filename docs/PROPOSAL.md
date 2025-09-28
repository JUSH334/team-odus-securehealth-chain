# Project Proposal

## 1. Title & One-Line Value Proposition
**SecureHealth Chain** — Privacy-preserving healthcare data sharing with custodian-managed access control and differential privacy for audit transparency.

## 2. Problem & Stakeholders
Healthcare data sharing today suffers from fragmented systems where patients lack control over their medical records, providers struggle with interoperability, and researchers cannot access aggregated data without compromising privacy. Patients need consent management, providers require secure data exchange, auditors need compliance verification, and researchers benefit from privacy-preserved analytics—all while maintaining HIPAA compliance and patient trust.

## 3. Research Alignment
Theme: Healthcare privacy + custodian repository + local differential privacy.
This extends the instructor's work on privacy-preserving healthcare systems by implementing custodian-mediated access patterns with cryptographic audit trails and applying local differential privacy to protect individual patient data while enabling population health insights.

## 4. Platform & Rationale
Choice: Fabric/NeuroBlock
Hyperledger Fabric provides the ideal foundation for healthcare data sharing through its native support for organizational roles, private data collections for PHI isolation, fine-grained endorsement policies for consent management, and built-in audit capabilities—all essential for HIPAA compliance and multi-stakeholder healthcare environments.

## 5. MVP Features + Stretch
**MVP (Weeks 6-10):**
- Patient/Provider registry with role-based actions (patients grant consent, providers write encounter summaries)
- Custodian gateway that cryptographically signs and logs all access requests with on-chain audit events
- Local differential privacy implementation adding Laplace noise to weekly patient count aggregates before chain logging
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
Our system implements defense-in-depth security through verifiable credential-based authentication at the gateway layer, ensuring only authorized healthcare providers and registered patients can interact with the system. All write operations require cryptographic signatures verified by the custodian gateway before chaincode execution. We enforce strict endorsement policies requiring multi-org consensus for consent changes. For privacy, we implement local differential privacy with configurable epsilon (ε=1.0 default) on all aggregate queries, ensuring individual patient data cannot be reverse-engineered from population statistics. Private Data Collections isolate PHI within authorized organizations while maintaining hash-based integrity on the public ledger. Input validation prevents injection attacks, rate limiting mitigates DoS attempts, and comprehensive audit logging provides forensic capabilities for compliance verification.

## 8. Milestones (Weeks 6-14)
- **W6:** Fabric environment configured; skeleton chaincode with ConsentManager and AuditLogger; first unit test for consent creation; vertical slice architecture finalized
- **W7:** Vertical slice demo showing patient consent flow from UI through gateway to chaincode state change with audit event emission
- **W8:** Complete EncounterRegistry chaincode with provider role validation; implement custodian gateway request signing; consume audit events in monitoring UI
- **W9:** Implement VC-based authentication for patients/providers; add Laplace noise mechanism for aggregate queries with ε=1.0; basic consent management UI operational
- **W10:** Document threat model identifying top 5 risks; implement input validation, rate limiting, and endorsement policy enforcement as primary mitigations
- **W11:** Achieve 80% test coverage with 15+ unit tests; capture performance metrics (consent latency <500ms, DP calculation overhead)
- **W12:** Integrate LLM-assisted smart contract audit tool; build analytics dashboard showing differentially private population health trends
- **W13:** Feature freeze; comprehensive documentation pass including API docs, deployment guide, and privacy parameter tuning instructions
- **W14:** Practice poster presentation with 3-minute pitch; incorporate feedback; prepare live demo with fallback video

## 9. Team & Roles + Logistics
**Team Odus Roles:**
- **PM/Scrum Lead:** Sprint planning, stakeholder demos, risk tracking
- **Chaincode Developer:** Fabric smart contracts, endorsement policies
- **Backend Developer:** Custodian gateway, VC integration, DP implementation  
- **Frontend Developer:** Patient/provider portals, analytics dashboard
- **DevOps/QA:** CI/CD pipeline, testing framework, performance monitoring

**Logistics:**
- Standup: Tuesdays/Thursdays 6PM via Discord
- Async updates: Slack channel #team-odus
- Repo: https://github.com/JUSH334/team-odus-securehealth-chain.git

## 10. Top Risks & Mitigations
- **Risk 1: Realistic healthcare data complexity** → Use open synthetic EHR generator (Synthea) with simplified encounter types; focus on 3 data fields initially (diagnosis, medication, vitals)
- **Risk 2: Differential privacy parameter tuning** → Start with well-studied ε=1.0 for counting queries; consult DP literature for healthcare precedents; implement sensitivity analysis tool
- **Risk 3: Multi-org Fabric setup complexity** → Begin with 2-org minimum viable network; use existing Fabric samples as foundation; allocate extra week for environment debugging
