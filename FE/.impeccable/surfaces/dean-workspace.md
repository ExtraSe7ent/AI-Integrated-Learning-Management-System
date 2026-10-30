---
version: 1
slug: dean-workspace
primary_target: src/Truongkhoa/Overview.tsx
related_targets: [src/Truongkhoa/Layout.tsx, src/Truongkhoa/Courses.tsx, src/Truongkhoa/ClassDetail.tsx, src/Truongkhoa/Alerts.tsx, src/styles/dean.css]
---
# Faculty monitoring extension
MODE: operate

## Direction contract
THESIS: A faculty view compares course completion and points to specific classes needing support. Inherit Campus agenda and table navigation; no new visual identity or marketing panels.
OWN-WORLD: Existing red #a4262c actions/selection, white sidebar/panels, warm #f7f6f2 ground, Be Vietnam Pro and Lucide. Wider 12–14px table labels support faculty scanning. Preserve both VJU logos.
STORY: Dean signs in, scopes the term, spots a course needing attention, opens its classes, then the students and reasons. Read-only monitoring; alerts explain thresholds.
FIRST VIEWPORT: 238px white sidebar; 73px toolbar; title/term filter; compact totals; course comparison table with completion bars and adjacent support summary. The bar-to-row relationship is the signature, not decorative charts.
FORM: Extension of existing sidebar/table layout; no concept roll needed for this precisely scoped addition. Figma editable frames precede source UI; no raster UI or image comp.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
