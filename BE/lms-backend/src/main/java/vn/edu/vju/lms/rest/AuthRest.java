package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.edu.vju.lms.wrapper.AuthWrappers.ChangePasswordRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginResponse;
import vn.edu.vju.lms.wrapper.AuthWrappers.PreferencesRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.ProfileRequest;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

@Tag(name = "Xác thực và hồ sơ")
@RequestMapping("/api")
public interface AuthRest {

    @Operation(summary = "Đăng nhập, trả về JWT")
    @PostMapping("/auth/login")
    ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request);

    @Operation(summary = "Tài khoản đang đăng nhập")
    @GetMapping("/auth/me")
    ResponseEntity<UserAccountWrapper> me();

    @Operation(summary = "Đổi mật khẩu")
    @PostMapping("/auth/change-password")
    ResponseEntity<UserAccountWrapper> changePassword(@Valid @RequestBody ChangePasswordRequest request);

    @Operation(summary = "Cập nhật hồ sơ của chính mình")
    @PutMapping("/me/profile")
    ResponseEntity<UserAccountWrapper> updateProfile(@RequestBody ProfileRequest request);

    @Operation(summary = "Lưu ghi chú và trạng thái đã đọc thông báo")
    @PutMapping("/me/preferences")
    ResponseEntity<Void> updatePreferences(@RequestBody PreferencesRequest request);

    @Operation(summary = "Toàn bộ dữ liệu khởi tạo của giao diện, lọc theo vai trò")
    @GetMapping("/bootstrap")
    ResponseEntity<Map<String, Object>> bootstrap();
}
