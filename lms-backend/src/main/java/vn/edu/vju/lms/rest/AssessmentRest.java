package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
