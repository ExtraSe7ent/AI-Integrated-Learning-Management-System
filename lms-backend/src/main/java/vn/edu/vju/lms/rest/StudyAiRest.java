package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Aid;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidCreate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidGenerateRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplainRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Explanation;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplanationUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Insights;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.InsightsRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeExplanationWrapper;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ReviewRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ReviewState;

@Tag(name = "AI lớp học đảo ngược")
@RequestMapping("/api/ai")
@PreAuthorize("isAuthenticated()")
public interface StudyAiRest {

    String STAFF = "hasAnyRole('ADMIN','LECTURER','COURSE_LEADER')";

    @Operation(summary = "Bài giảng AI theo trang; sinh viên chỉ thấy bản đã công bố")
    @GetMapping("/lessons/{courseId}/explanations")
    ResponseEntity<List<Explanation>> explanations(@PathVariable String courseId);

    @Operation(summary = "AI soạn nháp Bài giảng AI (Ý chính / Ví dụ / Tóm tắt) từ học liệu đã lập chỉ mục")
    @PreAuthorize(STAFF)
    @PostMapping("/lessons/{courseId}/explanations/generate")
    ResponseEntity<List<Explanation>> generateExplanations(@PathVariable String courseId,
            @RequestBody(required = false) ExplainRequest request);

    @Operation(summary = "Sửa, tự viết hoặc công bố Bài giảng AI của một trang")
    @PreAuthorize(STAFF)
    @PutMapping("/lessons/{courseId}/explanations/{page}")
    ResponseEntity<Explanation> updateExplanation(@PathVariable String courseId, @PathVariable int page,
            @Valid @RequestBody ExplanationUpdate update);

    @Operation(summary = "Gợi ý buổi học trên lớp từ câu sai và kiến thức mờ")
    @PreAuthorize(STAFF)
    @PostMapping("/insights")
    ResponseEntity<Insights> insights(@RequestBody(required = false) InsightsRequest request);

    @Operation(summary = "Giải thích vì sao một câu đã nộp bị sai, có dẫn nguồn học liệu")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/mistake-explanation")
    ResponseEntity<MistakeExplanationWrapper> explainMistake(@Valid @RequestBody MistakeRequest request);

    @Operation(summary = "Thẻ ôn và FAQ của học phần; sinh viên chỉ thấy bản đã công bố kèm lịch ôn")
    @GetMapping("/aids")
    ResponseEntity<List<Aid>> aids(@RequestParam(required = false) String courseId, @RequestParam(required = false) String kind);

    @Operation(summary = "AI soạn tối đa 5 thẻ ôn hoặc FAQ nháp, mỗi mục có trích dẫn nguyên văn")
    @PreAuthorize(STAFF)
    @PostMapping("/aids/generate")
    ResponseEntity<List<Aid>> generateAids(@Valid @RequestBody AidGenerateRequest request);

    @Operation(summary = "Giảng viên tự viết thẻ ôn hoặc FAQ")
    @PreAuthorize(STAFF)
    @PostMapping("/aids")
    ResponseEntity<Aid> createAid(@Valid @RequestBody AidCreate request);

    @Operation(summary = "Sửa hoặc công bố thẻ ôn/FAQ")
    @PreAuthorize(STAFF)
    @PutMapping("/aids/{id}")
    ResponseEntity<Aid> updateAid(@PathVariable String id, @Valid @RequestBody AidUpdate update);

    @Operation(summary = "Xóa thẻ ôn/FAQ")
    @PreAuthorize(STAFF)
    @DeleteMapping("/aids/{id}")
    ResponseEntity<Void> deleteAid(@PathVariable String id);

    @Operation(summary = "Ghi kết quả ôn một thẻ và lên lịch lần ôn tiếp theo")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/aids/{id}/review")
    ResponseEntity<ReviewState> review(@PathVariable String id, @RequestBody ReviewRequest request);
}
