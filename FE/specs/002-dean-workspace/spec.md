# Feature Specification: Trưởng khoa — giám sát toàn khoa

Created: 2026-10-24. Status: Approved scope from supplied workbook. No Git repository; no branch created.

## User Scenarios & Testing

### User Story 1 — Đăng nhập Dean (P1)
Given account TK001, when signing in through the common login, then open /truong-khoa/tong-quan. Reload preserves account; student/lecturer URLs redirect to the Dean workspace; sign-out clears the session.

### User Story 2 — Giám sát và drill-down (P1)
Given faculty course statistics, when opening a course then a class, then show only matching classes/students and retain semester context on back navigation. Search/filter changes all visible totals consistently. Invalid IDs have a recovery link.

### User Story 3 — Cảnh báo học tập (P1)
Given class completion/grades, show faculty-wide support counts and filterable student-class alerts. Each alert explains its reason and opens its own class. Empty results show a reset action. Read-only monitoring never changes a grade or deletes a class.

## Requirements

| Source ID | Workbook requirement, verbatim | Frontend acceptance |
| --- | --- | --- |
| TK-01 | Đăng nhập với role Dean | Account-assigned role; protected Dean routes |
| TK-02 | Tổng quan toàn khoa | Course/class/student counts and weighted completion from displayed rosters |
| TK-03 | Drill-down: học phần → lớp | Course catalogue → course classes → class students; contextual back navigation |
| TK-04 | Mức hoàn thành, cảnh báo SV yếu toàn khoa | Completion and support signals per course/class/student; scoped filters |

Source: ../SRS_Checklist_Flipped_Classroom.xlsx, sheet Trưởng khoa, B2:I5. The old-system status column is not evidence about this frontend.

### Key Entities
Dean account; semester; course; class; enrollment; support alert. Unique students and enrollment counts are distinct; faculty support count deduplicates student IDs while alerts retain class context.

### Assumptions and boundaries
Extend the existing Operate system and common account/profile/bell patterns. Monitoring only: no invented Admin CRUD, faculty restructuring, editing grades, AI reports or CourseLeader approval workflow. Reuse lecturer progress threshold <50%; grade <5 is an additional explainable local signal, not an institutional decision. Rules documented in UI and technical notes. Actual policy will come from Java API. Semester has current fixture term and an empty term to verify empty states; no fabricated historical trend. CSE301.01 derives sv1 progress/result from existing student state; other enrollment data are synthetic. No API or real authentication. Desktop Figma only; code remains responsive.

## Success Criteria
All four source requirements have executable checks; figures derive from the currently scoped rows, filters cannot leak other classes; empty/invalid routes recover; existing student/lecturer tests remain green. Figma designs exist before Dean UI implementation and remain editable. Build, unit tests, browser flows and finish review complete.
