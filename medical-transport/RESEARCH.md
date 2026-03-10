# Medical Transportation SaaS – Research & Competitive Analysis

## 1. Problem Statement

Non-Emergency Medical Transportation (NEMT) providers, hospitals, insurance companies, and healthcare facilities need software to schedule, dispatch, and track rides for patients who require transport to medical appointments. Key pain points include:

- **Data privacy**: Many existing cloud platforms share patient data across customer organizations; some data is allegedly sold or shared with competitors.
- **Vendor lock-in**: Proprietary formats make it hard to export or migrate data.
- **Complex UX**: Dispatchers and drivers face steep learning curves.
- **Limited entry options**: Most tools lack CSV bulk-import, forcing manual re-entry.
- **Cost**: Enterprise SaaS pricing is prohibitive for small/mid-sized providers.

---

## 2. Competitive Landscape (USA)

| Product | Company | Focus | Pricing Model | Data Hosting | Open Source? | Notes |
|---|---|---|---|---|---|---|
| **MediRoutes** | MediRoutes Inc. | NEMT scheduling & dispatch | SaaS subscription | Cloud (shared) | No | Well-known API; used by insurers & Medicaid brokers |
| **TripMaster** | MTM Inc. | NEMT trip management | SaaS subscription | Cloud | No | Strong Medicaid broker integration |
| **RouteGenie** | RouteGenie LLC | NEMT dispatch & billing | SaaS + per-trip fee | Cloud | No | Mobile driver app; real-time GPS tracking |
| **Kinetik** | Kinetik Inc. | NEMT platform + claims | SaaS subscription | Cloud | No | Insurance-facing; handles claims submission |
| **Tobi Cloud** | Tobi | Real-time NEMT | SaaS subscription | Cloud | No | Live ride tracking; patient notifications |
| **MTM (ModivCare)** | ModivCare | National NEMT broker | Enterprise license | Cloud | No | Largest US NEMT broker; not sold to providers |
| **Veyo** | Veyo | NEMT network | SaaS + network fees | Cloud | No | Used by Medicaid plans in several states |
| **Acuity Scheduling** | Acuity (Squarespace) | General appointment scheduling | SaaS | Cloud | No | Not NEMT-specific, but used by some small providers |
| **Ecolane** | Ecolane | Paratransit & demand-response | SaaS/on-prem | Cloud/On-Prem | No | Strong demand-response algorithms |
| **Trapeze Group** | Trapeze | Paratransit / fixed route | Enterprise | On-Prem/Cloud | No | Widely used by public transit agencies |

### Key Observations

1. **No major open-source option exists** in the NEMT market — a significant opportunity.
2. **Data privacy** is a recurring concern; providers and patients want assurance data is not shared.
3. **Cost** ranges from ~\$200–\$2,000+/month depending on trip volume.
4. **Most platforms require internet connectivity**; offline or local-first options are rare.
5. **CSV import is frequently missing** from entry-level tiers.

---

## 3. APIs & Integration Points Common in NEMT

### Mapping & Routing
| API | Provider | Purpose |
|---|---|---|
| Google Maps Platform (Directions, Distance Matrix) | Google | Route optimization, ETA |
| HERE Routing API | HERE Technologies | Route planning, real-time traffic |
| Mapbox Directions API | Mapbox | Custom map tiles + routing |
| OpenRouteService | HeiGIT (open) | Free, open-source routing |

### Healthcare / Insurance
| API | Provider | Purpose |
|---|---|---|
| Waystar (ClaimLogic) | Waystar | Electronic claims submission |
| Availity | Availity | Eligibility verification, prior auth |
| CMS FHIR API | CMS.gov | Medicare/Medicaid eligibility (FHIR R4) |
| HL7 FHIR R4 | Various EHRs | Patient data interoperability |
| Change Healthcare | Optum | Claims, eligibility, real-time authorizations |

