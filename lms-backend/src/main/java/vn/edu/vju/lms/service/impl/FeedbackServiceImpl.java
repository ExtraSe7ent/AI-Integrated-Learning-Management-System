package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IFeedbackDao;
import vn.edu.vju.lms.entity.Feedback;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.FeedbackService;
import vn.edu.vju.lms.wrapper.FeedbackWrapper;

@Service
public class FeedbackServiceImpl extends AbstractCrudService<Feedback, FeedbackWrapper> implements FeedbackService {

    private final IFeedbackDao dao;

    public FeedbackServiceImpl(IFeedbackDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Feedback> dao() {
        return dao;
    }

    @Override
    protected Feedback newEntity() {
        return new Feedback();
    }

    @Override
    protected FeedbackWrapper toWrapper(Feedback entity) {
        FeedbackWrapper wrapper = new FeedbackWrapper();
        wrapper.setId(entity.getId());
        wrapper.setOwnerId(entity.getOwnerId());
        wrapper.setStudent(entity.getStudent());
        wrapper.setCourse(entity.getCourse());
        wrapper.setLesson(entity.getLesson());
        wrapper.setCategory(entity.getCategory());
        wrapper.setBody(entity.getBody());
        wrapper.setImages(entity.getImages());
        wrapper.setImageIds(entity.getImageIds());
        wrapper.setResponse(entity.getResponse());
        wrapper.setResolved(entity.getResolved());
        wrapper.setDate(entity.getDate());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(FeedbackWrapper wrapper, Feedback entity) {
        if (wrapper.getStudent() != null) {
            entity.setStudent(wrapper.getStudent());
        }
        if (wrapper.getCourse() != null) {
            entity.setCourse(wrapper.getCourse());
        }
        if (wrapper.getLesson() != null) {
            entity.setLesson(wrapper.getLesson());
        }
        if (wrapper.getCategory() != null) {
            entity.setCategory(wrapper.getCategory());
        }
        if (wrapper.getBody() != null) {
            entity.setBody(wrapper.getBody());
        }
        if (wrapper.getImages() != null) {
            entity.setImages(wrapper.getImages());
        }
        if (wrapper.getImageIds() != null) {
            entity.setImageIds(wrapper.getImageIds());
        }
        if (wrapper.getResponse() != null) {
            entity.setResponse(wrapper.getResponse());
        }
        if (wrapper.getResolved() != null) {
            entity.setResolved(wrapper.getResolved());
        }
        if (wrapper.getDate() != null) {
            entity.setDate(wrapper.getDate());
        }
    }

    @Override
    protected String wrapperId(FeedbackWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Feedback entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy phản hồi.";
    }

    @Override
    protected void beforeCreate(FeedbackWrapper wrapper, Feedback entity) {
        entity.setOwnerId(UserPrincipal.current().id());
    }

    @Override
    @Transactional
    public FeedbackWrapper update(String id, FeedbackWrapper wrapper) {
        requireOwnerOrStaff(require(id));
        if (UserPrincipal.current().isStudent()) {
            wrapper.setResponse(null);
            wrapper.setResolved(null);
        }
        return super.update(id, wrapper);
    }

    @Override
    @Transactional
    public void delete(String id) {
        requireOwnerOrStaff(require(id));
        super.delete(id);
    }

    private void requireOwnerOrStaff(Feedback entity) {
        UserPrincipal user = UserPrincipal.current();
        if (user.isStudent() && !user.id().equals(entity.getOwnerId())) {
            throw new ForbiddenOperationException("Bạn chỉ được thao tác trên dữ liệu của mình.");
        }
    }
}
