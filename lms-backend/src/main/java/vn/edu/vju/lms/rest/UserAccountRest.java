package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

@Tag(name = "Tài khoản")
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public interface UserAccountRest {

    @Operation(summary = "Tìm kiếm, sắp xếp và phân trang tài khoản")
    @GetMapping
    ResponseEntity<PageResponse<UserAccountWrapper>> search(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String sort);

    @Operation(summary = "Lấy tài khoản theo mã")
    @GetMapping("/{id}")
    ResponseEntity<UserAccountWrapper> get(@PathVariable String id);

    @Operation(summary = "Nhập danh sách tài khoản (lỗi một dòng thì không nhập dòng nào)")
    @PostMapping("/import")
    ResponseEntity<List<UserAccountWrapper>> importAccounts(@RequestBody List<UserAccountWrapper> rows);

    @Operation(summary = "Đổi vai trò hoặc trạng thái tài khoản")
    @PutMapping("/{id}")
    ResponseEntity<UserAccountWrapper> update(@PathVariable String id, @RequestBody UserAccountWrapper wrapper);

    @Operation(summary = "Đặt lại mật khẩu về mặc định và bắt buộc đổi")
    @PostMapping("/{id}/reset-password")
    ResponseEntity<UserAccountWrapper> resetPassword(@PathVariable String id);
}
