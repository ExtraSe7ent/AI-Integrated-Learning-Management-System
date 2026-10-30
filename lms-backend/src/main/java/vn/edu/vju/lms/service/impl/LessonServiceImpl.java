package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.service.LessonService;
import vn.edu.vju.lms.wrapper.LessonWrapper;

@Service
public class LessonServiceImpl extends AbstractCrudService<Lesson, LessonWrapper> implements LessonService {

    private final ILessonDao dao;

    public LessonServiceImpl(ILessonDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Lesson> dao() {
        return dao;
    }

    @Override
    protected Lesson newEntity() {
        return new Lesson();
    }

    @Override
    protected LessonWrapper toWrapper(Lesson entity) {
        LessonWrapper wrapper = new LessonWrapper();
        wrapper.setId(entity.getId());
        wrapper.setClassId(entity.getClassId());
        wrapper.setTitle(entity.getTitle());
        wrapper.setOrder(entity.getOrder());
        wrapper.setPublished(entity.getPublished());
        wrapper.setActivity(entity.getActivity());
        wrapper.setSlides(entity.getSlides());
        wrapper.setVideo(entity.getVideo());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(LessonWrapper wrapper, Lesson entity) {
        if (wrapper.getClassId() != null) {
            entity.setClassId(wrapper.getClassId());
        }
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
        }
        if (wrapper.getOrder() != null) {
            entity.setOrder(wrapper.getOrder());
        }
        if (wrapper.getPublished() != null) {
            entity.setPublished(wrapper.getPublished());
        }
        if (wrapper.getActivity() != null) {
            entity.setActivity(wrapper.getActivity());
        }
        if (wrapper.getSlides() != null) {
            entity.setSlides(wrapper.getSlides());
        }
        if (wrapper.getVideo() != null) {
            entity.setVideo(wrapper.getVideo());
        }
    }

    @Override
    protected String wrapperId(LessonWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Lesson entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy bài học.";
    }

    @Override
    protected void beforeCreate(LessonWrapper wrapper, Lesson entity) {
        if (entity.getClassId() == null) {
            entity.setClassId("CSE301.01");
        }
    }
}
