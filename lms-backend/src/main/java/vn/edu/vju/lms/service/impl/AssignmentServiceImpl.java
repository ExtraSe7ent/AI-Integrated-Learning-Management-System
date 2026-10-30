package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.service.AssignmentService;
import vn.edu.vju.lms.wrapper.AssignmentWrapper;

@Service
public class AssignmentServiceImpl extends AbstractCrudService<Assignment, AssignmentWrapper> implements AssignmentService {

    private final IAssignmentDao dao;

    public AssignmentServiceImpl(IAssignmentDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Assignment> dao() {
        return dao;
    }

    @Override
    protected Assignment newEntity() {
        return new Assignment();
    }

    @Override
    protected AssignmentWrapper toWrapper(Assignment entity) {
        AssignmentWrapper wrapper = new AssignmentWrapper();
        wrapper.setId(entity.getId());
        wrapper.setTitle(entity.getTitle());
        wrapper.setMinutes(entity.getMinutes());
        wrapper.setOpens(entity.getOpens());
        wrapper.setCloses(entity.getCloses());
        wrapper.setPublished(entity.getPublished());
        wrapper.setPreventPaste(entity.getPreventPaste());
        wrapper.setAttempts(entity.getAttempts());
        wrapper.setRandom(entity.getRandom());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(AssignmentWrapper wrapper, Assignment entity) {
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
        }
        if (wrapper.getMinutes() != null) {
            entity.setMinutes(wrapper.getMinutes());
        }
        if (wrapper.getOpens() != null) {
            entity.setOpens(wrapper.getOpens());
        }
        if (wrapper.getCloses() != null) {
            entity.setCloses(wrapper.getCloses());
        }
        if (wrapper.getPublished() != null) {
            entity.setPublished(wrapper.getPublished());
        }
        if (wrapper.getPreventPaste() != null) {
            entity.setPreventPaste(wrapper.getPreventPaste());
        }
        if (wrapper.getAttempts() != null) {
            entity.setAttempts(wrapper.getAttempts());
        }
        if (wrapper.getRandom() != null) {
            entity.setRandom(wrapper.getRandom());
        }
    }

    @Override
    protected String wrapperId(AssignmentWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Assignment entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy bài tập.";
    }

    @Override
    protected void beforeSave(Assignment entity) {
        if (entity.getOpens() != null && entity.getCloses() != null && entity.getCloses().compareTo(entity.getOpens()) <= 0) {
            throw new BusinessRuleException("Thời điểm đóng phải sau thời điểm mở.");
        }
    }
}
