package vn.edu.vju.lms.service;

import vn.edu.vju.lms.wrapper.AuthWrappers.ChangePasswordRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginResponse;
import vn.edu.vju.lms.wrapper.AuthWrappers.PreferencesRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.ProfileRequest;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    UserAccountWrapper me();

    UserAccountWrapper changePassword(ChangePasswordRequest request);

    UserAccountWrapper updateProfile(ProfileRequest request);

    void updatePreferences(PreferencesRequest request);
}
