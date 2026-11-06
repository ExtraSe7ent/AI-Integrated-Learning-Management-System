package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
import vn.edu.vju.lms.wrapper.ClassInfoWrapper;

@Tag(name = "Lớp học")
@RequestMapping("/api/class-info")
public interface ClassInfoRest {

    String READ = "hasAnyRole('ADMIN','LECTURER','COURSE_LEADER','DEAN','STUDENT')";
    String WRITE = "hasAnyRole('ADMIN','LECTURER')";

    @Operation(summary = "Lấy lớp theo mã")
    @ApiResponse(responseCode = "200", description = "Tìm thấy lớp")
    @ApiResponse(responseCode = "404", description = "Lớp không tồn tại")
    @PreAuthorize(READ)
    @GetMapping("/{id}")
    ResponseEntity<ClassInfoWrapper> get(@PathVariable String id);

    @Operation(summary = "Lấy lớp theo tên")
    @PreAuthorize(READ)
    @GetMapping("/by-name")
    ResponseEntity<ClassInfoWrapper> getByName(@RequestParam String name);

    @Operation(summary = "Danh sách toàn bộ lớp")
    @PreAuthorize(READ)
    @GetMapping
    ResponseEntity<List<ClassInfoWrapper>> list();

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang lớp")
    @PreAuthorize(READ)
    @GetMapping("/search")
    ResponseEntity<PageResponse<ClassInfoWrapper>> search(
            @Parameter(description = "Ví dụ: name~CSE301,term:I") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Ví dụ: name,asc;year,desc") @RequestParam(required = false) String sort);

    @Operation(summary = "Tạo lớp")
    @PreAuthorize(WRITE)
    @PostMapping
    ResponseEntity<ClassInfoWrapper> create(@Valid @RequestBody ClassInfoWrapper wrapper);

    @Operation(summary = "Cập nhật lớp, chỉ các trường khác null")
    @PreAuthorize(WRITE)
    @PutMapping("/{id}")
    ResponseEntity<ClassInfoWrapper> update(@PathVariable String id, @RequestBody ClassInfoWrapper wrapper);

    @Operation(summary = "Ghi danh sinh viên vào lớp")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/enroll")
    ResponseEntity<ClassInfoWrapper> enroll(@PathVariable String id, @RequestBody List<String> studentIds);

    @Operation(summary = "Xóa lớp")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);

    @Operation(summary = "Đếm số lớp")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/count")
    ResponseEntity<Long> count();
}
