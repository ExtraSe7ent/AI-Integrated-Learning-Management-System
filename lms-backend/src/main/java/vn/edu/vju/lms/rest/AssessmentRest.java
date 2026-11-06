package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.edu.vju.lms.ai.EssayGrader;
import vn.edu.vju.lms.wrapper.AssessmentWrapper;

@Tag(name = "Làm bài và chấm bài")
@RequestMapping("/api/assessments")
@PreAuthorize("isAuthenticated()")
public interface AssessmentRest {

    @Operation(summary = "Bài làm mà người dùng được xem, theo mã bài tập")
    @GetMapping
    ResponseEntity<Map<String, AssessmentWrapper>> list();

    @Operation(summary = "Sinh viên bắt đầu/lưu/nộp bài; giảng viên chấm bài")
    @PutMapping("/{assignmentId}")
    ResponseEntity<AssessmentWrapper> save(@PathVariable String assignmentId, @RequestBody AssessmentWrapper wrapper);

    @Operation(summary = "Danh sách bài nộp của một bài tập")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @GetMapping("/{assignmentId}/submissions")
    ResponseEntity<List<AssessmentWrapper>> submissions(@PathVariable String assignmentId);

    @Operation(summary = "Gợi ý chấm câu tự luận của một bài nộp, chưa lưu điểm")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PostMapping("/{assignmentId}/essay-drafts")
    ResponseEntity<List<EssayGrader.Draft>> essayDrafts(@PathVariable String assignmentId, @RequestParam String studentId);
}
