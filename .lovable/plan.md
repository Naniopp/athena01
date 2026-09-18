# Simple signup + role-specific setup for ATHENA

The bootstrap owner flow already works (owner setup screen, instant Super Admin, locked-once-done, database-decided roles). This plan covers what is still missing: a short signup, a proper onboarding journey per role, a waiting screen for roles that need approval, and sign-in that always sends people to the right place.

## 1. Short signup

Signup keeps the role choice screen, then asks only: full name, email, password, confirm password, optional phone. Button: "Create Account".

Role cards read:
- Join as Student
- Join as Faculty
- Request HOD Access
- Request Administrator Access
- Super Admin — "Reserved for the ATHENA institution owner and authorised system administrators." Not selectable.

The old "you start as a student until a super admin confirms it" line is gone.

## 2. Setup / onboarding after the account exists

New multi-step setup pages with a progress indicator, "Save & Continue" and "Save & Exit":

- Student: personal, academic (roll no, department, program, year, semester, section), interests and skills, preferences.
- Faculty: personal, professional (employee ID, designation, qualification, specialisation, experience), teaching details, expertise.
- HOD: personal, professional, department details, then submits for approval.
- Administrator: personal, professional, responsibilities and reason for access, then submits for approval.
- Super Admin (owner): institution details, then add departments/programs/sections dynamically, then platform preferences. Optional steps can be skipped.

Progress is saved as the user goes, so setup can be resumed later. Optional fields can be skipped and show up later as a profile-completion percentage.

## 3. Waiting screen

HOD and Administrator requests land on a "Pending approval" screen after setup, explaining that a Super Admin is reviewing. Approval already happens on the Super Admin Approvals page; once approved, the next sign-in goes to the matching dashboard.

## 4. Sign-in routing

After sign-in: read the account's real role from the database, then
1. setup not finished → its setup page,
2. finished but awaiting approval → pending approval screen,
3. otherwise → that role's dashboard.

Nobody can gain a role by picking it on screen; the account record decides.

## 5. Existing accounts

Accounts created before this change are treated as "setup not finished" and get walked through their setup once. No data is deleted, no duplicate accounts.

## Technical notes

- Migration: add `onboarding_status` (not_started/in_progress/completed) and `setup_data` jsonb to `profiles`; extend `approval_status` usage to `not_required`; add role detail tables `student_profiles`, `faculty_profiles`, `hod_profiles`, `admin_profiles` with owner-scoped RLS plus staff read access, and GRANTs for `authenticated`/`service_role`.
- Server functions in `src/lib/rbac/onboarding.functions.ts`: `getOnboardingState`, `saveOnboardingStep`, `completeOnboarding` (creates the approval request for hod/admin), all behind `requireSupabaseAuth`; role writes stay server-side.
- Routes: `src/routes/signup.tsx` slimmed; `setup.$role.tsx` (student/faculty/hod/administrator/super-admin steps), `pending-approval.tsx`; `src/routes/dashboard.index.tsx` and `login.tsx` gate on onboarding + approval state. Existing `/setup` owner bootstrap screen stays as-is.
- Institution/academic structure editing from Super Admin setup reuses `departments`, `programs`, `sections` tables through admin server functions.
- Each new route gets its own `head()` metadata.

## Not in this pass

Deep Super Admin sections that are still stubs (security centre, audit log viewer, system configuration, integrations) — those come next if you want them.
