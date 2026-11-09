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
import vn.edu.vju.lms.wrapper.NoticeWrapper;

@Tag(name = "Thông báo")
@RequestMapping("/api/notices")
public interface NoticeRest {

    @Operation(summary = "Lấy thông báo theo id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    ResponseEntity<NoticeWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ thông báo")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<List<NoticeWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang thông báo")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    ResponseEntity<PageResponse<NoticeWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo thông báo")
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    ResponseEntity<NoticeWrapper> create(@Valid @RequestBody NoticeWrapper wrapper);

    @Operation(summary = "Cập nhật thông báo, chỉ các trường khác null")
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    ResponseEntity<NoticeWrapper> update(@PathVariable String id, @RequestBody NoticeWrapper wrapper);

    @Operation(summary = "Xóa thông báo")
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm thông báo")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
