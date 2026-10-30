# Implementation Plan: VJU Learning
**Date**: 2026-10-16 · **Spec**: spec.md

## Summary
React/TypeScript/Vite SPA, native CSS, role-scoped routes. Local demo state provider implements shared learning/teaching workflows; service boundary can later be replaced with Java APIs. Use self-hosted Be Vietnam Pro, Lucide icons, QRCode for genuine join-link QR, ExcelJS for actual XLSX exchange. Do not add backend scaffolding.

## Constitution Check
Every change remains under FE. Existing reference folders stay intact. All 109 requirements are mapped, backend boundaries disclosed. Shared components have role-specific composition; UI uses semantic elements and no fake clickable placeholders.

## Structure
src/Sinhvien: student dashboards, courses, study, assignments, live polling.
src/Giangvien: lecturer dashboard, lesson/session/question/assignment management, live results, monitoring.
src/shared: layout, controls, communication, resources, grades, account pages.
src/data: typed synthetic fixtures, shared local demo provider and pure learning rules.
src/styles: design tokens and responsive CSS.
docs: source requirement traceability, screen inventory and verification evidence.

## Delivery sequence
Foundation → student study slice → lecturer authoring → assessment and feedback → responsive browser verification → native Figma screens.

## Validation
Vitest for state rules. Browser integration tests and screenshots via bundled Playwright (Chrome DevTools MCP is not configured). Build with tsc and Vite. Fresh-context Impeccable finish review uses desktop/mobile screenshots; componentized Figma construction uses code-derived geometry and text with source images only for logos.
