package vn.edu.vju.lms.service.impl;

import java.util.List;
import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IAttendanceDao;
import vn.edu.vju.lms.entity.Attendance;
import vn.edu.vju.lms.service.AttendanceService;
import vn.edu.vju.lms.wrapper.AttendanceWrapper;

@Service
public class AttendanceServiceImpl extends AbstractCrudService<Attendance, AttendanceWrapper> implements AttendanceService {

    private final IAttendanceDao dao;

    public AttendanceServiceImpl(IAttendanceDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Attendance> dao() {
        return dao;
    }

    @Override
    protected Attendance newEntity() {
        return new Attendance();
    }

    @Override
    protected AttendanceWrapper toWrapper(Attendance entity) {
        AttendanceWrapper wrapper = new AttendanceWrapper();
        wrapper.setId(entity.getId());
        wrapper.setClassId(entity.getClassId());
        wrapper.setStudentId(entity.getStudentId());
        wrapper.setDate(entity.getDate());
        wrapper.setStatus(entity.getStatus());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(AttendanceWrapper wrapper, Attendance entity) {
        if (wrapper.getClassId() != null) {
            entity.setClassId(wrapper.getClassId());
        }
        if (wrapper.getStudentId() != null) {
            entity.setStudentId(wrapper.getStudentId());
        }
        if (wrapper.getDate() != null) {
            entity.setDate(wrapper.getDate());
        }
        if (wrapper.getStatus() != null) {
            entity.setStatus(wrapper.getStatus());
        }
    }

    @Override
    protected String wrapperId(AttendanceWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Attendance entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy bản ghi điểm danh.";
    }

    @Override
    protected void beforeSave(Attendance entity) {
        if (!List.of("present", "late", "excused", "absent").contains(entity.getStatus())) {
            throw new BusinessRuleException("Trạng thái điểm danh không hợp lệ.");
        }
    }
}
