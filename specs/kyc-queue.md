# KYC Review Queue
Roles: analyst (sees cases in assigned regions), senior_reviewer (sees all, may resolve escalations), admin (manages assignments).
Entity KycCase: id, customer_name, customer_email, region, risk_score (0-100), status, assigned_to, sla_due_at, created_at.
States: pending -> in_review -> approved | rejected | escalated. escalated -> approved | rejected (senior_reviewer only).
Every transition requires a reason and writes an audit row.
Views: queue (filter status/region, sort by sla_due_at, overdue highlighted), case detail with transition buttons gated by role, audit tab.
API: GET /api/audit?caseId= returns audit rows for the case.
Seed: 40 cases across 3 regions; users: one per role.
