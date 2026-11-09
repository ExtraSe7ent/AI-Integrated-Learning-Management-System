package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.entity.Course;
import vn.edu.vju.lms.service.CourseService;
import vn.edu.vju.lms.wrapper.CourseWrapper;

@Service
public class CourseServiceImpl extends AbstractCrudService<Course, CourseWrapper> implements CourseService {

    private final ICourseDao dao;
    private final IClassInfoDao classInfoDao;

    public CourseServiceImpl(ICourseDao dao, IClassInfoDao classInfoDao) {
        this.dao = dao;
        this.classInfoDao = classInfoDao;
    }

    @Override
    protected IGenericDao<String, Course> dao() {
        return dao;
    }

    @Override
    protected Course newEntity() {
        return new Course();
    }

    @Override
    protected CourseWrapper toWrapper(Course entity) {
        CourseWrapper wrapper = new CourseWrapper();
        wrapper.setId(entity.getId());
        wrapper.setCode(entity.getCode());
        wrapper.setTitle(entity.getTitle());
        wrapper.setFaculty(entity.getFaculty());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(CourseWrapper wrapper, Course entity) {
        if (wrapper.getCode() != null) {
            entity.setCode(wrapper.getCode());
        }
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
        }
        if (wrapper.getFaculty() != null) {
            entity.setFaculty(wrapper.getFaculty());
        }
    }

    @Override
    protected String wrapperId(CourseWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Course entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy học phần.";
    }

    @Override
    protected void beforeSave(Course entity) {
        entity.setCode(entity.getCode().trim());
        entity.setTitle(entity.getTitle().trim());
        entity.setFaculty(entity.getFaculty().trim());
        if (dao.existsOtherWithCode(entity.getId(), entity.getCode())) {
            throw new BusinessRuleException("Mã học phần đã tồn tại.");
        }
    }

    @Override
    protected void checkDelete(Course entity) {
        if (classInfoDao.existsByCourse(entity.getId())) {
            throw new BusinessRuleException("Học phần đang có lớp, không thể xóa.");
        }
    }
}
