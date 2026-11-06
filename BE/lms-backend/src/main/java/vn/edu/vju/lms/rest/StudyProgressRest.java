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
import vn.edu.vju.lms.wrapper.StudyProgressWrapper;

@Tag(name = "Tiến độ tự học")
@RequestMapping("/api/study-progress")
public interface StudyProgressRest {

    @Operation(summary = "Tiến độ theo mã phiên tự học")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<Map<String, StudyProgressWrapper>> list();

    @Operation(summary = "Lưu tiến độ của chính sinh viên")
    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/{sessionId}")
    ResponseEntity<StudyProgressWrapper> save(@PathVariable String sessionId, @RequestBody StudyProgressWrapper wrapper);
}
