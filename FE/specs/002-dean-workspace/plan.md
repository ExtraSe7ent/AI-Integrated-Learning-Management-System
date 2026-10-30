# Implementation Plan: Dean workspace

Date: 2026-10-24. React/TypeScript/Vite/plain CSS; no new dependencies.

## Constitution Check
Preserve original Excel, logos and the existing two workspaces. Workbook IDs TK-01–TK-04 define scope. Existing architecture: account fixture lookup and client route guard; DemoProvider local state; shared UI primitives. No server authorization claims. Figma native layers first, code second.

## Slices and verification
1. Inspect Figma components/tokens and create native Dean frames; verify typography, images, hierarchy and screenshot. Read back design context before implementation.
2. Add derived roster/aggregation logic and account route; test unique counts, weighted averages, thresholds and account boundaries.
3. Implement src/Truongkhoa: overview, courses, course/classes, class/roster, alerts, profile and shared Dean shell. Use scoped CSS and existing UI primitives; keep current Layout untouched.
4. Verify drill-down/filter/context, profile persistence, notification dismissal, empty/invalid states and responsive overflow; run existing regressions and build.
5. Finish review and documentation; persist Figma IDs and exact implementation/fixture boundaries.

## Structure
src/Truongkhoa/{data.ts,data.test.ts,Layout.tsx,Overview.tsx,Courses.tsx,ClassDetail.tsx,Alerts.tsx,UI.tsx}; src/styles/dean.css; tests/dean.spec.ts. Reuse shared HoSo and account routing with an additional typed role/profile. No speculative service layer or chart dependency.
