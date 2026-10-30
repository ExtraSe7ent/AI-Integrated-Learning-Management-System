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
import vn.edu.vju.lms.wrapper.ChangeRequestWrapper;

@Tag(name = "Điều phối học liệu")
@RequestMapping("/api/coordination/requests")
public interface ChangeRequestRest {

    @Operation(summary = "Lấy yêu cầu điều chỉnh theo id")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/{id}")
    ResponseEntity<ChangeRequestWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ yêu cầu điều chỉnh")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping
    ResponseEntity<List<ChangeRequestWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang yêu cầu điều chỉnh")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/search")
    ResponseEntity<PageResponse<ChangeRequestWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo yêu cầu điều chỉnh")
    @PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
    @PostMapping
    ResponseEntity<ChangeRequestWrapper> create(@Valid @RequestBody ChangeRequestWrapper wrapper);

    @Operation(summary = "Cập nhật yêu cầu điều chỉnh, chỉ các trường khác null")
    @PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
    @PutMapping("/{id}")
    ResponseEntity<ChangeRequestWrapper> update(@PathVariable String id, @RequestBody ChangeRequestWrapper wrapper);

    @Operation(summary = "Xóa yêu cầu điều chỉnh")
    @PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm yêu cầu điều chỉnh")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
