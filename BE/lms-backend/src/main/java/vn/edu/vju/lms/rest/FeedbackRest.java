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
import vn.edu.vju.lms.wrapper.FeedbackWrapper;

@Tag(name = "Phản hồi")
@RequestMapping("/api/feedback")
public interface FeedbackRest {

    @Operation(summary = "Lấy phản hồi theo id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    ResponseEntity<FeedbackWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ phản hồi")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<List<FeedbackWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang phản hồi")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    ResponseEntity<PageResponse<FeedbackWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo phản hồi")
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    ResponseEntity<FeedbackWrapper> create(@Valid @RequestBody FeedbackWrapper wrapper);

    @Operation(summary = "Cập nhật phản hồi, chỉ các trường khác null")
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    ResponseEntity<FeedbackWrapper> update(@PathVariable String id, @RequestBody FeedbackWrapper wrapper);

    @Operation(summary = "Xóa phản hồi")
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm phản hồi")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
