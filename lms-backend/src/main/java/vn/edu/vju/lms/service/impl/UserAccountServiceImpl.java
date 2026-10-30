package vn.edu.vju.lms.service.impl;

import java.util.List;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.service.UserAccountService;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

@Service
public class UserAccountServiceImpl extends AbstractCrudService<UserAccount, UserAccountWrapper>
        implements UserAccountService {

    private static final List<Role> STAFF_ROLES = List.of(Role.LECTURER, Role.DEAN, Role.COURSE_LEADER);

    private final IUserAccountDao dao;
    private final PasswordEncoder passwordEncoder;
    private final AesService aesService;
    private final LmsProperties properties;

    public UserAccountServiceImpl(IUserAccountDao dao, PasswordEncoder passwordEncoder, AesService aesService,
            LmsProperties properties) {
        this.dao = dao;
        this.passwordEncoder = passwordEncoder;
        this.aesService = aesService;
        this.properties = properties;
    }

    @Override
    protected IGenericDao<String, UserAccount> dao() {
        return dao;
    }

    @Override
    protected UserAccount newEntity() {
        return new UserAccount();
    }

    @Override
    protected UserAccountWrapper toWrapper(UserAccount entity) {
        return toUserWrapper(entity);
    }

    static UserAccountWrapper toUserWrapper(UserAccount entity) {
        UserAccountWrapper wrapper = new UserAccountWrapper();
        wrapper.setId(entity.getId());
        wrapper.setName(entity.getName());
        wrapper.setEmail(entity.getEmail());
        wrapper.setPhone(entity.getPhone());
        wrapper.setFaculty(entity.getFaculty());
        wrapper.setMajor(entity.getMajor());
        wrapper.setKind(entity.getKind());
        wrapper.setRole(entity.getRole());
        wrapper.setActive(entity.isActive());
        wrapper.setMustChange(entity.isMustChange());
        return wrapper;
    }

    /** Admins may only change role and status; identity fields stay as imported. */
    @Override
    protected void mapWrapperToEntity(UserAccountWrapper wrapper, UserAccount entity) {
        if (wrapper.getRole() != null) {
            entity.setRole(wrapper.getRole());
        }
        if (wrapper.getActive() != null) {
            entity.setActive(wrapper.getActive());
        }
        if (wrapper.getMustChange() != null) {
            entity.setMustChange(wrapper.getMustChange());
        }
    }

    @Override
    protected String wrapperId(UserAccountWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(UserAccount entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy tài khoản.";
    }

    @Override
    protected void beforeCreate(UserAccountWrapper wrapper, UserAccount entity) {
        if (wrapper.getId() == null || !wrapper.getId().matches("^[\\p{L}\\p{N}_.-]+$")) {
            throw new BusinessRuleException("Mã không hợp lệ: " + wrapper.getId());
        }
        if (!StringUtils.hasText(wrapper.getName())) {
            throw new BusinessRuleException("Thiếu họ tên: " + wrapper.getId());
        }
        if (dao.findByIdIgnoreCase(wrapper.getId()).isPresent()) {
            throw new BusinessRuleException("Mã đã tồn tại: " + wrapper.getId());
        }
        if (wrapper.getEmail() == null || !wrapper.getEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new BusinessRuleException("Email không hợp lệ: " + wrapper.getId());
        }
        String hash = emailHash(wrapper.getEmail());
        if (dao.existsByEmailHash(hash)) {
            throw new BusinessRuleException("Email đã tồn tại: " + wrapper.getEmail());
        }
        boolean student = "student".equals(wrapper.getKind());
        if (!student && !"teacher".equals(wrapper.getKind())) {
            throw new BusinessRuleException("Loại tài khoản không hợp lệ.");
        }
        entity.setName(wrapper.getName().trim());
        entity.setEmail(wrapper.getEmail().trim());
        entity.setEmailHash(hash);
        entity.setPhone(wrapper.getPhone());
        entity.setFaculty(wrapper.getFaculty());
        entity.setKind(wrapper.getKind());
        entity.setRole(student ? Role.STUDENT : Role.LECTURER);
        entity.setActive(true);
        entity.setMustChange(true);
        entity.setPasswordHash(passwordEncoder.encode(properties.getDefaultPassword()));
    }

    @Override
    @Transactional
    public UserAccountWrapper update(String id, UserAccountWrapper wrapper) {
        UserAccount current = require(id);
        if ("admin".equals(current.getKind())) {
            throw new BusinessRuleException("Không thay đổi tài khoản quản trị tại đây.");
        }
        if (wrapper.getRole() != null && wrapper.getRole() != current.getRole()
                && (!"teacher".equals(current.getKind()) || !STAFF_ROLES.contains(wrapper.getRole()))) {
            throw new BusinessRuleException("Chỉ gán vai trò quản lý cho tài khoản giảng viên.");
        }
        return super.update(id, wrapper);
    }

    @Override
    @Transactional
    public void delete(String id) {
        throw new BusinessRuleException("Không xóa tài khoản; hãy vô hiệu hóa để giữ dữ liệu học tập.");
    }

    @Override
    @Transactional
    public List<UserAccountWrapper> importAccounts(List<UserAccountWrapper> rows) {
        if (rows.isEmpty()) {
            throw new BusinessRuleException("Tệp không có dòng dữ liệu.");
        }
        return rows.stream().map(this::create).toList();
    }

    @Override
    @Transactional
    public UserAccountWrapper resetPassword(String id) {
        UserAccount account = require(id);
        if ("admin".equals(account.getKind())) {
            throw new BusinessRuleException("Không thay đổi tài khoản quản trị tại đây.");
        }
        account.setPasswordHash(passwordEncoder.encode(properties.getDefaultPassword()));
        account.setMustChange(true);
        return toWrapper(dao.merge(account));
    }

    private String emailHash(String email) {
        return aesService.blindIndex(email.trim().toLowerCase(Locale.ROOT));
    }
}
