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
import vn.edu.vju.lms.wrapper.ReferenceItemWrapper;

@Tag(name = "Điều phối học liệu")
@RequestMapping("/api/coordination/references")
public interface ReferenceItemRest {

    @Operation(summary = "Lấy tài liệu tham chiếu theo id")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/{id}")
    ResponseEntity<ReferenceItemWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ tài liệu tham chiếu")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping
    ResponseEntity<List<ReferenceItemWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang tài liệu tham chiếu")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/search")
    ResponseEntity<PageResponse<ReferenceItemWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo tài liệu tham chiếu")
    @PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
    @PostMapping
    ResponseEntity<ReferenceItemWrapper> create(@Valid @RequestBody ReferenceItemWrapper wrapper);

    @Operation(summary = "Cập nhật tài liệu tham chiếu, chỉ các trường khác null")
    @PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
    @PutMapping("/{id}")
    ResponseEntity<ReferenceItemWrapper> update(@PathVariable String id, @RequestBody ReferenceItemWrapper wrapper);

    @Operation(summary = "Xóa tài liệu tham chiếu")
    @PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm tài liệu tham chiếu")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
