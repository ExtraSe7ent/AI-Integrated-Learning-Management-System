# Feature Specification: Trưởng nhóm HP

Created: 2026-10-24 · Status: confirmed scope · No Git repository present.

## User Scenarios & Testing

### 1. Rà soát các lớp cùng học phần (P1)
CourseLeader signs in using an assigned account, selects an assigned course, opens one class and inspects actual slide, quiz and assignment content. Compare the same content type across two distinct classes of that course. A class outside the assigned course must not be exposed.

### 2. Yêu cầu điều chỉnh và kiểm tra lại (P1)
Open a material, record a precise request, and move it to M2. The owning lecturer sees the request, updates its content and replies; the item returns to M1. The reviewer can then mark M3. Changes invalidate the class's completed standardization marker. A pending unanswered request cannot be approved silently.

### 3. Hoàn thành chuẩn hoá và biên soạn (P2)
A class can be marked complete only when it contains slides, quiz and assignment, all are M3, and no open adjustment remains. Direct editing is available only for editable items. Create/edit class content and course references inside the CourseLeader workspace. Personal profile and notification popup follow the incumbent shell.

### Edge cases
Unknown/unassigned class or course; no search match; one-class comparison; identical comparison selections; whitespace-only request/content; read-only item; editing a completed class; missing content type; reload; older saved browser data; wrong-role route; hidden mobile navigation.

## Requirements
Source: ../SRS_Checklist_Flipped_Classroom.xlsx, Trưởng nhóm HP B2:I9.
- TN-01: Đăng nhập với role CourseLeader.
- TN-02: Danh sách các lớp cùng học phần.
- TN-03: Rà soát slide, quiz, đề bài tập từng lớp.
- TN-04: So sánh giữa các lớp, yêu cầu GV điều chỉnh.
- TN-05: Cụ thể hoá mức xử lý M0–M3.
- TN-06: Đánh dấu "Hoàn thành chuẩn hoá".
- TN-07: AF-1: Sửa trực tiếp nội dung nếu có quyền.
- TN-08: Tạo / sửa nội dung, bài tập, tài liệu như GV.

### Key entities
Assigned course, class, class material with kind/body/revision/edit permission/review level, adjustment request with lecturer reply, completion marker, course reference, independent profile.

## Success Criteria
All eight checklist items have reachable interface/actions and explicit local boundaries. Two distinct classes can be compared without losing course context. Requests round-trip to the owning lecturer and survive reload. Completion is gated by content/review state and invalidated by a subsequent change. Existing three-role tests remain passing. Desktop design frames are editable and arranged left to right/top to bottom.

## Assumptions
User explicitly chose the name and functions Trưởng nhóm HP, not a new Trưởng bộ môn role. User proposed and this implementation uses M0 Chưa rà soát, M1 Đang xử lý, M2 Cần điều chỉnh, M3 Đạt chuẩn; 2a/2b is not used. This is a local workflow definition, not a missing official SRS rule. Scope is two assigned representative courses and three classes, local persistence and simulated account/permissions; Java APIs remain deferred. No new global visual identity or mobile Figma frames. Existing VJU assets and red/white/beige Operate design remain binding.
