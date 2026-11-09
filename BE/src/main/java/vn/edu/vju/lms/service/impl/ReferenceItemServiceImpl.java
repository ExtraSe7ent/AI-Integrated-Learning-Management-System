package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IReferenceItemDao;
import vn.edu.vju.lms.entity.ReferenceItem;
import vn.edu.vju.lms.service.ReferenceItemService;
import vn.edu.vju.lms.wrapper.ReferenceItemWrapper;

@Service
public class ReferenceItemServiceImpl extends AbstractCrudService<ReferenceItem, ReferenceItemWrapper> implements ReferenceItemService {

    private final IReferenceItemDao dao;

    public ReferenceItemServiceImpl(IReferenceItemDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, ReferenceItem> dao() {
        return dao;
    }

    @Override
    protected ReferenceItem newEntity() {
        return new ReferenceItem();
    }

    @Override
    protected ReferenceItemWrapper toWrapper(ReferenceItem entity) {
        ReferenceItemWrapper wrapper = new ReferenceItemWrapper();
        wrapper.setId(entity.getId());
        wrapper.setCourseId(entity.getCourseId());
        wrapper.setTitle(entity.getTitle());
        wrapper.setUrl(entity.getUrl());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(ReferenceItemWrapper wrapper, ReferenceItem entity) {
        if (wrapper.getCourseId() != null) {
            entity.setCourseId(wrapper.getCourseId());
        }
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
        }
        if (wrapper.getUrl() != null) {
            entity.setUrl(wrapper.getUrl());
        }
    }

    @Override
    protected String wrapperId(ReferenceItemWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(ReferenceItem entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy tài liệu tham chiếu.";
    }

    @Override
    protected void beforeSave(ReferenceItem entity) {
        String url = entity.getUrl();
        boolean safe = url.startsWith("/materials/") && !url.contains("..") || url.matches("(?i)^https?://[^\\s]+$");
        if (!safe) {
            throw new BusinessRuleException("Liên kết phải là HTTP/HTTPS hoặc PDF trong /materials/.");
        }
    }
}
