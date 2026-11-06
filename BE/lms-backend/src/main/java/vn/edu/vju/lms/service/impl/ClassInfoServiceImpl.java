package vn.edu.vju.lms.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.service.ClassInfoService;
import vn.edu.vju.lms.wrapper.ClassInfoWrapper;

@Service
public class ClassInfoServiceImpl extends AbstractCrudService<ClassInfo, ClassInfoWrapper> implements ClassInfoService {

    private final IClassInfoDao classInfoDao;
    private final ICourseDao courseDao;
    private final IUserAccountDao userDao;

    public ClassInfoServiceImpl(IClassInfoDao classInfoDao, ICourseDao courseDao, IUserAccountDao userDao) {
        this.classInfoDao = classInfoDao;
        this.courseDao = courseDao;
        this.userDao = userDao;
    }

    @Override
    protected IGenericDao<String, ClassInfo> dao() {
        return classInfoDao;
    }

    @Override
    protected ClassInfo newEntity() {
        return new ClassInfo();
    }

    @Override
    protected ClassInfoWrapper toWrapper(ClassInfo entity) {
        ClassInfoWrapper wrapper = new ClassInfoWrapper();
        wrapper.setId(entity.getId());
        wrapper.setCourseId(entity.getCourseId());
        wrapper.setName(entity.getName());
        wrapper.setTerm(entity.getTerm());
        wrapper.setYear(entity.getYear());
        wrapper.setRound(entity.getRound());
        wrapper.setTeacherId(entity.getTeacherId());
        wrapper.setLeaderId(entity.getLeaderId());
        wrapper.setStudentIds(new ArrayList<>(entity.getStudentIds()));
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(ClassInfoWrapper wrapper, ClassInfo entity) {
        if (wrapper.getCourseId() != null) {
            entity.setCourseId(wrapper.getCourseId());
        }
        if (wrapper.getName() != null) {
            entity.setName(wrapper.getName().trim());
        }
        if (wrapper.getTerm() != null) {
            entity.setTerm(wrapper.getTerm());
        }
        if (wrapper.getYear() != null) {
            entity.setYear(wrapper.getYear());
        }
        if (wrapper.getRound() != null) {
            entity.setRound(wrapper.getRound());
        }
        if (wrapper.getTeacherId() != null) {
            entity.setTeacherId(wrapper.getTeacherId());
        }
        if (wrapper.getLeaderId() != null) {
            entity.setLeaderId(wrapper.getLeaderId());
        }
    }

    @Override
    protected String wrapperId(ClassInfoWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(ClassInfo entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Lớp không tồn tại.";
    }

    @Override
    protected void beforeCreate(ClassInfoWrapper wrapper, ClassInfo entity) {
        if (wrapper.getStudentIds() != null) {
            entity.setStudentIds(new ArrayList<>(new LinkedHashSet<>(wrapper.getStudentIds())));
        }
    }

    @Override
    protected void beforeSave(ClassInfo entity) {
        if (courseDao.findById(entity.getCourseId()).isEmpty()) {
            throw new BusinessRuleException("Học phần không tồn tại.");
        }
        if (!StringUtils.hasText(entity.getName()) || !StringUtils.hasText(entity.getTerm())
                || entity.getYear() == null || !entity.getYear().matches("\\d{4}[–-]\\d{4}")
                || entity.getRound() == null || !entity.getRound().matches("[1-9]\\d*")) {
            throw new BusinessRuleException("Nhập tên lớp, học kỳ, năm học dạng 2026–2027 và đợt hợp lệ.");
        }
        if (classInfoDao.existsDuplicate(entity.getId(), entity.getName(), entity.getTerm(), entity.getYear(), entity.getRound())) {
            throw new BusinessRuleException("Lớp đã tồn tại trong kỳ và đợt này.");
        }
        boolean teacher = StringUtils.hasText(entity.getTeacherId())
                && userDao.findById(entity.getTeacherId())
                        .filter(user -> "teacher".equals(user.getKind()) && user.isActive()).isPresent();
        if (!teacher) {
            throw new BusinessRuleException("Chọn giảng viên đang hoạt động.");
        }
        boolean leader = !StringUtils.hasText(entity.getLeaderId())
                || userDao.findById(entity.getLeaderId())
                        .filter(user -> user.getRole() == Role.COURSE_LEADER && user.isActive()).isPresent();
        if (!leader) {
            throw new BusinessRuleException("Chọn Trưởng nhóm HP đang hoạt động.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ClassInfoWrapper getByName(String name) {
        return classInfoDao.findByName(name).map(this::toWrapper)
                .orElseThrow(() -> new ResourceNotFoundException(notFoundMessage()));
    }

    @Override
    @Transactional
    public ClassInfoWrapper enroll(String classId, List<String> studentIds) {
        ClassInfo entity = require(classId);
        if (studentIds == null || studentIds.isEmpty()) {
            throw new BusinessRuleException("Danh sách trống hoặc có dòng lỗi.");
        }
        Set<String> seen = new LinkedHashSet<>(entity.getStudentIds());
        for (String id : studentIds) {
            boolean valid = userDao.findById(id)
                    .filter(user -> "student".equals(user.getKind()) && user.isActive()).isPresent();
            if (!valid) {
                throw new BusinessRuleException("Không có tài khoản SV đang hoạt động: " + id);
            }
            if (!seen.add(id)) {
                throw new BusinessRuleException("Sinh viên đã có trong lớp hoặc trùng tệp: " + id);
            }
        }
        entity.getStudentIds().clear();
        entity.getStudentIds().addAll(seen);
        return toWrapper(classInfoDao.merge(entity));
    }
}
