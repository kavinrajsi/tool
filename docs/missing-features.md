# Missing Features — Priority List

## Critical Bugs (Fix Immediately)

- [ ] **Employee registration bypasses API route** — register form calls Supabase directly, so HR notification email is never sent (`employees/register/page.js`)
- [ ] **Leave balance never incremented on approval** — `used_days` decremented on rejection but never incremented on approval (`api/leaves/admin/[id]/route.js`)
- [ ] **Onboarding date comparison broken** — compares ISO date against DD-MM-YYYY stored text, onboarding list always empty (`onboarding/page.js`)
- [ ] **Employee detail page raw storage paths** — PAN/Aadhaar/Resume documents 403 because raw paths used instead of signed URLs (`employees/[id]/page.js`)
- [ ] **MCP tool wrong column names** — selects `start_date, end_date` but actual columns are `from_date, to_date` (`api/mcp/route.js`)
- [ ] **Employee list sends sensitive data** — `select("*")` sends PAN, Aadhaar, bank details to every browser (`employees/page.js`)

## Broken / Dead Features

- [ ] **Leave type selection UI absent** — no type picker, `leave_type_id` always null, leave types/balances tables unused (`leaves/page.js`)
- [ ] **WIP limit non-functional** — `todo_count` and `over_wip` hardcoded to null/false, WIP limit can be set but never used (`api/capacity/route.js`)
- [ ] **Employee status toggle inconsistent** — sets status to `""` instead of `"active"` (`employees/page.js`)

## Data Integrity Issues

- [ ] `employees.department` is plain text, no FK to `departments` — renaming/deleting a department orphans employees
- [ ] `candidates.status` is plain text, no FK to `candidate_statuses` — same orphan problem
- [ ] `engagement_responses` unique constraint is `(question_id, employee_id)` instead of `(survey_id, question_id, employee_id)` — reusing a question across surveys overwrites responses
- [ ] `holidays.date` format inconsistent — hr-calendar uses DD-MM-YYYY, holidays page uses YYYY-MM-DD
- [ ] Dual role system — `employees.role` column and `employee_roles` table coexist with no sync

## Architecture Issues

- [ ] **Admin check duplicated in 8+ files** — identical role check expression copy-pasted, no shared utility
- [ ] **Hardcoded company references** — `hr@madarth.com`, `"Sent from Madarth HR"`, `@madarth.com` scattered across files
- [ ] **Onboarding tasks hardcoded** — 16 tasks defined as a constant array, not configurable from DB

---

## High Priority

- [ ] **Leave type picker** in the leave application form
- [ ] **Leave balance display** on employee's leave page
- [ ] **Leave balance allocation UI** for admins
- [ ] **Holidays excluded from business day count** in leave calculations
- [ ] **Manager/reports-to hierarchy** — add `manager_id` column for org chart
- [ ] **Candidate creation UI** — no "Add Candidate" button exists
- [ ] **Email notifications** — for leave requests, performance review completion, new surveys
- [ ] **Employee photo/avatar upload** — on profile and shown across org chart, employee list, detail page

## Medium Priority

- [ ] **Designation management** — no dedicated table, pulled from existing employee records
- [ ] **Employee number auto-generation** — note says "Auto-generated if left blank" but no logic exists
- [ ] **Performance goal weighted scoring** — weights exist in schema but aren't used in calculations
- [ ] **Historical performance view** per employee across review cycles
- [ ] **Survey deadlines/expiry** for engagement surveys
- [ ] **Leave email to HR** when a leave request is submitted
- [ ] **Approved leaves on HR calendar**
- [ ] **Candidate drag-to-reorder** in Kanban view

## Low Priority

- [ ] **Bulk employee actions** — export CSV, bulk activate/deactivate
- [ ] **360-degree peer reviews** in performance management
- [ ] **Announcement targeting** — by department or role
- [ ] **Rich text announcements** — Markdown/HTML support
- [ ] **Real-time updates** via Supabase subscriptions across HR pages
- [ ] **Department head assignment** — head-of-department field
- [ ] **Employee count per department** shown on departments page
- [ ] **Org chart PDF/PNG export**
- [ ] **Notification/preference section** on profile page
- [ ] **Survey duplication/templating** for engagement
- [ ] **Question reordering** in engagement surveys
- [ ] **Email template placeholder expansion** — only `{{name}}` supported, no `{{position}}`, `{{company}}`
- [ ] **Email preview** before sending to candidates
- [ ] **Candidate search across archived/converted** candidates
- [ ] **Individual note deletion** in candidate notes
- [ ] **Year-end leave balance carryover**
- [ ] **Onboarding task completer tracking** — who marked each task done
- [ ] **Onboarding completion notification** via email
