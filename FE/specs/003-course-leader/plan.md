# Implementation Plan: CourseLeader
2026-10-24 · Spec: [spec.md](spec.md)

## Summary
Native Figma designs first, then implement the existing React/TypeScript/Vite/plain CSS stack. Keep role screens in src/Truongnhomhp. Reuse shared UI primitives and incumbent tokens/assets. Add only a narrow request/reply panel to the lecturer's existing lesson page for the authorized handoff.

## Constitution Check
Exact TN IDs tracked; source workbook/Demo/Images_demo/Logo unchanged. No backend/AI claims. Editable native Figma, role-assigned login and independent navigation. Existing roles retained. Git was checked and is absent; do not initialize or commit.

## Data and verification
One typed coordination state in the existing local persistence provider; pure permission/review/request/completion operations with failing tests before implementation. Independent course-scoped material records, explicit fixture boundaries. Unit test scoped IDs, protected edit, pending requests, missing content, completion invalidation. Browser tests exercise sign-in, comparison, cross-role request/reply, editing, completion, profile and narrow-width keyboard/overflow. Run full regression/build once final implementation is ready; inspect settled browser/Figma captures in bounded passes, detector once, independent finish review and documentation handoff.