### Communications
| API | Provider | Purpose |
|---|---|---|
| Twilio SMS/Voice | Twilio | Patient & driver notifications |
| SendGrid | Twilio | Email confirmations |

### Identity & Auth (for SaaS deployment)
| API | Provider | Purpose |
|---|---|---|
| Auth0 / Okta | Auth0/Okta | Identity management, SSO |
| OAuth2 + PKCE | Various | Secure authorization |

### Open / Government
| Resource | Source | Purpose |
|---|---|---|
| CMS Non-Emergency Transportation (NET) data | CMS.gov | Medicaid coverage rules |
| GTFS (General Transit Feed Specification) | Google/FHWA | Public transit integration |
| OpenStreetMap | OSM Foundation | Free map data (no usage fees) |

---

## 4. Market Size & Opportunity

- The US NEMT market was valued at **\$7.5 billion in 2023** and is projected to grow at **~7% CAGR** through 2030 (Sources: Grand View Research, Allied Market Research).
- Approximately **4 million Americans** miss or delay medical appointments each year due to lack of transportation.
- Medicaid covers NEMT for beneficiaries; states spend **\$3–5 billion/year** on NEMT benefits.
- Growing elderly population (Baby Boomers) will increase demand significantly.
- Telehealth limitations keep demand for physical transport high for procedures, dialysis, chemo, and similar.

---

## 5. Differentiators of This Open-Source System

| Feature | Most Competitors | This System |
|---|---|---|
| Source code available | ❌ | ✅ Open Source (MIT) |
| Data stays on your device/server | ❌ | ✅ Local-first (localStorage / self-hosted DB) |
| Data shared with third parties | ✅ (common) | ❌ Never |
| CSV bulk import | Rarely in base tier | ✅ Built-in |
| Manual data entry | ✅ | ✅ |
| Cost | \$200–\$2,000/mo | Free / self-hosted |
| Mobile-first responsive UI | Sometimes | ✅ Built-in |
| Offline support | ❌ | ✅ (localStorage mode) |
| HIPAA self-managed | Complex setup | ✅ (data never leaves your infrastructure) |

---

## 6. Recommended Tech Stack (for full deployment)

| Layer | Recommended Tech | Reasoning |
|---|---|---|
| Frontend | Vanilla JS / React | Minimal dependencies; fast; accessible |
| Backend (optional) | Node.js + Express or FastAPI | Lightweight, easy self-hosting |
| Database | SQLite (local) or PostgreSQL | SQLite for single-server; PG for multi-user |
| Auth | JWT + bcrypt (self-hosted) | No third-party identity dependency |
| Routing | OpenRouteService (OSS) | Free, no API key required for self-hosted |
| Maps | Leaflet.js + OpenStreetMap | Free, no API keys needed |
| Notifications | Nodemailer (SMTP) | Self-hosted email |
| Deployment | Docker Compose | Single-command self-hosting |
| Export | CSV, JSON | Standard formats for portability |

---

## 7. Regulatory Considerations

- **HIPAA**: Patient data (PHI) must be protected. Self-hosted deployments give organizations full control.
- **State Medicaid requirements**: Each state has different NEMT billing codes and prior authorization rules.
- **ADA compliance**: UI must be accessible (WCAG 2.1 AA).
- **Driver licensing**: Background check and license verification not handled by scheduling software but should be documented.

---

## 8. UI/UX Recommendations

1. **Mobile-first design** — dispatchers and drivers often use phones/tablets.
2. **Large touch targets** (min 44×44px) for elderly and vision-impaired users.
3. **High-contrast colors** (WCAG AA minimum).
4. **Offline capability** — areas with poor connectivity must still work.
5. **Simple, 3-tap scheduling flow**: Patient → Date/Time → Addresses → Confirm.
6. **Dashboard at a glance**: Today's trips, drivers on duty, pending/completed counts.
7. **Accessible forms** with labels, ARIA roles, and keyboard navigation.

---

*Research compiled: March 2026. Market data from public industry reports.*
