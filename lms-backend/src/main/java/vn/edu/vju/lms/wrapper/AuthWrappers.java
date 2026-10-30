package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;

public final class AuthWrappers {

    private AuthWrappers() {
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record LoginResponse(String token, UserAccountWrapper account) {
    }

    public record ChangePasswordRequest(String oldPassword, @NotBlank String newPassword) {
    }

    public record ProfileRequest(String name, String email, String phone, String major) {
    }

    public record PreferencesRequest(String notes, Boolean noticesRead) {
    }
}
