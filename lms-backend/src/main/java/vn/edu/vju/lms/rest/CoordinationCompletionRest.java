package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Tag(name = "Điều phối học liệu")
@RequestMapping("/api/coordination/completed")
@PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
public interface CoordinationCompletionRest {

    @Operation(summary = "Đánh dấu lớp đã hoàn thành chuẩn hóa")
    @PutMapping("/{classId}")
    ResponseEntity<Void> complete(@PathVariable String classId);

    @Operation(summary = "Bỏ dấu hoàn thành của lớp")
    @DeleteMapping("/{classId}")
    ResponseEntity<Void> reopen(@PathVariable String classId);
}
