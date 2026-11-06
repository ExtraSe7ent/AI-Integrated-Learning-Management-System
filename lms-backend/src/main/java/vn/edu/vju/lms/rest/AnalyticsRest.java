package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.Report;

@Tag(name = "Phân tích học tập")
@RequestMapping("/api/analytics")
public interface AnalyticsRest {

    @Operation(summary = "Tiến độ, điểm và vùng yếu theo lớp trong phạm vi của người dùng")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping
    ResponseEntity<Report> report();
}
