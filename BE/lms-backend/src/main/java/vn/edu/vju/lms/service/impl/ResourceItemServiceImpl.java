package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IResourceItemDao;
import vn.edu.vju.lms.entity.ResourceItem;
import vn.edu.vju.lms.service.ResourceItemService;
import vn.edu.vju.lms.wrapper.ResourceItemWrapper;

@Service
public class ResourceItemServiceImpl extends AbstractCrudService<ResourceItem, ResourceItemWrapper> implements ResourceItemService {

    private final IResourceItemDao dao;

    public ResourceItemServiceImpl(IResourceItemDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, ResourceItem> dao() {
        return dao;
    }

    @Override
    protected ResourceItem newEntity() {
        return new ResourceItem();
    }

    @Override
    protected ResourceItemWrapper toWrapper(ResourceItem entity) {
        ResourceItemWrapper wrapper = new ResourceItemWrapper();
        wrapper.setId(entity.getId());
        wrapper.setTitle(entity.getTitle());
        wrapper.setDescription(entity.getDescription());
        wrapper.setUrl(entity.getUrl());
        wrapper.setKind(entity.getKind());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(ResourceItemWrapper wrapper, ResourceItem entity) {
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
        }
        if (wrapper.getDescription() != null) {
            entity.setDescription(wrapper.getDescription());
        }
        if (wrapper.getUrl() != null) {
            entity.setUrl(wrapper.getUrl());
        }
        if (wrapper.getKind() != null) {
            entity.setKind(wrapper.getKind());
        }
    }

    @Override
    protected String wrapperId(ResourceItemWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(ResourceItem entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy tài liệu.";
    }
}
