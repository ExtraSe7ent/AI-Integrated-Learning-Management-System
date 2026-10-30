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
import vn.edu.vju.lms.wrapper.ResourceItemWrapper;

@Tag(name = "Tài liệu tham khảo")
@RequestMapping("/api/resources")
public interface ResourceItemRest {

    @Operation(summary = "Lấy tài liệu theo id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    ResponseEntity<ResourceItemWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ tài liệu")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<List<ResourceItemWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang tài liệu")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    ResponseEntity<PageResponse<ResourceItemWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo tài liệu")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PostMapping
    ResponseEntity<ResourceItemWrapper> create(@Valid @RequestBody ResourceItemWrapper wrapper);

    @Operation(summary = "Cập nhật tài liệu, chỉ các trường khác null")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PutMapping("/{id}")
    ResponseEntity<ResourceItemWrapper> update(@PathVariable String id, @RequestBody ResourceItemWrapper wrapper);

    @Operation(summary = "Xóa tài liệu")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm tài liệu")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
