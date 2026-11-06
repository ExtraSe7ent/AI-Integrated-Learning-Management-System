package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.StudySession;
import vn.edu.vju.lms.service.StudySessionService;
import vn.edu.vju.lms.wrapper.StudySessionWrapper;

@Service
public class StudySessionServiceImpl extends AbstractCrudService<StudySession, StudySessionWrapper> implements StudySessionService {

    private final IStudySessionDao dao;

    public StudySessionServiceImpl(IStudySessionDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, StudySession> dao() {
        return dao;
    }

    @Override
    protected StudySession newEntity() {
        return new StudySession();
    }

    @Override
    protected StudySessionWrapper toWrapper(StudySession entity) {
        StudySessionWrapper wrapper = new StudySessionWrapper();
        wrapper.setId(entity.getId());
        wrapper.setTitle(entity.getTitle());
        wrapper.setOpens(entity.getOpens());
        wrapper.setCloses(entity.getCloses());
        wrapper.setPublished(entity.getPublished());
        wrapper.setLate(entity.getLate());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(StudySessionWrapper wrapper, StudySession entity) {
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
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
        if (wrapper.getLate() != null) {
            entity.setLate(wrapper.getLate());
        }
    }

    @Override
    protected String wrapperId(StudySessionWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(StudySession entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy phiên tự học.";
    }

    @Override
    protected void beforeSave(StudySession entity) {
        if (entity.getOpens() != null && entity.getCloses() != null && entity.getCloses().compareTo(entity.getOpens()) <= 0) {
            throw new BusinessRuleException("Thời điểm đóng phải sau thời điểm mở.");
        }
    }
}
