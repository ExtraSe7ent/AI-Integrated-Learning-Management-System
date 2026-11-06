package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.INoticeDao;
import vn.edu.vju.lms.entity.Notice;
import vn.edu.vju.lms.service.NoticeService;
import vn.edu.vju.lms.wrapper.NoticeWrapper;

@Service
public class NoticeServiceImpl extends AbstractCrudService<Notice, NoticeWrapper> implements NoticeService {

    private final INoticeDao dao;

    public NoticeServiceImpl(INoticeDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Notice> dao() {
        return dao;
    }

    @Override
    protected Notice newEntity() {
        return new Notice();
    }

    @Override
    protected NoticeWrapper toWrapper(Notice entity) {
        NoticeWrapper wrapper = new NoticeWrapper();
        wrapper.setId(entity.getId());
        wrapper.setAudience(entity.getAudience());
        wrapper.setMessage(entity.getMessage());
        wrapper.setCreatedAt(entity.getCreatedAt());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(NoticeWrapper wrapper, Notice entity) {
        if (wrapper.getAudience() != null) {
            entity.setAudience(wrapper.getAudience());
        }
        if (wrapper.getMessage() != null) {
            entity.setMessage(wrapper.getMessage());
        }
        if (wrapper.getCreatedAt() != null) {
            entity.setCreatedAt(wrapper.getCreatedAt());
        }
    }

    @Override
    protected String wrapperId(NoticeWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Notice entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy thông báo.";
    }
}
