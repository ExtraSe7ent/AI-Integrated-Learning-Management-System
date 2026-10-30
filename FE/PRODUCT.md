# VJU Learning
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React + TypeScript + Vite, accepted after discussion. Plain CSS. Future backend: Java; no backend or real AI in this delivery.

## Users
Vietnamese university students preparing before class, participating during class and reviewing afterwards; lecturers preparing lessons, supervising study, grading and resolving questions; deans monitoring faculty completion and students needing support; course leaders standardizing slide, quiz and assignment content across classes of their assigned courses.

## Product Purpose
An online LMS combining flipped classroom workflows and AI assistance. Deliver a working frontend with realistic, explicitly synthetic data and editable Figma screens.

## Operating Context
Frequent desktop work; student tasks must also work on phones. Four roles, Sinhvien, Giangvien, Truongkhoa and Truongnhomhp, have separate directories and navigation. The product is an Operate interface: task completion, clarity and consistent controls outrank decoration.

## Capabilities and Constraints
The 65 student, 44 lecturer, 4 Dean (Trưởng khoa, B2:I5) and 8 CourseLeader (Trưởng nhóm HP, B2:I9) checklist items in ../SRS_Checklist_Flipped_Classroom.xlsx define feature scope. Demo and Images_demo are discarded visual references and evidence of workflows, not a design to copy. Local simulation cannot provide authentication, server authorization, multi-user real time, genuine AI, email or persistent uploaded files; identify those boundaries clearly. No registration: accounts issued by administration per checklist. Dean monitoring covers TK-01–TK-04: assigned-role login, faculty overview, course → class drill-down, completion and support alerts. This is read-only faculty monitoring over representative local rosters. Trưởng nhóm HP / CourseLeader covers TN-01–TN-08: assigned-course class lists, actual content review/comparison, M0–M3 levels, lecturer adjustment/reply/re-review, gated class completion and permission-checked basic text/reference authoring. Its browser-local coordination registry is separate from the older lecturer lesson/question/assignment stores; it does not provide their full rich authoring/import/AI capabilities. M0 Chưa rà soát, M1 Đang xử lý, M2 Cần điều chỉnh and M3 Đạt chuẩn are the confirmed workflow definition for this delivery, not an official rule supplied by the workbook. Admin screens and the Java backend remain deferred; no separate Trưởng bộ môn role is introduced.

## Brand Commitments
Red with white/warm beige. Use both supplied VJU logos without recoloring or distortion. Vietnamese copy. Name VJU Learning is a working UI label, not an official institution product claim.

## Evidence on Hand
../Logo/Long_logo.jpg, ../Logo/Short_logo.jpeg; ../Demo; ../Images_demo; workbook checklist. Figma destination: l4noECFoQ384scu1ZIHeM8.

## Product Principles
- Put the next learning or teaching action before decorative statistics.
- Keep the class and lesson context visible throughout learning.
- AI assists; students can inspect sources and lecturers review generated material.
- Shared design tokens and components connect role-specific workspaces.

## Accessibility & Inclusion
Vietnamese-supporting typeface, readable contrast, labeled controls, keyboard navigation, responsive screens, reduced-motion support.
