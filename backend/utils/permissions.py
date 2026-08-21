"""Canonical permission catalog and the default role -> permission mapping.

Code checks permission CODES (e.g. "workflow.technical_evaluate"), never role
names. Roles are just named bundles of these codes stored in the database, so a
new role — or an Nth interview panel — is pure data: add the role and map it to
existing permissions, no code change required.

The mapping below is only the *bootstrap default* used by the seeder. Once
seeded, role<->permission assignments live in the DB and can be edited freely.
"""

# code -> human description
PERMISSIONS = {
    # Candidate records
    "candidate.list": "Browse/search the candidate list",
    "candidate.read": "Read a candidate record",
    "candidate.update": "Edit a candidate record (pre-arrival statuses)",
    "candidate.update_any": "Edit a candidate record at any status",
    "candidate.delete": "Delete a candidate record",
    # Workflow actions
    "workflow.reception_forward": "Forward a candidate from reception to HR",
    "workflow.hr_review": "Submit the HR review",
    "workflow.technical_evaluate": "Evaluate an assigned technical round",
    "workflow.ceo_evaluate": "Submit the CEO/final round",
    "decision.final": "Record the final hiring decision",
    # Evaluation visibility scope (used when serializing a candidate)
    "evaluation.view_all": "See every round, log and final decision",
    "evaluation.view_hr": "See HR rounds, logs and (if selected) the decision",
    "evaluation.view_assigned": "See only rounds you are assigned to",
    # Administration
    "user.manage": "Create/update/delete users",
    "role.read": "List roles",
    # Offer Management
    "offer.create": "Create offer for candidate",
    "offer.view": "View offer details",
    "offer.update": "Update offer details",
    "offer.send": "Send offer letter to candidate",
    "offer.approve": "Approve/accept offer",
    "offer.decline": "Decline offer",
    "offer.delete": "Delete an offer",
    # Onboarding
    "onboarding.manage": "Manage onboarding process",
    "onboarding.view": "View onboarding details",
    "onboarding.verify": "Verify documents and background checks",
    "onboarding.allocate": "Allocate IT assets",
    # Email
    "email.send": "Send emails",
    "email.view": "View email history",
    "email.admin": "Administer email system",
    # Notifications
    "notification.view": "View notifications",
    "notification.manage": "Manage notifications",
    # Activity Logs
    "activity.view": "View activity logs",
    # Document Storage
    "document.upload": "Upload documents",
    "document.view": "View documents",
    "document.download": "Download documents",
    "document.delete": "Delete documents",
    # Background Verification
    "bgv.view": "View background verification",
    "bgv.verify": "Run background verification",
    # Scheduler
    "scheduler.admin": "Administer scheduler",
    # Search
    "search.view": "Use search functionality",
    # Reports
    "report.export": "Export reports",
    # Dashboard Alerts
    "dashboard.view": "View dashboard alerts",
}

# Bootstrap default: role name -> set of permission codes.
# NOTE the three technical panels (L1/L2/TECH_HEAD) get the SAME permissions —
# "who evaluates which round" is decided by ASSIGNMENT, not by the role name.
ROLE_PERMISSIONS = {
    "SYSTEM_ADMIN": set(PERMISSIONS.keys()),  # everything
    "HR_ADMIN": {
        "candidate.list", "candidate.read", "candidate.delete",
        "workflow.hr_review", "decision.final",
        "user.manage", "role.read", "evaluation.view_hr",
        # Offer Management
        "offer.create", "offer.view", "offer.update", "offer.send", "offer.delete",
        # Onboarding
        "onboarding.manage", "onboarding.view", "onboarding.verify", "onboarding.allocate",
        # Phase 11
        "email.send", "email.view", "email.admin",
        "notification.view", "notification.manage",
        "activity.view", "document.upload", "document.view",
        "document.download", "document.delete",
        "bgv.view", "bgv.verify", "scheduler.admin",
        "search.view", "report.export", "dashboard.view",
    },
    "HR_PANEL": {
        "candidate.list", "candidate.read",
        "workflow.hr_review", "evaluation.view_hr",
        # Offer & Onboarding view
        "offer.view", "onboarding.view",
        # Phase 11
        "email.view", "notification.view", "activity.view",
        "document.view", "document.upload", "search.view",
        "report.export", "dashboard.view",
    },
    "RECEPTIONIST": {
        "candidate.list", "candidate.read", "candidate.update",
        "workflow.reception_forward",
        "notification.view", "dashboard.view",
    },
    # All technical interviewers share one permission set.
    "L1_PANEL": {
        "candidate.read", "workflow.technical_evaluate",
        "evaluation.view_assigned", "notification.view",
    },
    "L2_PANEL": {
        "candidate.read", "workflow.technical_evaluate",
        "evaluation.view_assigned", "evaluation.view_all", "workflow.ceo_evaluate",
        "notification.view",
    },
    "TECH_HEAD": {
        "candidate.read", "workflow.technical_evaluate",
        "evaluation.view_assigned", "evaluation.view_all", "decision.final",
        # Offer & Onboarding view
        "offer.view", "onboarding.view",
        # Phase 11
        "email.view", "notification.view", "document.view",
        "search.view", "dashboard.view",
    },
    "CEO": {
        "candidate.list", "candidate.read",
        "workflow.ceo_evaluate", "decision.final",
        "evaluation.view_all",
        # Offer Management
        "offer.view", "offer.approve",
        # Onboarding view
        "onboarding.view",
        # Phase 11
        "email.view", "notification.view", "activity.view",
        "document.view", "search.view", "report.export", "dashboard.view",
    },
}
