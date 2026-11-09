package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import vn.edu.vju.lms.wrapper.MaterialWrapper;

@Tag(name = "Học liệu")
@RequestMapping("/api/materials")
public interface MaterialRest {

    String TEACHING = "hasAnyRole('ADMIN','LECTURER','COURSE_LEADER')";

    @Operation(summary = "Tải lên học liệu PDF hoặc video; tệp được mã hóa AES trước khi lưu")
    @PreAuthorize(TEACHING)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<MaterialWrapper> upload(@RequestParam String classId, @RequestParam String title,
            @RequestParam(defaultValue = "1") int weekNumber, @RequestPart MultipartFile file);

    @Operation(summary = "Thêm phiên bản mới")
    @PreAuthorize(TEACHING)
    @PostMapping(value = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<MaterialWrapper> addVersion(@PathVariable String id, @RequestPart MultipartFile file);

    @Operation(summary = "Danh sách học liệu của lớp")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<List<MaterialWrapper>> list(@RequestParam String classId);

    @Operation(summary = "Công bố học liệu")
    @PreAuthorize(TEACHING)
    @PostMapping("/{id}/publish")
    ResponseEntity<MaterialWrapper> publish(@PathVariable String id);

    @Operation(summary = "Ẩn học liệu")
    @PreAuthorize(TEACHING)
    @PostMapping("/{id}/unpublish")
    ResponseEntity<MaterialWrapper> unpublish(@PathVariable String id);

    @Operation(summary = "Lập chỉ mục RAG")
    @PreAuthorize(TEACHING)
    @PostMapping("/{id}/index")
    ResponseEntity<MaterialWrapper> index(@PathVariable String id);

    @Operation(summary = "Tải tệp đã giải mã, có kiểm tra quyền")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/file")
    ResponseEntity<StreamingResponseBody> file(@PathVariable String id);

    @Operation(summary = "Xóa học liệu")
    @PreAuthorize(TEACHING)
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable String id);
}
