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
import vn.edu.vju.lms.wrapper.QuestionWrapper;

@Tag(name = "Ngân hàng câu hỏi")
@RequestMapping("/api/questions")
public interface QuestionRest {

    @Operation(summary = "Lấy câu hỏi theo id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    ResponseEntity<QuestionWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ câu hỏi")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<List<QuestionWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang câu hỏi")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    ResponseEntity<PageResponse<QuestionWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo câu hỏi")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PostMapping
    ResponseEntity<QuestionWrapper> create(@Valid @RequestBody QuestionWrapper wrapper);

    @Operation(summary = "Cập nhật câu hỏi, chỉ các trường khác null")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PutMapping("/{id}")
    ResponseEntity<QuestionWrapper> update(@PathVariable String id, @RequestBody QuestionWrapper wrapper);

    @Operation(summary = "Xóa câu hỏi")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm câu hỏi")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
