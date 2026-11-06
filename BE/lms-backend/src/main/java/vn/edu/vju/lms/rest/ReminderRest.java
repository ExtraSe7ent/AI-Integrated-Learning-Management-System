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
import vn.edu.vju.lms.wrapper.ReminderWrapper;

@Tag(name = "Nhắc hạn")
@RequestMapping("/api/reminders")
public interface ReminderRest {

    @Operation(summary = "Lấy nhắc hạn theo id")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/{id}")
    ResponseEntity<ReminderWrapper> get(@PathVariable String id);

    @Operation(summary = "Danh sách toàn bộ nhắc hạn")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping
    ResponseEntity<List<ReminderWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang nhắc hạn")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/search")
    ResponseEntity<PageResponse<ReminderWrapper>> search(
            @Parameter(description = "Ví dụ: title~rest,published:true") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: title,asc;id,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo nhắc hạn")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @PostMapping
    ResponseEntity<ReminderWrapper> create(@Valid @RequestBody ReminderWrapper wrapper);

    @Operation(summary = "Cập nhật nhắc hạn, chỉ các trường khác null")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @PutMapping("/{id}")
    ResponseEntity<ReminderWrapper> update(@PathVariable String id, @RequestBody ReminderWrapper wrapper);

    @Operation(summary = "Xóa nhắc hạn")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm nhắc hạn")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN')")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
