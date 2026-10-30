package vn.edu.vju.lms.rest.impl;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.rest.AuthRest;
import vn.edu.vju.lms.service.AuthService;
import vn.edu.vju.lms.service.BootstrapService;
import vn.edu.vju.lms.wrapper.AuthWrappers.ChangePasswordRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginResponse;
import vn.edu.vju.lms.wrapper.AuthWrappers.PreferencesRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.ProfileRequest;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

@RestController
public class AuthRestImpl implements AuthRest {

    private final AuthService authService;
    private final BootstrapService bootstrapService;

    public AuthRestImpl(AuthService authService, BootstrapService bootstrapService) {
        this.authService = authService;
        this.bootstrapService = bootstrapService;
    }

    @Override
    public ResponseEntity<LoginResponse> login(LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Override
    public ResponseEntity<UserAccountWrapper> me() {
        return ResponseEntity.ok(authService.me());
    }

    @Override
    public ResponseEntity<UserAccountWrapper> changePassword(ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(request));
    }

    @Override
    public ResponseEntity<UserAccountWrapper> updateProfile(ProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(request));
    }

    @Override
    public ResponseEntity<Void> updatePreferences(PreferencesRequest request) {
        authService.updatePreferences(request);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Map<String, Object>> bootstrap() {
        return ResponseEntity.ok(bootstrapService.load());
    }
}
