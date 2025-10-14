# Project Proposal

## 1. Title & One-Line Value Proposition
**SecureHealth Chain** — Blockchain-based insurance claim and medication transaction platform with custodian-verified processing for transparent healthcare payments.

## 2. Problem & Stakeholders
Healthcare insurance and medication transactions today involve complex multi-party interactions with significant inefficiencies: claim denials lack transparency, prior authorization delays critical treatments and medication pricing varies wildly between providers. Health providers need streamlined claim submission and instant verification, custodians (insurance companies/PBMs) require automated adjudication, and patients deserve transparent pricing, real-time coverage verification, and control over their insurance data—all while maintaining HIPAA compliance and reducing administrative overhead.

## 3. Research Alignment
Theme: Healthcare transactions + custodian verification. This project explores blockchain's potential to create transparent, auditable insurance claim processing and medication authorization systems with custodian-mediated verification patterns that reduce fraud while accelerating legitimate transactions.

## 4. Platform & Rationale
Choice: HardHat
HardHat provides the ideal foundation for healthcare financial transactions through its native support for organizational roles (providers, custodians, patients), private data collections for sensitive pricing/coverage data, smart contract-based claim adjudication logic, and immutable audit trails—essential for regulatory compliance and multi-party trust in insurance transactions.

## 5. MVP Features + Stretch
**MVP (Weeks 6-10):**
- Insurance claim submission by providers
- Medication authorization requests while cross referencing against patient's plan
- Custodian verification gateway that validates coverage, processes claims, and logs all         decisions
- Patient portal showing claim status, medication approvals, and out-of-pocket costs
- Basic smart contracts for claim adjudication rules and formulary management

**Stretch (Weeks 11-13):**
- Price transparency dashboard showing negotiated rates across providers
- Multi-custodian support for coordination of benefits scenarios

## 6. Architecture Sketch

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├──────────────┬────────────────┬───────────────────────────── ┤
│Provider Portal│Patient Portal  │Custodian Dashboard          │
│•Submit claims │•View claims    │•Process authorizations      │
│•Check eligib. │•Check coverage │•Manage formularies          │
│•Prior auth    │•Medication hist│                             │
└──────┬───────┴───────┬────────┴──────┬──────────────────────┘
       │               │               │
┌──────▼───────────────▼───────────────▼──────────────────────┐
│              Custodian Verification Gateway                  │
│  • Coverage verification & eligibility checks                │
│  • Claim adjudication logic execution                        │
│  • Prior authorization processing                            │
│  • Formulary management                                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    HardHat Blockchain                         │
├───────────────────────────────────────────────────────────────┤
│  Chaincode Components:                                        │
│  • ClaimProcessor: Submit, adjudicate, approve/deny claims    │
│  • MedicationAuth: Formulary checks, prior auth workflows     │
│  • CoverageManager: Patient eligibility & benefit tracking    │
│  • PaymentLedger: Track payments, copays, deductibles         │
│  • AuditLogger: Immutable transaction history                 │
├───────────────────────────────────────────────────────────────┤
│  Organizations: Provider_Network | Custodian_Insurer |        │
│                 Custodian_PBM | Patient_Collective            │
└───────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────── ┐
│            External Integrations & Data Sources               │
│  • NCPDP standards for pharmacy transactions                  │       
│  • Drug formulary databases (mock FDA Orange Book)            │
│  • Provider credential verification (mock NPPES)              │
└───────────────────────────────────────────────────────────────┘
```

Transaction Flow: 
Provider submits claim → Gateway validates coverage → 
Smart contract applies rules → Custodian approves/denies → 
Payment initiated → Patient notified → Audit recorded

## 7. Security & Privacy Requirements
Our system implements comprehensive security for financial healthcare data through authentication for all user types, with providers verified through NPI registry integration and patients authenticated via insurance member IDs. All transactions require cryptographic signatures with custodian co-signing for amounts exceeding thresholds. We implement role-based access control ensuring providers only see their submitted claims, custodians access only their covered members, and patients view only their own records. Sensitive pricing data and negotiated rates are stored in Private Data Collections visible only to contracting parties. Smart contract-enforced business rules prevent unauthorized claim modifications, duplicate submissions, and ensure regulatory compliance with automatic HIPAA-compliant audit logging of all access attempts and modifications.

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
- PM/Scrum Lead: Sprint planning, stakeholder demos, regulatory compliance tracking
- Chaincode Developer: Smart contracts for claims, medications, payment logic
- Backend Developer: Custodian gateway, eligibility APIs, adjudication engine
- Frontend Developer: Provider portal, patient dashboard, custodian interface
- DevOps/QA: Multi-org network setup, integration testing, performance optimization

**Logistics:**
- Standup: Tuesdays/Thursdays 6PM via Discord
- Repo: https://github.com/JUSH334/team-odus-securehealth-chain.git

## 10. Top Risks & Mitigations
- Risk 1: Complex insurance business logic → Start with simplified claim types (office visits, generic medications); implement basic copay/deductible calculations first.
- Risk 2: Regulatory compliance complexity → Focus on core HIPAA requirements (access controls, audit logs); mock regulatory reporting rather than full implementation.
