package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IChangeRequestDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ICoordinationItemDao;
import vn.edu.vju.lms.entity.ChangeRequest;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.ChangeRequestService;
import vn.edu.vju.lms.wrapper.ChangeRequestWrapper;

@Service
public class ChangeRequestServiceImpl extends AbstractCrudService<ChangeRequest, ChangeRequestWrapper> implements ChangeRequestService {

    private final IChangeRequestDao dao;
    private final ICoordinationItemDao itemDao;
    private final IClassInfoDao classInfoDao;

    public ChangeRequestServiceImpl(IChangeRequestDao dao, ICoordinationItemDao itemDao, IClassInfoDao classInfoDao) {
        this.dao = dao;
        this.itemDao = itemDao;
        this.classInfoDao = classInfoDao;
    }

    @Override
    protected IGenericDao<String, ChangeRequest> dao() {
        return dao;
    }

    @Override
    protected ChangeRequest newEntity() {
        return new ChangeRequest();
    }

    @Override
    protected ChangeRequestWrapper toWrapper(ChangeRequest entity) {
        ChangeRequestWrapper wrapper = new ChangeRequestWrapper();
        wrapper.setId(entity.getId());
        wrapper.setItemId(entity.getItemId());
        wrapper.setBody(entity.getBody());
        wrapper.setReply(entity.getReply());
        wrapper.setClosed(entity.getClosed());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(ChangeRequestWrapper wrapper, ChangeRequest entity) {
        if (wrapper.getItemId() != null) {
            entity.setItemId(wrapper.getItemId());
        }
        if (wrapper.getBody() != null) {
            entity.setBody(wrapper.getBody());
        }
        if (wrapper.getReply() != null) {
            entity.setReply(wrapper.getReply());
        }
        if (wrapper.getClosed() != null) {
            entity.setClosed(wrapper.getClosed());
        }
    }

    @Override
    protected String wrapperId(ChangeRequestWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(ChangeRequest entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy yêu cầu điều chỉnh.";
    }

    @Override
    protected void beforeCreate(ChangeRequestWrapper wrapper, ChangeRequest entity) {
        if (entity.getClosed() == null) {
            entity.setClosed(false);
        }
        if (itemDao.findById(entity.getItemId()).isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy học liệu trong phạm vi này.");
        }
        if (dao.hasUnansweredRequest(entity.getItemId())) {
            throw new BusinessRuleException("Chờ giảng viên phản hồi yêu cầu hiện tại trước.");
        }
    }

    @Override
    @Transactional
    public ChangeRequestWrapper update(String id, ChangeRequestWrapper wrapper) {
        ChangeRequest current = require(id);
        boolean replying = wrapper.getReply() != null && !wrapper.getReply().equals(current.getReply());
        UserPrincipal user = UserPrincipal.current();
        if (replying && user.role() == Role.LECTURER) {
            var item = itemDao.findById(current.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học liệu trong phạm vi này."));
            boolean ownsClass = classInfoDao.findById(item.getClassId())
                    .map(c -> user.id().equals(c.getTeacherId())).orElse(false);
            if (!ownsClass) {
                throw new ForbiddenOperationException("Không có quyền xử lý yêu cầu này.");
            }
        }
        return super.update(id, wrapper);
    }
}
