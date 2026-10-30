package vn.edu.vju.lms.service.impl;

import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.JwtService;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.AuthService;
import vn.edu.vju.lms.wrapper.AuthWrappers.ChangePasswordRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.LoginResponse;
import vn.edu.vju.lms.wrapper.AuthWrappers.PreferencesRequest;
import vn.edu.vju.lms.wrapper.AuthWrappers.ProfileRequest;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final IUserAccountDao userDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AesService aesService;

    public AuthServiceImpl(IUserAccountDao userDao, PasswordEncoder passwordEncoder, JwtService jwtService,
            AesService aesService) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.aesService = aesService;
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        UserAccount account = userDao.findByIdIgnoreCase(request.username().trim())
                .filter(UserAccount::isActive)
                .filter(user -> passwordEncoder.matches(request.password(), user.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Sai thông tin đăng nhập."));
        log.info("User {} logged in", account.getId());
        return new LoginResponse(jwtService.issue(account.getId()), UserAccountServiceImpl.toUserWrapper(account));
    }

    @Override
    @Transactional(readOnly = true)
    public UserAccountWrapper me() {
        return UserAccountServiceImpl.toUserWrapper(currentAccount());
    }

    @Override
    @Transactional
    public UserAccountWrapper changePassword(ChangePasswordRequest request) {
        UserAccount account = currentAccount();
        String next = request.newPassword();
        if (!account.isMustChange()
                && (request.oldPassword() == null || !passwordEncoder.matches(request.oldPassword(), account.getPasswordHash()))) {
            throw new BusinessRuleException("Mật khẩu hiện tại không đúng.");
        }
        if (next.length() < 8) {
            throw new BusinessRuleException("Mật khẩu mới cần ít nhất 8 ký tự.");
        }
        if (passwordEncoder.matches(next, account.getPasswordHash())) {
            throw new BusinessRuleException("Chọn mật khẩu mới khác mật khẩu hiện tại.");
        }
        account.setPasswordHash(passwordEncoder.encode(next));
        account.setMustChange(false);
        return UserAccountServiceImpl.toUserWrapper(userDao.merge(account));
    }

    @Override
    @Transactional
    public UserAccountWrapper updateProfile(ProfileRequest request) {
        UserAccount account = currentAccount();
        if (StringUtils.hasText(request.name())) {
            account.setName(request.name().trim());
        }
        if (StringUtils.hasText(request.email()) && !request.email().trim().equalsIgnoreCase(account.getEmail())) {
            String hash = aesService.blindIndex(request.email().trim().toLowerCase(Locale.ROOT));
            if (userDao.existsByEmailHash(hash)) {
                throw new BusinessRuleException("Email đã được sử dụng.");
            }
            account.setEmail(request.email().trim());
            account.setEmailHash(hash);
        }
        if (request.phone() != null) {
            account.setPhone(request.phone().trim());
        }
        if (request.major() != null) {
            account.setMajor(request.major().trim());
        }
        return UserAccountServiceImpl.toUserWrapper(userDao.merge(account));
    }

    @Override
    @Transactional
    public void updatePreferences(PreferencesRequest request) {
        UserAccount account = currentAccount();
        if (request.notes() != null) {
            account.setNotes(request.notes());
        }
        if (request.noticesRead() != null) {
            account.setNoticesRead(request.noticesRead());
        }
        userDao.merge(account);
    }

    private UserAccount currentAccount() {
        return userDao.findById(UserPrincipal.current().id())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
    }
}
