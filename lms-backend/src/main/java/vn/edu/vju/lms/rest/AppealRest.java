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
import vn.edu.vju.lms.wrapper.AppealWrapper;

@Tag(name = "Phúc khảo")
@RequestMapping("/api/appeals")
public interface AppealRest {

    @Operation(summary = "Lấy yêu cầu phúc khảo theo id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    ResponseEntity<AppealWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ yêu cầu phúc khảo")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<List<AppealWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang yêu cầu phúc khảo")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    ResponseEntity<PageResponse<AppealWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo yêu cầu phúc khảo")
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    ResponseEntity<AppealWrapper> create(@Valid @RequestBody AppealWrapper wrapper);

    @Operation(summary = "Cập nhật yêu cầu phúc khảo, chỉ các trường khác null")
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    ResponseEntity<AppealWrapper> update(@PathVariable String id, @RequestBody AppealWrapper wrapper);

    @Operation(summary = "Xóa yêu cầu phúc khảo")
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm yêu cầu phúc khảo")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
