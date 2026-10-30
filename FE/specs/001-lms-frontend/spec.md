# Feature Specification: VJU Learning frontend
**Created**: 2026-10-16 · **Status**: Implementing · **Feature**: 001-lms-frontend

## User Scenarios & Testing
### US1 — Learn before class (P1)
A student chooses a course, resumes a study session, reads pages, answers required questions, asks the simulated assistant with visible source references, and records unclear concepts. Answering incorrectly still permits progression after confirmation. Completed and late sessions remain reviewable.
Acceptance: cannot advance a required question before answering; refresh retains confirmed progress; deadline state determines whether completion earns self-study credit.

### US2 — Prepare and supervise teaching (P1)
A lecturer manages lesson order, drafts and publishes learning materials/questions, schedules sessions, reviews suggested questions, follows student progress and exports grades.
Acceptance: a lesson with student activity cannot be deleted; AI drafts require human review before publishing; published changes appear in the local student view.

### US3 — Participate and assess (P1)
Students join a class poll using a code, submit answers, take timed assignments and inspect results. Lecturers reveal poll results and review essay grade drafts. Student appeals enter a queue and lecturer decisions are visible in results.
Acceptance: incorrect session code fails; missing answers are recorded when time expires; quiz autosubmits; a grade appeal recalculates the affected average.

### US4 — Communicate and review (P2)
Students send categorized feedback with at most five images totaling 5 MB, browse resources and review grades. Lecturers respond and resolve feedback and unclear concepts.
Acceptance: upload constraints are validated; responses persist locally; empty search gives a recovery action.

## Requirements
All 109 source rows are recorded in docs/requirements.md with their exact source codes and target route. These codes are requirement IDs, not screen IDs. Design role-specific navigation; use both VJU logos; red/white/beige palette; Vietnamese copy; responsive desktop/mobile; keyboard-operable controls. Native Figma layers, not whole-screen raster images.

## Boundaries
No backend, no real login/authorization, no real model, no email, no cross-device real-time service. Demo login offers both roles. Local simulation and synthetic data are disclosed. Uploads retain metadata only across reloads. The source SRS document is absent: undefined M0–M3 and conflicting rules are not invented.

## Success Criteria
Type checking and production build pass; tests cover progression, scoring, deadline boundaries and attachment limits; browser checks exercise student/lecturer flows at desktop and mobile; Figma contains editable role-organized screens and reusable foundations. Report exact limitations rather than treating mock behavior as backend completion.
