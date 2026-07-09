# sap_scorecard_data.py
# Contains verbatim mappings of SAP Interview scorecards from SAP_Technical_Interview_Sheets.xlsx

RATING_SCALE = [
    "Good",
    "OK",
    "Basic",
    "Has knowledge (not worked)",
    "Not worked",
    "Bad"
]

OVERALL_ASSESSMENT_FIELDS = [
    "Implementation experience (no. of full-cycle projects)",
    "Support / AMS experience",
    "GST / statutory exposure",
    "HANA / S/4HANA background",
    "Communication skill",
    "Attitude & learnability",
    "Final remark / recommendation"
]

HR_CEO_DIMENSIONS = [
    "Communication & Articulation",
    "Confidence & Poise",
    "Technical / Domain Knowledge",
    "Attitude & Ownership Mindset",
    "Empathy & Team Orientation",
    "Problem-Solving Approach",
    "Cultural Fit & Values Alignment"
]

SAP_DOMAINS = ["FI", "CO", "MM", "SD", "PP", "QM", "PM", "WM", "HCM", "BASIS"]

SAP_TOPICS = {
    "FI": [
        "Accounting entries — basic postings & sub-ledger logic",
        "Chart of Accounts — importance and how it is finalised with the client",
        "MM-FI integration — OBYC: BSX, PRD, GBB / Valuation Class / mvt 261, 101",
        "FI-SD integration — VKOA: MM & customer account assignment group, accounting key, SD condition type",
        "GST — configuration & day-to-day handling",
        "Profit Centres — use for FI org. structure",
        "Profit Centres — use for product-line / segment profitability",
        "Taxes in SAP — tax code, condition record, tax procedure, access sequence (OB40)",
        "Bank reconciliation — manual & electronic (EBS)",
        "Data migration — assets, excise & other balances, stock balances",
        "ABAP awareness — BDC, LSMW, custom programs",
        "Withholding tax (TDS) — how it works",
        "Document splitting",
        "Depreciation areas and keys",
        "Parallel ledger / ledger approach",
        "Automatic Payment Program (APP / F110)",
        "Foreign currency valuation",
        "House bank — created or transported to PRD? Anything to be created directly on PRD",
        "S/4HANA & HANA background — Universal Journal (ACDOCA), New Asset Accounting",
        "Funds Management"
    ],
    "CO": [
        "Cost element accounting — primary vs secondary, S/4 cost elements as GL",
        "Cost centre accounting — hierarchy, assessment, distribution cycles",
        "Internal orders — real vs statistical, settlement rules",
        "Product costing — cost component structure, costing variant, costing sheet",
        "Material Ledger / Actual Costing",
        "CO-PA — costing-based vs account-based; characteristics & value fields",
        "Profit centre accounting",
        "Activity types & activity price planning / overhead calculation",
        "Production order costing — plan vs actual, variance categories",
        "Variance calculation & settlement",
        "Results analysis / WIP",
        "CO-FI integration — reconciliation, Universal Journal impact",
        "Planning — cost centre plan, integrated planning",
        "S/4HANA impact on CO (margin analysis, ACDOCA)"
    ],
    "MM": [
        "Procure-to-Pay cycle — PR > RFQ > PO > GR > IR",
        "Material types & material master field selection",
        "MM-FI integration — OBYC, valuation classes, automatic account determination",
        "Pricing — calculation schema, condition technique, access sequence",
        "Release strategy (PR/PO) — class, characteristics",
        "Split valuation",
        "Special procurement — subcontracting, consignment, STO, third-party",
        "Inventory management — movement types (101, 103/105, 122, 261, 311, 561)",
        "Physical inventory",
        "Batch management",
        "MRP — run types, lot sizing, MRP areas, planning file",
        "Source determination — source list, quota arrangement, info records",
        "Output / message determination",
        "Logistics Invoice Verification — GR/IR clearing, blocked invoices",
        "Service procurement & service entry sheet",
        "GST / taxes in procurement",
        "Vendor master / Business Partner (BP)",
        "ABAP / LSMW awareness for migration"
    ],
    "SD": [
        "Order-to-Cash cycle end to end",
        "Sales document types, item categories, schedule line categories",
        "Pricing — condition technique, pricing procedure, access sequence, condition records",
        "SD-FI integration — VKOA, revenue account determination",
        "SD-MM integration — availability check (ATP), delivery, PGI",
        "Copy control (sales > delivery > billing)",
        "Credit management (FSCM / classic)",
        "Output determination",
        "Free goods / bonus",
        "Rebates / settlement management (S/4)",
        "Billing — types, billing plan, invoice list, intercompany billing",
        "Taxes / GST in sales",
        "Returns, credit & debit memo processing",
        "Partner & text determination",
        "Batch determination in SD",
        "Inter-company / STO sales"
    ],
    "PP": [
        "Master data — BOM, routing, work centre, production version",
        "Manufacturing types — discrete vs repetitive vs process (PP-PI)",
        "Planning strategies — MTS / MTO, strategy groups",
        "Demand management / PIR",
        "MRP run — outputs, planned orders, exception messages",
        "Capacity planning & levelling",
        "Production order lifecycle — create, release, confirm, TECO, settle",
        "Backflushing",
        "Goods movements (261 issue, 101 receipt) & PP-MM-FI integration",
        "Production order costing & variance",
        "Process orders / PI sheets (PP-PI)",
        "Kanban / repetitive manufacturing",
        "Engineering change management",
        "PP-QM integration — in-process inspection",
        "S/4HANA — pMRP, advanced available-to-promise"
    ],
    "QM": [
        "QM in procurement — inspection at goods receipt",
        "QM in production — in-process inspection",
        "QM in sales — inspection before delivery",
        "Inspection lot processing — inspection lot origins",
        "Inspection plan, master inspection characteristics (MIC), sampling procedure",
        "Results recording & usage decision (UD)",
        "Quality notifications — defects, customer/vendor complaints",
        "Quality certificates / Certificate of Analysis",
        "Batch management integration",
        "Quality info records (procurement / SD)",
        "Vendor evaluation — QM score",
        "Calibration / test equipment management (QM-PM)",
        "Stability study (pharma relevance)",
        "Dynamic modification rule",
        "Catalogs, code groups & selected sets"
    ],
    "PM": [
        "Technical objects — functional location, equipment, equipment BOM",
        "Maintenance processing — notification > order > confirmation > settlement",
        "Preventive maintenance — maintenance plan, task list, scheduling",
        "Corrective / breakdown maintenance",
        "Refurbishment & external services",
        "PM-MM integration — spares, reservations, PR from order",
        "PM-CO integration — order settlement to cost centre / asset",
        "Measuring points & counters",
        "Maintenance strategies — time-based & performance-based",
        "Calibration (PM-QM)",
        "Capacity planning for maintenance",
        "Catalogs / damage & cause codes",
        "S/4HANA Asset Management & mobile maintenance"
    ],
    "WM": [
        "WM vs EWM — embedded vs decentralised; when to use each",
        "Warehouse structure — storage types, sections, bins",
        "Putaway & stock removal strategies",
        "Transfer orders (WM) / warehouse tasks & orders (EWM)",
        "Replenishment",
        "Physical inventory in WM / EWM",
        "Handling unit management",
        "RF framework / radio frequency",
        "WM-MM-PP integration — production supply / staging",
        "Wave management (EWM)",
        "Slotting & rearrangement (EWM)",
        "Labour management (EWM)",
        "Yard management",
        "Migration — ERP-WM to embedded EWM"
    ],
    "HCM": [
        "Organisational management — org units, positions, jobs",
        "Personnel administration — infotypes, personnel actions",
        "Time management — positive vs negative",
        "Payroll — schema, PCRs, wage types",
        "India payroll — PF, ESI, PT, income tax / statutory compliance",
        "SuccessFactors Employee Central",
        "SF Recruiting / Onboarding",
        "Performance & Goals, Compensation",
        "Learning (LMS)",
        "EC <> S/4HANA / ERP replication",
        "Integration — Integration Center / CPI / boomi"
    ],
    "BASIS": [
        "System landscape — DEV / QAS / PRD, transport management (STMS)",
        "Client administration & client copy",
        "User administration, roles & authorisations (PFCG)",
        "Transport requests — workbench vs customising",
        "Background jobs, spool & system monitoring",
        "HANA database fundamentals",
        "ABAP — reports, BDC, BAPIs, BADIs, enhancements, user exits",
        "RICEF objects — reports, interfaces, conversions, enhancements, forms",
        "Smartforms / Adobe Forms / Fiori basics",
        "OData / CDS views (S/4 & Fiori awareness)",
        "Performance tuning awareness"
    ]
}
