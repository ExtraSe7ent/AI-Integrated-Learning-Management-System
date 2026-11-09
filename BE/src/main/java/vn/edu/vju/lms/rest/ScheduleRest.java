package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.wrapper.ScheduleWrapper;

@Tag(name = "Lịch học")
@RequestMapping("/api/schedules")
public interface ScheduleRest {

    @Operation(summary = "Lấy lịch học theo id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    ResponseEntity<ScheduleWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ lịch học")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<List<ScheduleWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang lịch học")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    ResponseEntity<PageResponse<ScheduleWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo lịch học")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PostMapping
    ResponseEntity<ScheduleWrapper> create(@Valid @RequestBody ScheduleWrapper wrapper);

    @Operation(summary = "Cập nhật lịch học, chỉ các trường khác null")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PutMapping("/{id}")
    ResponseEntity<ScheduleWrapper> update(@PathVariable String id, @RequestBody ScheduleWrapper wrapper);

    @Operation(summary = "Xóa lịch học")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm lịch học")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
